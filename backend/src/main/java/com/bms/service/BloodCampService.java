package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BloodCampService {

    private final BloodCampRepository campRepo;
    private final UserRepository      userRepo;

    public BloodCampService(BloodCampRepository campRepo, UserRepository userRepo) {
        this.campRepo = campRepo;
        this.userRepo = userRepo;
    }

    public BloodCamp create(BloodCamp camp, String organiserPhone) {
        User organiser = userRepo.findByPhone(organiserPhone)
            .orElseThrow(() -> new RuntimeException("Organiser not found."));
        camp.setOrganiser(organiser);
        camp.setStatus(BloodCamp.CampStatus.UPCOMING);
        return campRepo.save(camp);
    }

    public List<BloodCamp> getMine(String phone) {
        return campRepo.findByOrganiserPhoneOrderByCampDateDesc(phone);
    }

    public List<BloodCamp> getAll() {
        return campRepo.findAllByOrderByCampDateDesc();
    }

    @Transactional
    public BloodCamp update(Long id, BloodCamp updated, String callerPhone) {
        BloodCamp c = campRepo.findById(id).orElseThrow(() -> new RuntimeException("Camp not found."));
        User caller = userRepo.findByPhone(callerPhone).orElseThrow(() -> new RuntimeException("Caller not found."));
        boolean isAdmin = caller.getRole() == Role.ADMIN;
        if (!isAdmin && !c.getOrganiser().getPhone().equals(callerPhone))
            throw new AccessDeniedException("Not your camp.");

        if (updated.getName()                != null) c.setName(updated.getName());
        if (updated.getLocation()            != null) c.setLocation(updated.getLocation());
        if (updated.getCampDate()            != null) c.setCampDate(updated.getCampDate());
        if (updated.getCampTime()            != null) c.setCampTime(updated.getCampTime());
        if (updated.getLatitude()            != null) c.setLatitude(updated.getLatitude());
        if (updated.getLongitude()           != null) c.setLongitude(updated.getLongitude());
        if (updated.getPartnerInstitution()  != null) c.setPartnerInstitution(updated.getPartnerInstitution());
        if (updated.getTargetUnits()         != null) c.setTargetUnits(updated.getTargetUnits());
        if (updated.getTotalUnitsCollected() != null) c.setTotalUnitsCollected(updated.getTotalUnitsCollected());
        if (updated.getDonorsAttended()      != null) c.setDonorsAttended(updated.getDonorsAttended());
        if (updated.getBloodUnitsJson()      != null) c.setBloodUnitsJson(updated.getBloodUnitsJson());
        if (updated.getStatus()              != null) c.setStatus(updated.getStatus());
        return campRepo.save(c);
    }

    @Transactional
    public void delete(Long id, String callerPhone) {
        BloodCamp c = campRepo.findById(id).orElseThrow(() -> new RuntimeException("Camp not found."));
        User caller = userRepo.findByPhone(callerPhone).orElseThrow(() -> new RuntimeException("Caller not found."));
        if (caller.getRole() != Role.ADMIN && !c.getOrganiser().getPhone().equals(callerPhone))
            throw new AccessDeniedException("Not your camp.");
        campRepo.deleteById(id);
    }
}
