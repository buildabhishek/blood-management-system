package com.bms.controller;

import com.bms.dto.*;
import com.bms.entity.BloodRequest;
import com.bms.service.BloodRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class BloodRequestController {

    private final BloodRequestService service;

    public BloodRequestController(BloodRequestService service) {
        this.service = service;
    }

    // ── HOSPITAL ──────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('HOSPITAL')")
    @PostMapping
    public BloodRequest create(@Valid @RequestBody RequestDto dto, Authentication auth) {
        return service.createRequest(dto, auth.getName());
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @GetMapping("/my")
    public List<BloodRequest> getMyRequests(Authentication auth) {
        return service.getHospitalRequests(auth.getName());
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @GetMapping("/my/history")
    public List<BloodRequest> getMyHistory(Authentication auth) {
        return service.getHospitalHistory(auth.getName());
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id, Authentication auth) {
        try {
            BloodRequest req = service.cancelRequest(id, auth.getName());
            return ResponseEntity.ok(req);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── BLOOD BANK ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/blood-bank")
    public List<BloodRequest> getBloodBankRequests(Authentication auth) {
        return service.getBloodBankRequests(auth.getName());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
            @Valid @RequestBody StatusDto dto, Authentication auth) {
        try {
            BloodRequest req = service.updateStatus(id, dto.getStatus(), auth.getName(), dto.getReason());
            return ResponseEntity.ok(req);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/assign-rider")
    public ResponseEntity<?> assignRider(@PathVariable Long id,
            @Valid @RequestBody RiderAssignDto dto) {
        try {
            return ResponseEntity.ok(service.assignRider(id, dto.getRiderId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── RIDER ─────────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('RIDER')")
    @GetMapping("/rider/tasks")
    public List<BloodRequest> getRiderTasks(Authentication auth) {
        return service.getRiderTasks(auth.getName());
    }

    @PreAuthorize("hasRole('RIDER')")
    @GetMapping("/rider/history")
    public List<BloodRequest> getRiderHistory(Authentication auth) {
        return service.getRiderHistory(auth.getName());
    }

    @PreAuthorize("hasRole('RIDER')")
    @PutMapping("/{id}/rider-status")
    public ResponseEntity<?> updateRiderStatus(@PathVariable Long id,
            @Valid @RequestBody StatusDto dto, Authentication auth) {
        try {
            BloodRequest req = service.updateRiderStatus(id, dto.getStatus(), auth.getName(), dto.getOtp());
            return ResponseEntity.ok(req);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
