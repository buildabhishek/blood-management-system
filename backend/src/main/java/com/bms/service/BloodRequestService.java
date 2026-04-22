package com.bms.service;

import com.bms.dto.RequestDto;
import com.bms.entity.*;
import com.bms.repository.BloodRequestRepository;
import com.bms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

@Service
public class BloodRequestService {

    private static final Map<RequestStatus, RequestStatus> RIDER_TRANSITIONS = Map.of(
            RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT,
            RequestStatus.IN_TRANSIT, RequestStatus.DELIVERED);

    private final BloodRequestRepository requestRepo;
    private final UserRepository userRepo;
    private final BloodInventoryService inventoryService;
    private final NotificationService notificationService;
    private final SecureRandom rng = new SecureRandom();

    public BloodRequestService(BloodRequestRepository requestRepo, UserRepository userRepo,
            BloodInventoryService inventoryService, NotificationService notificationService) {
        this.requestRepo = requestRepo;
        this.userRepo = userRepo;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    @Transactional
    public BloodRequest createRequest(RequestDto dto, String hospitalPhone) {
        Urgency urgency;
        try {
            urgency = Urgency.valueOf(dto.getUrgency().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid urgency. Must be NORMAL or URGENT.");
        }

        // bloodBankId is @NotNull in DTO so this should not occur, but double-check
        if (dto.getBloodBankId() == null)
            throw new RuntimeException(
                    "A blood bank must be selected from the search results before submitting a request.");

        User hospital = userRepo.findByPhone(hospitalPhone)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        User bank = userRepo.findById(dto.getBloodBankId())
                .orElseThrow(() -> new RuntimeException("Selected blood bank not found. Please search again."));

        if (bank.getRole() != Role.BLOOD_BANK)
            throw new RuntimeException("Invalid blood bank selected.");

        BloodRequest req = new BloodRequest();
        req.setPatientName(dto.getPatientName());
        req.setBloodGroup(dto.getBloodGroup());
        req.setQuantity(dto.getQuantity());
        req.setUrgency(urgency);
        req.setNotes(dto.getNotes());
        req.setHospital(hospital);
        req.setBloodBank(bank);
        req.setStatus(RequestStatus.PENDING);

        // Attach receipt if provided
        if (dto.getReceiptData() != null && !dto.getReceiptData().isBlank()) {
            req.setReceiptData(dto.getReceiptData());
            req.setReceiptFileName(dto.getReceiptFileName());
            req.setReceiptMimeType(dto.getReceiptMimeType());
        }

        BloodRequest saved = requestRepo.save(req);

        String hospitalDisplay = hospital.getEntityName() != null
                ? hospital.getEntityName()
                : hospital.getName();
        notificationService.notifyBloodBankRequestReceived(bank, req.getBloodGroup().getLabel(), hospitalDisplay);

        return saved;
    }

    // ── HOSPITAL ──────────────────────────────────────────────────────────────
    public List<BloodRequest> getHospitalRequests(String phone) {
        return requestRepo.findByHospital_PhoneAndStatusNotIn(phone,
                List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
    }

    public List<BloodRequest> getHospitalHistory(String phone) {
        return requestRepo.findByHospital_PhoneAndStatusIn(phone,
                List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
    }

    @Transactional
    public BloodRequest cancelRequest(Long id, String hospitalPhone) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!req.getHospital().getPhone().equals(hospitalPhone))
            throw new RuntimeException("You are not authorised to cancel this request.");

        if (req.getStatus() != RequestStatus.PENDING)
            throw new RuntimeException(
                    "Only PENDING requests can be cancelled. This request is already " + req.getStatus() + ".");

        req.setStatus(RequestStatus.CANCELLED);
        BloodRequest saved = requestRepo.save(req);

        // Notify blood bank if one was already assigned
        if (req.getBloodBank() != null) {
            String hospitalDisplay = req.getHospital().getEntityName() != null
                    ? req.getHospital().getEntityName()
                    : req.getHospital().getName();
            notificationService.notifyHospitalRequestCancelled(
                    req.getBloodBank(), req.getBloodGroup().getLabel(), hospitalDisplay);
        }
        return saved;
    }

    // ── BLOOD BANK ────────────────────────────────────────────────────────────
    public List<BloodRequest> getBloodBankRequests(String phone) {
        // Show only active (non-terminal) requests directed at this bank
        List<RequestStatus> activeStatuses = List.of(
            RequestStatus.PENDING, RequestStatus.ACCEPTED,
            RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT);
        List<BloodRequest> assigned = requestRepo.findByBloodBank_PhoneAndStatusIn(phone, activeStatuses);
        List<BloodRequest> unassigned = requestRepo.findByBloodBankIsNullAndStatusIn(
            List.of(RequestStatus.PENDING));
        List<BloodRequest> combined = new ArrayList<>(assigned);
        for (BloodRequest u : unassigned) {
            if (combined.stream().noneMatch(a -> a.getId().equals(u.getId())))
                combined.add(u);
        }
        return combined;
    }

    public List<BloodRequest> getBloodBankHistory(String phone) {
        return requestRepo.findByBloodBank_PhoneAndStatusIn(phone,
            List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED, RequestStatus.CANCELLED));
    }

    @Transactional
    public BloodRequest updateStatus(Long id, String status, String bankPhone, String rejectionReason) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException(
                    "Request already processed. Current status: " + req.getStatus() +
                            ". Please refresh the page.");
        }

        RequestStatus newStatus;
        try {
            newStatus = RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }

        if (newStatus != RequestStatus.ACCEPTED && newStatus != RequestStatus.REJECTED)
            throw new RuntimeException("Blood bank may only set ACCEPTED or REJECTED.");

        if (req.getBloodBank() == null) {
            User bank = userRepo.findByPhone(bankPhone)
                    .orElseThrow(() -> new RuntimeException("Blood bank not found"));
            req.setBloodBank(bank);
        }
        req.setStatus(newStatus);

        String bankName = req.getBloodBank().getEntityName() != null
                ? req.getBloodBank().getEntityName()
                : req.getBloodBank().getName();

        if (newStatus == RequestStatus.ACCEPTED) {
            try {
                inventoryService.deductStockFromBank(
                        req.getBloodBank().getId(), req.getBloodGroup(), req.getQuantity());
            } catch (RuntimeException e) {
                throw new RuntimeException("Cannot accept request: " + e.getMessage() +
                        " Please update your inventory first.");
            }
            notificationService.notifyHospitalRequestAccepted(
                    req.getHospital(), req.getBloodGroup().getLabel(), bankName);
        } else {
            if (rejectionReason != null && !rejectionReason.isBlank())
                req.setRejectionReason(rejectionReason);
            notificationService.notifyHospitalRequestRejected(
                    req.getHospital(), req.getBloodGroup().getLabel(), bankName, rejectionReason);
        }

        return requestRepo.save(req);
    }

    // ── ASSIGN RIDER ──────────────────────────────────────────────────────────
    @Transactional
    public BloodRequest assignRider(Long requestId, Long riderId) {
        BloodRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RequestStatus.ACCEPTED)
            throw new RuntimeException(
                    "Can only assign a rider to ACCEPTED requests. Current status: " + req.getStatus());

        User rider = userRepo.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        if (rider.getRole() != Role.RIDER)
            throw new RuntimeException("Selected user is not a rider");

        // ── PREVENT DOUBLE ASSIGNMENT ─────────────────────────────────────────
        long activeTasks = requestRepo.countActiveTasksByRider(rider);
        if (activeTasks > 0)
            throw new RuntimeException("Rider " + rider.getName() + " already has " + activeTasks +
                    " active delivery in progress. Please assign a different rider to avoid overloading.");

        // Generate 4-digit delivery OTP with 24-hour expiry
        String otp = String.format("%04d", rng.nextInt(10000));
        req.setDeliveryOtp(otp);
        req.setOtpExpiry(java.time.LocalDateTime.now().plusHours(24));

        req.setRider(rider);
        req.setStatus(RequestStatus.ASSIGNED);
        BloodRequest saved = requestRepo.save(req);

        notificationService.notifyRiderNewTask(rider,
                req.getBloodGroup().getLabel(), req.getHospitalName(), req.getId());
        notificationService.notifyHospitalRiderAssigned(
                req.getHospital(), rider.getName(), req.getBloodGroup().getLabel(), req.getId());

        return saved;
    }

    // ── RIDER ─────────────────────────────────────────────────────────────────
    public List<BloodRequest> getRiderTasks(String phone) {
        // Active tasks only
        return requestRepo.findByRider_PhoneAndStatusIn(phone,
                List.of(RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT));
    }

    public List<BloodRequest> getRiderHistory(String phone) {
        return requestRepo.findByRider_PhoneAndStatusIn(phone,
                List.of(RequestStatus.DELIVERED, RequestStatus.CANCELLED));
    }

    @Transactional
    public BloodRequest updateRiderStatus(Long id, String status, String riderPhone, String otpProvided) {
        BloodRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getRider() == null || !req.getRider().getPhone().equals(riderPhone))
            throw new RuntimeException("You are not authorised to update this delivery.");

        RequestStatus newStatus;
        try {
            newStatus = RequestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }

        RequestStatus expected = RIDER_TRANSITIONS.get(req.getStatus());
        if (expected == null)
            throw new RuntimeException("Delivery is already " + req.getStatus() + ". No further updates possible.");
        if (newStatus != expected)
            throw new RuntimeException(
                    "Cannot skip steps. From " + req.getStatus() + " you must advance to " + expected + ".");

        // OTP verification when marking DELIVERED
        if (newStatus == RequestStatus.DELIVERED) {
            if (req.getDeliveryOtp() != null && !req.getDeliveryOtp().isBlank()) {
                if (otpProvided == null || otpProvided.isBlank())
                    throw new RuntimeException(
                            "Delivery OTP is required to confirm delivery. Ask the hospital for the OTP.");
                if (req.getOtpExpiry() != null && java.time.LocalDateTime.now().isAfter(req.getOtpExpiry()))
                    throw new RuntimeException(
                            "Delivery OTP has expired. Please contact the blood bank to re-assign.");
                if (!req.getDeliveryOtp().equals(otpProvided.trim()))
                    throw new RuntimeException(
                            "Incorrect OTP. Please ask the hospital to verify and provide the correct 4-digit code.");
            }
        }

        req.setStatus(newStatus);
        if (newStatus == RequestStatus.DELIVERED) {
            notificationService.notifyHospitalDelivered(
                    req.getHospital(), req.getBloodGroup().getLabel(), req.getId());
        }
        return requestRepo.save(req);
    }
}
