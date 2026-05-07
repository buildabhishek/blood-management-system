package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DonorService {

    private final DonorRepository donorRepo;
    private final UserRepository  userRepo;

    public DonorService(DonorRepository donorRepo, UserRepository userRepo) {
        this.donorRepo = donorRepo;
        this.userRepo  = userRepo;
    }

    public Donor add(Donor donor, String bankPhone) {
        User bank = userRepo.findByPhone(bankPhone).orElseThrow(() -> new RuntimeException("Blood bank not found."));
        donor.setBloodBank(bank);
        donor.setActive(true);
        return donorRepo.save(donor);
    }

    public List<Donor> getMine(String bankPhone) {
        return donorRepo.findByBloodBankPhoneAndActiveTrueOrderByCreatedAtDesc(bankPhone);
    }

    public List<Donor> getAll() { return donorRepo.findAll(); }

    @Transactional
    public Donor update(Long id, Donor updated, String bankPhone) {
        Donor d = donorRepo.findById(id).orElseThrow(() -> new RuntimeException("Donor not found."));
        if (!d.getBloodBank().getPhone().equals(bankPhone)) throw new AccessDeniedException("Not your donor record.");
        if (updated.getName()         != null) d.setName(updated.getName());
        if (updated.getPhone()        != null) d.setPhone(updated.getPhone());
        if (updated.getEmail()        != null) d.setEmail(updated.getEmail());
        if (updated.getBloodGroup()   != null) d.setBloodGroup(updated.getBloodGroup());
        if (updated.getLastDonation() != null) {
            // BUG FIX: only increment donationCount when the date actually changes (new donation recorded),
            // not when correcting an existing date — prevents count inflation on edits
            if (!updated.getLastDonation().equals(d.getLastDonation())) {
                d.setDonationCount(d.getDonationCount() + 1);
            }
            d.setLastDonation(updated.getLastDonation());
        }
        if (updated.getHealthNotes()  != null) d.setHealthNotes(updated.getHealthNotes());
        if (updated.getDateOfBirth()  != null) d.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getAddress()      != null) d.setAddress(updated.getAddress());
        return donorRepo.save(d);
    }

    @Transactional
    public void delete(Long id, String callerPhone) {
        Donor d = donorRepo.findById(id).orElseThrow(() -> new RuntimeException("Donor not found."));
        User caller = userRepo.findByPhone(callerPhone).orElseThrow(() -> new RuntimeException("Caller not found."));
        if (caller.getRole() != Role.ADMIN && !d.getBloodBank().getPhone().equals(callerPhone))
            throw new AccessDeniedException("Not your donor record.");
        d.setActive(false);
        donorRepo.save(d);
    }
}
