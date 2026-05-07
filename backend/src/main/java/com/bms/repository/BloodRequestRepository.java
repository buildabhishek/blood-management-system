package com.bms.repository;

import com.bms.entity.BloodRequest;
import com.bms.entity.RequestStatus;
import com.bms.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    // Hospital
    List<BloodRequest> findByHospital_PhoneAndStatusInOrderByCreatedAtDesc(String phone, List<RequestStatus> statuses);
    List<BloodRequest> findByHospital_PhoneAndStatusNotInOrderByCreatedAtDesc(String phone, List<RequestStatus> statuses);

    // Blood bank — active
    List<BloodRequest> findByBloodBank_PhoneAndStatusInOrderByCreatedAtDesc(String phone, List<RequestStatus> statuses);
    // Blood bank — history
    List<BloodRequest> findByBloodBank_PhoneAndStatusNotInOrderByCreatedAtDesc(String phone, List<RequestStatus> statuses);
    // Unassigned pending
    List<BloodRequest> findByBloodBankIsNullAndStatusOrderByUrgencyDescCreatedAtDesc(RequestStatus status);

    // Rider
    List<BloodRequest> findByRider_PhoneAndStatusInOrderByCreatedAtDesc(String phone, List<RequestStatus> statuses);

    // Admin
    Page<BloodRequest> findAll(Pageable pageable);
    long countByStatus(RequestStatus status);

    // Analytics
    // BUG FIX: original used raw string literals 'ASSIGNED','IN_TRANSIT' which fail on
    // PostgreSQL with a typed enum column. Use proper enum params instead.
    @Query("SELECT COUNT(r) FROM BloodRequest r WHERE r.rider = :rider AND r.status IN :activeStatuses")
    long countActiveTasksByRider(@Param("rider") User rider,
                                  @Param("activeStatuses") List<RequestStatus> activeStatuses);

    @Query("SELECT r.bloodGroup, COUNT(r) FROM BloodRequest r WHERE r.hospital.phone = :phone GROUP BY r.bloodGroup")
    List<Object[]> countByBloodGroupForHospital(@Param("phone") String phone);

    @Query("SELECT r.bloodGroup, COUNT(r) FROM BloodRequest r WHERE r.bloodBank.phone = :phone AND r.status = :delivered GROUP BY r.bloodGroup")
    List<Object[]> deliveredByBloodGroupForBank(@Param("phone") String phone, @Param("delivered") RequestStatus delivered);

    // Pessimistic lock for race-condition-safe status updates
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM BloodRequest r WHERE r.id = :id")
    Optional<BloodRequest> findByIdForUpdate(@Param("id") Long id);
}
