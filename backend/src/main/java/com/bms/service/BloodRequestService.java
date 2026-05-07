package com.bms.service;

import com.bms.dto.RequestDto;
import com.bms.entity.*;
import com.bms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BloodRequestService {

    private static final List<RequestStatus> ACTIVE_RIDER_STATUSES =
        List.of(RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT);

    private static final Map<RequestStatus, RequestStatus> RIDER_FLOW = Map.of(
        RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT,
        RequestStatus.IN_TRANSIT, RequestStatus.DELIVERED);

    private final BloodRequestRepository reqRepo;
    private final UserRepository userRepo;
    private final BloodInventoryService invService;
    private final NotificationService notifService;
    private final SecureRandom rng = new SecureRandom();

    public BloodRequestService(BloodRequestRepository reqRepo, UserRepository userRepo,
                                BloodInventoryService invService, NotificationService notifService) {
        this.reqRepo      = reqRepo;
        this.userRepo     = userRepo;
        this.invService   = invService;
        this.notifService = notifService;
    }

    // ── HOSPITAL ──────────────────────────────────────────────────────────────

    @Transactional
    public BloodRequest create(RequestDto dto, String hospitalPhone) {
        Urgency urgency;
        try { urgency = Urgency.valueOf(dto.getUrgency().toUpperCase()); }
        catch (Exception e) { throw new RuntimeException("Invalid urgency. Use NORMAL, URGENT, or CRITICAL."); }

        User hospital = userRepo.findByPhone(hospitalPhone).orElseThrow(() -> new RuntimeException("Hospital not found."));
        User bank     = userRepo.findById(dto.getBloodBankId()).orElseThrow(() -> new RuntimeException("Blood bank not found."));
        if (bank.getRole() != Role.BLOOD_BANK) throw new RuntimeException("Invalid blood bank selected.");

        BloodRequest r = new BloodRequest();
        r.setPatientName(dto.getPatientName());
        r.setPatientAge(dto.getPatientAge());
        r.setWardBed(dto.getWardBed());
        r.setAttendingPhysician(dto.getAttendingPhysician());
        r.setBloodGroup(dto.getBloodGroup());
        r.setComponentType(dto.getComponentType());
        r.setQuantity(dto.getQuantity());
        r.setUrgency(urgency);
        r.setNotes(dto.getNotes());
        r.setHospital(hospital);
        r.setBloodBank(bank);
        r.setStatus(RequestStatus.PENDING);
        if (dto.getReceiptData() != null && !dto.getReceiptData().isBlank()) {
            r.setReceiptData(dto.getReceiptData());
            r.setReceiptFileName(dto.getReceiptFileName());
            r.setReceiptMimeType(dto.getReceiptMimeType());
        }
        BloodRequest saved = reqRepo.save(r);
        notifService.notifyBloodBankNewRequest(bank, r.getBloodGroup().getLabel(),
            hospital.getEntityName() != null ? hospital.getEntityName() : hospital.getName(), urgency);
        return saved;
    }

    public List<BloodRequest> getHospitalActive(String phone) {
        return reqRepo.findByHospital_PhoneAndStatusNotInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
    }

    public List<BloodRequest> getHospitalHistory(String phone) {
        return reqRepo.findByHospital_PhoneAndStatusInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
    }

    @Transactional
    public BloodRequest cancel(Long id, String hospitalPhone) {
        BloodRequest r = reqRepo.findByIdForUpdate(id).orElseThrow(() -> new RuntimeException("Request not found."));
        if (!r.getHospital().getPhone().equals(hospitalPhone))
            throw new RuntimeException("Not authorised.");
        if (r.getStatus() != RequestStatus.PENDING)
            throw new RuntimeException("Only PENDING requests can be cancelled.");
        r.setStatus(RequestStatus.CANCELLED);
        BloodRequest saved = reqRepo.save(r);
        if (r.getBloodBank() != null)
            notifService.notifyBloodBankCancelled(r.getBloodBank(), r.getBloodGroup().getLabel(), r.getHospitalName());
        return saved;
    }

    // ── BLOOD BANK ────────────────────────────────────────────────────────────

    public List<BloodRequest> getBankActive(String phone) {
        List<BloodRequest> mine = reqRepo.findByBloodBank_PhoneAndStatusInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT));
        List<BloodRequest> unassigned = reqRepo.findByBloodBankIsNullAndStatusOrderByUrgencyDescCreatedAtDesc(RequestStatus.PENDING);
        List<BloodRequest> combined = new ArrayList<>(mine);
        unassigned.forEach(u -> { if (combined.stream().noneMatch(a -> a.getId().equals(u.getId()))) combined.add(u); });
        return combined;
    }

    public List<BloodRequest> getBankHistory(String phone) {
        return reqRepo.findByBloodBank_PhoneAndStatusNotInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT));
    }

    @Transactional
    public BloodRequest updateStatus(Long id, String status, String bankPhone, String reason) {
        BloodRequest r = reqRepo.findByIdForUpdate(id).orElseThrow(() -> new RuntimeException("Request not found."));
        if (r.getStatus() != RequestStatus.PENDING)
            throw new RuntimeException("Request already processed. Current status: " + r.getStatus() + ". Refresh the page.");

        RequestStatus newStatus;
        try { newStatus = RequestStatus.valueOf(status.toUpperCase()); }
        catch (Exception e) { throw new RuntimeException("Invalid status: " + status); }
        if (newStatus != RequestStatus.ACCEPTED && newStatus != RequestStatus.REJECTED)
            throw new RuntimeException("Blood bank may only set ACCEPTED or REJECTED.");

        if (r.getBloodBank() == null) {
            User bank = userRepo.findByPhone(bankPhone).orElseThrow(() -> new RuntimeException("Blood bank not found."));
            r.setBloodBank(bank);
        }
        r.setStatus(newStatus);
        String bankName = r.getBloodBank().getEntityName() != null ? r.getBloodBank().getEntityName() : r.getBloodBank().getName();

        if (newStatus == RequestStatus.ACCEPTED) {
            try { invService.deductStock(r.getBloodBank().getId(), r.getBloodGroup(), r.getQuantity()); }
            catch (RuntimeException e) { throw new RuntimeException("Cannot accept: " + e.getMessage() + " Update inventory first."); }
            notifService.notifyHospitalAccepted(r.getHospital(), r.getBloodGroup().getLabel(), bankName);
        } else {
            if (reason != null && !reason.isBlank()) r.setRejectionReason(reason);
            notifService.notifyHospitalRejected(r.getHospital(), r.getBloodGroup().getLabel(), bankName, reason);
        }
        return reqRepo.save(r);
    }

    @Transactional
    public BloodRequest assignRider(Long id, Long riderId) {
        // BUG FIX: use pessimistic lock here to prevent double-assignment race condition
        BloodRequest r = reqRepo.findByIdForUpdate(id).orElseThrow(() -> new RuntimeException("Request not found."));
        if (r.getStatus() != RequestStatus.ACCEPTED)
            throw new RuntimeException("Can only assign rider to ACCEPTED requests. Current: " + r.getStatus());
        User rider = userRepo.findById(riderId).orElseThrow(() -> new RuntimeException("Rider not found."));
        if (rider.getRole() != Role.RIDER) throw new RuntimeException("Selected user is not a rider.");
        if (reqRepo.countActiveTasksByRider(rider, List.of(RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT)) > 0)
            throw new RuntimeException("Rider " + rider.getName() + " already has an active delivery. Choose another rider.");

        // BUG FIX: check rider is actually active/available before assigning
        if (!rider.isActive())
            throw new RuntimeException("Rider " + rider.getName() + " account is deactivated.");

        String otp = String.format("%04d", rng.nextInt(10000));
        r.setDeliveryOtp(otp);
        r.setOtpExpiry(LocalDateTime.now().plusHours(24));
        r.setRider(rider);
        r.setStatus(RequestStatus.ASSIGNED);
        BloodRequest saved = reqRepo.save(r);
        notifService.notifyRiderNewTask(rider, r.getBloodGroup().getLabel(), r.getHospitalName(), id);
        notifService.notifyHospitalRiderAssigned(r.getHospital(), rider.getName(), r.getBloodGroup().getLabel(), id);
        return saved;
    }

    // ── RIDER ─────────────────────────────────────────────────────────────────

    public List<BloodRequest> getRiderActive(String phone) {
        return reqRepo.findByRider_PhoneAndStatusInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT));
    }

    public List<BloodRequest> getRiderHistory(String phone) {
        return reqRepo.findByRider_PhoneAndStatusInOrderByCreatedAtDesc(phone,
            List.of(RequestStatus.DELIVERED, RequestStatus.CANCELLED));
    }

    @Transactional
    public BloodRequest updateRiderStatus(Long id, String status, String riderPhone, String otp) {
        // BUG FIX: use pessimistic lock to prevent concurrent status updates on same delivery
        BloodRequest r = reqRepo.findByIdForUpdate(id).orElseThrow(() -> new RuntimeException("Request not found."));
        if (r.getRider() == null || !r.getRider().getPhone().equals(riderPhone))
            throw new RuntimeException("Not authorised.");

        RequestStatus newStatus;
        try { newStatus = RequestStatus.valueOf(status.toUpperCase()); }
        catch (Exception e) { throw new RuntimeException("Invalid status: " + status); }

        RequestStatus expected = RIDER_FLOW.get(r.getStatus());
        if (expected == null) throw new RuntimeException("Delivery is already " + r.getStatus() + ".");
        if (newStatus != expected)
            throw new RuntimeException("Cannot skip steps. From " + r.getStatus() + " must advance to " + expected + ".");

        if (newStatus == RequestStatus.DELIVERED) {
            if (r.getDeliveryOtp() != null) {
                if (otp == null || otp.isBlank()) throw new RuntimeException("Delivery OTP required. Ask hospital for the 4-digit code.");
                if (r.getOtpExpiry() != null && LocalDateTime.now().isAfter(r.getOtpExpiry()))
                    throw new RuntimeException("OTP expired. Contact blood bank to reassign.");
                if (!r.getDeliveryOtp().equals(otp.trim())) throw new RuntimeException("Incorrect OTP.");
            }
            notifService.notifyHospitalDelivered(r.getHospital(), r.getBloodGroup().getLabel(), id);
        }
        if (newStatus == RequestStatus.IN_TRANSIT) {
            notifService.notifyHospitalPickedUp(r.getHospital(), r.getBloodGroup().getLabel(), id);
        }

        r.setStatus(newStatus);
        return reqRepo.save(r);
    }
}
