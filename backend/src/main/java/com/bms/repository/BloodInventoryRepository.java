package com.bms.repository;

import com.bms.entity.BloodGroup;
import com.bms.entity.BloodInventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BloodInventoryRepository extends JpaRepository<BloodInventory, Long> {
    List<BloodInventory> findByBloodBank_Phone(String phone);
    List<BloodInventory> findByBloodBank_PhoneOrderByCreatedAtDesc(String phone);

    /**
     * BUG FIX: Added PESSIMISTIC_WRITE lock so concurrent accepts on the same blood group
     * don't both read the same stock level and both deduct — preventing overselling of inventory.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM BloodInventory i WHERE i.bloodBank.id = :bloodBankId AND i.bloodGroup = :bloodGroup")
    List<BloodInventory> findAllByBloodBank_IdAndBloodGroup(
        @Param("bloodBankId") Long bloodBankId,
        @Param("bloodGroup") BloodGroup bloodGroup);

    List<BloodInventory> findByBloodGroupAndQuantityGreaterThanEqual(BloodGroup bloodGroup, int quantity);
    Page<BloodInventory> findAll(Pageable pageable);

    @Query("SELECT SUM(i.quantity) FROM BloodInventory i WHERE i.bloodBank.id = :bankId AND i.quantity > 0")
    Integer sumTotalByBank(@Param("bankId") Long bankId);
}
