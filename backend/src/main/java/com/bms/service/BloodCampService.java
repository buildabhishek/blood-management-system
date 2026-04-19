package com.bms.service;

import com.bms.entity.BloodCamp;
import com.bms.entity.Role;
import com.bms.entity.User;
import com.bms.repository.BloodCampRepository;
import com.bms.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BloodCampService {

    private final BloodCampRepository campRepository;
    private final UserRepository      userRepository;

    public BloodCampService(BloodCampRepository campRepository, UserRepository userRepository) {
        this.campRepository = campRepository;
        this.userRepository = userRepository;
    }

    public BloodCamp createCamp(BloodCamp camp, String organiserPhone) {
        User organiser = userRepository.findByPhone(organiserPhone)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        camp.setOrganiser(organiser);
        return campRepository.save(camp);
    }

    public List<BloodCamp> getMyCamps(String organiserPhone) {
        return campRepository.findByOrganiserPhone(organiserPhone);
    }

    public List<BloodCamp> getAll() {
        return campRepository.findAll();
    }

    public BloodCamp updateCamp(Long id, BloodCamp updated, String phone) {
        BloodCamp existing = campRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camp not found"));
        if (!existing.getOrganiser().getPhone().equals(phone))
            throw new AccessDeniedException("You do not own this camp");

        existing.setName(updated.getName());
        existing.setLocation(updated.getLocation());
        existing.setCampDate(updated.getCampDate());
        existing.setTotalUnitsCollected(updated.getTotalUnitsCollected());
        existing.setLatitude(updated.getLatitude());
        existing.setLongitude(updated.getLongitude());
        if (updated.getBloodUnitsJson() != null) {
            existing.setBloodUnitsJson(updated.getBloodUnitsJson());
        }
        return campRepository.save(existing);
    }

    // FIX: Same bug as DonorService — check caller's role from DB, not null check
    public void deleteCamp(Long id, String callerPhone) {
        BloodCamp existing = campRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Camp not found"));

        User caller = userRepository.findByPhone(callerPhone)
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        if (!isAdmin && !existing.getOrganiser().getPhone().equals(callerPhone))
            throw new AccessDeniedException("You do not own this camp");

        campRepository.deleteById(id);
    }
}
