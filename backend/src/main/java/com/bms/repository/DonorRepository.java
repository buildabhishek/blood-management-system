package com.bms.repository;

import com.bms.entity.Donor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonorRepository extends JpaRepository<Donor, Long> {

    List<Donor> findByBloodBankPhoneAndActiveTrue(String phone);

    // Keep for admin usage (shows all)
    List<Donor> findByBloodBankPhone(String phone);
}
