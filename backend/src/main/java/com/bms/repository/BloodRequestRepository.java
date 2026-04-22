package com.bms.repository;

import com.bms.entity.BloodRequest;
import com.bms.entity.RequestStatus;
import com.bms.entity.User;
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
    List<BloodRequest> findByHospital_PhoneAndStatusNotIn(String phone, List<RequestStatus> statuses);
    List<BloodRequest> findByBloodBank_Phone(String phone);
    List<BloodRequest> findByBloodBank_PhoneAndStatusIn(String phone, List<RequestStatus> statuses);
    List<BloodRequest> findByBloodBank_PhoneAndStatusNotIn(String phone, List<RequestStatus> statuses);
    List<BloodRequest> findByBloodBankIsNull();
    List<BloodRequest> findByBloodBankIsNullAndStatusIn(List<RequestStatus> statuses);
    List<BloodRequest> findByRider_Phone(String phone);
    List<BloodRequest> findByRider_PhoneAndStatusIn(String phone, List<RequestStatus> statuses);
    long countByStatus(RequestStatus status);
    Page<BloodRequest> findAll(Pageable pageable);

    /** Check if rider has any active (non-terminal) task — prevents double assignment */
    @Query("SELECT COUNT(r) FROM BloodRequest r WHERE r.rider = :rider " +
           "AND r.status IN ('ASSIGNED','IN_TRANSIT')")
    long countActiveTasksByRider(@Param("rider") User rider);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM BloodRequest r WHERE r.id = :id")
    Optional<BloodRequest> findByIdForUpdate(@Param("id") Long id);
}
