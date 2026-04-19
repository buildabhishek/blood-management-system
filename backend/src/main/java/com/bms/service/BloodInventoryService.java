package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.BloodInventoryRepository;
import com.bms.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class BloodInventoryService {

    private final BloodInventoryRepository inventoryRepo;
    private final UserRepository userRepo;

    public BloodInventoryService(BloodInventoryRepository inventoryRepo, UserRepository userRepo) {
        this.inventoryRepo = inventoryRepo;
        this.userRepo = userRepo;
    }

    public BloodInventory addBlood(BloodInventory inventory, String bloodBankPhone) {
        User bloodBank = userRepo.findByPhone(bloodBankPhone)
                .orElseThrow(() -> new RuntimeException("Blood bank not found"));
        inventory.setBloodBank(bloodBank);
        return inventoryRepo.save(inventory);
    }

    public List<BloodInventory> getMyInventory(String bloodBankPhone) {
        return inventoryRepo.findByBloodBank_Phone(bloodBankPhone);
    }

    public Page<BloodInventory> getAll(int page, int size) {
        return inventoryRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    /**
     * Search available blood by group + quantity, optionally sorted by distance
     * from the requesting hospital's coordinates.
     */
    public List<BloodInventory> getAvailableBlood(BloodGroup bloodGroup, int quantity,
                                                    Double reqLat, Double reqLng) {
        LocalDate today = LocalDate.now();
        List<BloodInventory> results = inventoryRepo
                .findByBloodGroupAndQuantityGreaterThanEqual(bloodGroup, quantity)
                .stream()
                .filter(inv -> inv.getExpiryDate() == null || !inv.getExpiryDate().isBefore(today))
                .toList();

        // Sort by distance if requester coordinates are available
        if (reqLat != null && reqLng != null) {
            results = results.stream()
                .sorted(Comparator.comparingDouble(inv -> {
                    Double lat = inv.getLatitude();
                    Double lng = inv.getLongitude();
                    if (lat == null || lng == null) return Double.MAX_VALUE;
                    return haversineKm(reqLat, reqLng, lat, lng);
                }))
                .toList();
        }
        return results;
    }

    @Transactional
    public void deductStockFromBank(Long bloodBankId, BloodGroup bloodGroup, int quantityNeeded) {
        LocalDate today = LocalDate.now();
        List<BloodInventory> rows = inventoryRepo
                .findAllByBloodBank_IdAndBloodGroup(bloodBankId, bloodGroup)
                .stream()
                .filter(inv -> inv.getExpiryDate() == null || !inv.getExpiryDate().isBefore(today))
                .sorted(Comparator.comparing(inv -> inv.getExpiryDate() == null
                        ? LocalDate.MAX : inv.getExpiryDate()))
                .toList();

        int totalAvailable = rows.stream().mapToInt(BloodInventory::getQuantity).sum();
        if (totalAvailable < quantityNeeded)
            throw new RuntimeException("Insufficient stock: only " + totalAvailable
                    + " units of " + bloodGroup.getLabel() + " available.");

        int remaining = quantityNeeded;
        for (BloodInventory row : rows) {
            if (remaining <= 0) break;
            int deduct = Math.min(row.getQuantity(), remaining);
            row.setQuantity(row.getQuantity() - deduct);
            remaining -= deduct;
            inventoryRepo.save(row);
        }
    }

    /** Haversine formula — returns distance in kilometres */
    public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
