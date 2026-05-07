package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.*;
import com.bms.dto.InventoryUpdateDto;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BloodInventoryService {

    private final BloodInventoryRepository invRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;

    public BloodInventoryService(BloodInventoryRepository invRepo, UserRepository userRepo,
                                 NotificationService notifService) {
        this.invRepo = invRepo;
        this.userRepo = userRepo;
        this.notifService = notifService;
    }

    public BloodInventory add(BloodInventory inv, String bankPhone) {
        User bank = userRepo.findByPhone(bankPhone).orElseThrow(() -> new RuntimeException("Blood bank not found."));
        inv.setBloodBank(bank);
        return invRepo.save(inv);
    }

    public List<BloodInventory> getMyInventory(String bankPhone) {
        return invRepo.findByBloodBank_PhoneOrderByCreatedAtDesc(bankPhone);
    }

    public Page<BloodInventory> getAll(int page, int size) {
        return invRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // BUG FIX: switched from BloodInventory entity to InventoryUpdateDto so
    // quantity is Integer (nullable). Using the entity directly caused quantity=0
    // (primitive default) to be indistinguishable from "not provided by client".
    public BloodInventory update(Long id, InventoryUpdateDto updated, String bankPhone) {
        BloodInventory existing = invRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Inventory record not found."));
        if (!existing.getBloodBank().getPhone().equals(bankPhone))
            throw new RuntimeException("Access denied.");
        if (updated.getBloodGroup()    != null) existing.setBloodGroup(updated.getBloodGroup());
        if (updated.getCategory()      != null) existing.setCategory(updated.getCategory());
        if (updated.getQuantity()      != null && updated.getQuantity() >= 0)
            existing.setQuantity(updated.getQuantity());   // allows zeroing stock intentionally
        if (updated.getCollectionDate() != null) existing.setCollectionDate(updated.getCollectionDate());
        if (updated.getExpiryDate()     != null) existing.setExpiryDate(updated.getExpiryDate());
        if (updated.getUnitId()         != null) existing.setUnitId(updated.getUnitId());
        if (updated.getVolumeMl()       != null) existing.setVolumeMl(updated.getVolumeMl());
        // BUG FIX: only update threshold when client explicitly sends a positive value
        if (updated.getLowStockThreshold() > 0)
            existing.setLowStockThreshold(updated.getLowStockThreshold());
        return invRepo.save(existing);
    }

    public void delete(Long id, String bankPhone) {
        BloodInventory inv = invRepo.findById(id).orElseThrow(() -> new RuntimeException("Record not found."));
        if (!inv.getBloodBank().getPhone().equals(bankPhone)) throw new RuntimeException("Access denied.");
        invRepo.deleteById(id);
    }

    /**
     * Search available blood by group + quantity + optional component, sorted by distance.
     * BUG FIX: component filter was accepted by the controller but never applied in the service.
     */
    public List<BloodInventory> search(BloodGroup bg, int qty, Double reqLat, Double reqLng, String component) {
        LocalDate today = LocalDate.now();

        // Aggregate by blood bank (and component when specified)
        Map<Long, BloodInventory> bankMap = new LinkedHashMap<>();

        invRepo.findByBloodGroupAndQuantityGreaterThanEqual(bg, 1).stream()
            .filter(inv -> inv.getExpiryDate() == null || !inv.getExpiryDate().isBefore(today))
            // BUG FIX: apply component filter if provided
            .filter(inv -> component == null || component.isBlank() ||
                          component.equalsIgnoreCase(inv.getCategory()))
            .forEach(inv -> {
                Long bankId = inv.getBloodBankId();
                if (bankId == null) return;
                if (bankMap.containsKey(bankId)) {
                    bankMap.get(bankId).setQuantity(bankMap.get(bankId).getQuantity() + inv.getQuantity());
                } else {
                    BloodInventory agg = new BloodInventory();
                    agg.setBloodGroup(inv.getBloodGroup());
                    agg.setQuantity(inv.getQuantity());
                    agg.setCategory(inv.getCategory());
                    agg.setBloodBank(inv.getBloodBank());
                    bankMap.put(bankId, agg);
                }
            });

        List<BloodInventory> results = bankMap.values().stream()
            .filter(inv -> inv.getQuantity() >= qty)
            .collect(Collectors.toList());

        if (reqLat != null && reqLng != null) {
            results.sort(Comparator.comparingDouble(inv -> {
                Double lat = inv.getLatitude(), lng = inv.getLongitude();
                return (lat == null || lng == null) ? Double.MAX_VALUE : haversineKm(reqLat, reqLng, lat, lng);
            }));
        }
        return results;
    }

    @Transactional
    public void deductStock(Long bankId, BloodGroup bg, int needed) {
        LocalDate today = LocalDate.now();
        List<BloodInventory> rows = invRepo.findAllByBloodBank_IdAndBloodGroup(bankId, bg).stream()
            .filter(inv -> inv.getExpiryDate() == null || !inv.getExpiryDate().isBefore(today))
            .sorted(Comparator.comparing(inv -> inv.getExpiryDate() == null ? LocalDate.MAX : inv.getExpiryDate()))
            .toList();

        int total = rows.stream().mapToInt(BloodInventory::getQuantity).sum();
        if (total < needed)
            throw new RuntimeException("Insufficient stock: only " + total + " units of " + bg.getLabel() + " available.");

        int rem = needed;
        for (BloodInventory row : rows) {
            if (rem <= 0) break;
            int deduct = Math.min(row.getQuantity(), rem);
            row.setQuantity(row.getQuantity() - deduct);
            rem -= deduct;
            invRepo.save(row);
        }

        checkLowStock(bankId, bg);
    }

    private void checkLowStock(Long bankId, BloodGroup bg) {
        List<BloodInventory> rows = invRepo.findAllByBloodBank_IdAndBloodGroup(bankId, bg);
        int total = rows.stream().mapToInt(BloodInventory::getQuantity).sum();
        int threshold = rows.stream().mapToInt(BloodInventory::getLowStockThreshold).max().orElse(5);
        if (total <= threshold && !rows.isEmpty()) {
            User bank = rows.get(0).getBloodBank();
            notifService.notifyBloodBankLowStock(bank, bg.getLabel(), total);
        }
    }

    public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371, dLat = Math.toRadians(lat2 - lat1), dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
}
