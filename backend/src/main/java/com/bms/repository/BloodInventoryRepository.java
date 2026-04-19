package com.bms.repository;

import com.bms.entity.BloodGroup;
import com.bms.entity.BloodInventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BloodInventoryRepository extends JpaRepository<BloodInventory, Long> {

    List<BloodInventory> findByBloodBank_Phone(String phone);

    Optional<BloodInventory> findByBloodBank_IdAndBloodGroup(Long bloodBankId, BloodGroup bloodGroup);

    List<BloodInventory> findAllByBloodBank_IdAndBloodGroup(Long bloodBankId, BloodGroup bloodGroup);

    List<BloodInventory> findByBloodGroupAndQuantityGreaterThanEqual(BloodGroup bloodGroup, int quantity);

    Page<BloodInventory> findAll(Pageable pageable);
}
