package com.bms.repository;

import com.bms.entity.BloodRequest;
import com.bms.entity.RequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByHospital_Phone(String phone);
    List<BloodRequest> findByHospital_PhoneAndStatusIn(String phone, List<RequestStatus> statuses);
    List<BloodRequest> findByBloodBank_Phone(String phone);
    List<BloodRequest> findByBloodBankIsNull();
    List<BloodRequest> findByRider_Phone(String phone);
    long countByStatus(RequestStatus status);
    Page<BloodRequest> findAll(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM BloodRequest r WHERE r.id = :id")
    Optional<BloodRequest> findByIdForUpdate(@Param("id") Long id);
}
