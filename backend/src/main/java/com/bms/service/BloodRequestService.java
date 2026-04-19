package com.bms.service;

import com.bms.dto.RequestDto;
import com.bms.entity.*;
import com.bms.repository.BloodRequestRepository;
import com.bms.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BloodRequestService {

    private static final Map<RequestStatus, RequestStatus> RIDER_TRANSITIONS = Map.of(
            RequestStatus.ASSIGNED,   RequestStatus.IN_TRANSIT,
            RequestStatus.IN_TRANSIT, RequestStatus.DELIVERED);

    private final BloodRequestRepository requestRepo;
    private final UserRepository userRepo;
    private final BloodInventoryService inventoryService;
    private final NotificationService notificationService;

    public BloodRequestService(BloodRequestRepository requestRepo, UserRepository userRepo,
            BloodInventoryService inventoryService, NotificationService notificationService) {
        this.requestRepo         = requestRepo;
        this.userRepo            = userRepo;
        this.inventoryService    = inventoryService;
        this.notificationService = notificationService;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    public BloodRequest createRequest(RequestDto dto, String hospitalPhone) {
        Urgency urgency;
        try { urgency = Urgency.valueOf(dto.getUrgency().toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid urgency. Must be NORMAL or URGENT.");
        }

        User hospital = userRepo.findByPhone(hospitalPhone)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));

        BloodRequest req = new BloodRequest();
        req.setPatientName(dto.getPatientName());
        req.setBloodGroup(dto.getBloodGroup());
        req.setQuantity(dto.getQuantity());
        req.setUrgency(urgency);
        req.setNotes(dto.getNotes());
        req.setHospital(hospital);
        req.setStatus(RequestStatus.PENDING);

        if (dto.getBloodBankId() != null) {
            User bank = userRepo.findById(dto.getBloodBankId())
                    .orElseThrow(() -> new RuntimeException("Blood bank not found"));
            req.setBloodBank(bank);
            // Notify the target bank
            notificationService.notifyBloodBankRequestReceived(
                bank, dto.getBloodGroup().getLabel(),
                hospital.getEntityName() != null ? hospital.getEntityName() : hospital.getName());
        }
        return requestRepo.save(req);
    }

    // ── HOSPITAL ──────────────────────────────────────────────────────────────
    public List<BloodRequest> getHospitalRequests(String phone) {
        return requestRepo.findByHospital_Phone(phone);
    }

    public List<BloodRequest> getHospitalHistory(String phone) {
        return requestRepo.findByHospital_PhoneAndStatusIn(phone,
                List.of(RequestStatus.DELIVERED, RequestStatus.REJECTED));
    }

    // ── BLOOD BANK ────────────────────────────────────────────────────────────
    public List<BloodRequest> getBloodBankRequests(String phone) {
        List<BloodRequest> assigned   = requestRepo.findByBloodBank_Phone(phone);
        List<BloodRequest> unassigned = requestRepo.findByBloodBankIsNull();
        List<BloodRequest> combined   = new ArrayList<>(assigned);
        for (BloodRequest u : unassigned) {
            if (combined.stream().noneMatch(a -> a.getId().equals(u.getId()))) combined.add(u);
        }
        return combined;
    }

    @Transactional
    public BloodRequest updateStatus(Long id, String status, String bankPhone) {
        BloodRequest req = requestRepo.findByIdForUpdate(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getStatus() != RequestStatus.PENDING)
            throw new RuntimeException("Request is already " + req.getStatus());

        RequestStatus newStatus;
        try { newStatus = RequestStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new RuntimeException("Invalid status: " + status); }

        if (newStatus != RequestStatus.ACCEPTED && newStatus != RequestStatus.REJECTED)
            throw new RuntimeException("Blood bank may only set ACCEPTED or REJECTED.");

        if (req.getBloodBank() == null) {
            User bank = userRepo.findByPhone(bankPhone)
                    .orElseThrow(() -> new RuntimeException("Blood bank not found"));
            req.setBloodBank(bank);
        }
        req.setStatus(newStatus);

        if (newStatus == RequestStatus.ACCEPTED) {
            inventoryService.deductStockFromBank(
                req.getBloodBank().getId(), req.getBloodGroup(), req.getQuantity());
            notificationService.notifyHospitalRequestAccepted(
                req.getHospital(), req.getBloodGroup().getLabel(),
                req.getBloodBank().getEntityName());
        } else {
            notificationService.notifyHospitalRequestRejected(
                req.getHospital(), req.getBloodGroup().getLabel(),
                req.getBloodBank().getEntityName());
        }

        return requestRepo.save(req);
    }

    // ── ASSIGN RIDER ──────────────────────────────────────────────────────────
    public BloodRequest assignRider(Long requestId, Long riderId) {
        BloodRequest req = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (req.getStatus() != RequestStatus.ACCEPTED)
            throw new RuntimeException("Can only assign rider to ACCEPTED requests");

        User rider = userRepo.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));
        if (rider.getRole() != Role.RIDER)
            throw new RuntimeException("Selected user is not a rider");

        req.setRider(rider);
        req.setStatus(RequestStatus.ASSIGNED);
        BloodRequest saved = requestRepo.save(req);

        notificationService.notifyRiderNewTask(rider,
            req.getBloodGroup().getLabel(), req.getHospitalName());
        notificationService.notifyHospitalRiderAssigned(
            req.getHospital(), rider.getName(), req.getBloodGroup().getLabel());
        return saved;
    }

    // ── RIDER ─────────────────────────────────────────────────────────────────
    public List<BloodRequest> getRiderTasks(String phone) {
        return requestRepo.findByRider_Phone(phone);
    }

    public BloodRequest updateRiderStatus(Long id, String status, String riderPhone) {
        BloodRequest req = requestRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (req.getRider() == null || !req.getRider().getPhone().equals(riderPhone))
            throw new RuntimeException("Not authorized to update this delivery");

        RequestStatus newStatus;
        try { newStatus = RequestStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new RuntimeException("Invalid status: " + status); }

        RequestStatus expected = RIDER_TRANSITIONS.get(req.getStatus());
        if (expected == null)
            throw new RuntimeException("Delivery already " + req.getStatus());
        if (newStatus != expected)
            throw new RuntimeException("From " + req.getStatus() + " you may only advance to " + expected);

        req.setStatus(newStatus);
        if (newStatus == RequestStatus.DELIVERED) {
            notificationService.notifyHospitalDelivered(req.getHospital(), req.getBloodGroup().getLabel());
        }
        return requestRepo.save(req);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    public Page<BloodRequest> getAllRequests(int page, int size) {
        return requestRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }
}
