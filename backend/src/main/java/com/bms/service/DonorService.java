package com.bms.service;

import com.bms.entity.Donor;
import com.bms.entity.Role;
import com.bms.entity.User;
import com.bms.repository.DonorRepository;
import com.bms.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DonorService {

    private final DonorRepository donorRepository;
    private final UserRepository  userRepository;

    public DonorService(DonorRepository donorRepository, UserRepository userRepository) {
        this.donorRepository = donorRepository;
        this.userRepository  = userRepository;
    }

    public Donor addDonor(Donor donor, String bloodBankPhone) {
        User bloodBank = userRepository.findByPhone(bloodBankPhone)
                .orElseThrow(() -> new RuntimeException("Blood bank not found"));
        donor.setBloodBank(bloodBank);
        return donorRepository.save(donor);
    }

    public List<Donor> getMyDonors(String bloodBankPhone) {
        return donorRepository.findByBloodBankPhone(bloodBankPhone);
    }

    public List<Donor> getAll() {
        return donorRepository.findAll();
    }

    public Donor updateDonor(Long id, Donor updated, String bloodBankPhone) {
        Donor existing = donorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donor not found"));
        if (!existing.getBloodBank().getPhone().equals(bloodBankPhone))
            throw new AccessDeniedException("You do not own this donor record");

        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setLastDonation(updated.getLastDonation());
        return donorRepository.save(existing);
    }

    // FIX 7: Check caller's role properly — look them up by phone, not null check
    public void deleteDonor(Long id, String callerPhone) {
        Donor existing = donorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donor not found"));

        User caller = userRepository.findByPhone(callerPhone)
                .orElseThrow(() -> new RuntimeException("Caller not found"));

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        if (!isAdmin && !existing.getBloodBank().getPhone().equals(callerPhone))
            throw new AccessDeniedException("You do not own this donor record");

        existing.setActive(false);
        donorRepository.save(existing);
    }
}
