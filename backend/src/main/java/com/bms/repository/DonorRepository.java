package com.bms.repository;

import com.bms.entity.Donor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonorRepository extends JpaRepository<Donor, Long> {
    List<Donor> findByBloodBankPhoneAndActiveTrueOrderByCreatedAtDesc(String phone);
    List<Donor> findByBloodBankPhoneOrderByCreatedAtDesc(String phone);
    long countByBloodBankPhoneAndActiveTrue(String phone);
}
