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
    public BloodRequestController(BloodRequestService s) { this.service = s; }

    // ── HOSPITAL ──────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('HOSPITAL')")
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody RequestDto dto, Authentication auth) {
        try { return ResponseEntity.ok(service.create(dto, auth.getName())); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @GetMapping("/my")
    public List<BloodRequest> getMyActive(Authentication auth) {
        return service.getHospitalActive(auth.getName());
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @GetMapping("/my/history")
    public List<BloodRequest> getMyHistory(Authentication auth) {
        return service.getHospitalHistory(auth.getName());
    }

    @PreAuthorize("hasRole('HOSPITAL')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        try { return ResponseEntity.ok(service.cancel(id, auth.getName())); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ── BLOOD BANK ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/blood-bank")
    public List<BloodRequest> getBankActive(Authentication auth) {
        return service.getBankActive(auth.getName());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/blood-bank/history")
    public List<BloodRequest> getBankHistory(Authentication auth) {
        return service.getBankHistory(auth.getName());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
            @Valid @RequestBody StatusDto dto, Authentication auth) {
        try { return ResponseEntity.ok(service.updateStatus(id, dto.getStatus(), auth.getName(), dto.getReason())); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/assign-rider")
    public ResponseEntity<?> assignRider(@PathVariable Long id, @Valid @RequestBody RiderAssignDto dto) {
        try { return ResponseEntity.ok(service.assignRider(id, dto.getRiderId())); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // ── RIDER ─────────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('RIDER')")
    @GetMapping("/rider/tasks")
    public List<BloodRequest> getRiderTasks(Authentication auth) {
        return service.getRiderActive(auth.getName());
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
        try { return ResponseEntity.ok(service.updateRiderStatus(id, dto.getStatus(), auth.getName(), dto.getOtp())); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }
}
