package com.bms.controller;

import com.bms.dto.*;
import com.bms.entity.BloodRequest;
import com.bms.service.BloodRequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class BloodRequestController {

    private final BloodRequestService service;

    public BloodRequestController(BloodRequestService service) {
        this.service = service;
    }

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

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @GetMapping("/blood-bank")
    public List<BloodRequest> getBloodBankRequests(Authentication auth) {
        return service.getBloodBankRequests(auth.getName());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/status")
    public BloodRequest updateStatus(@PathVariable Long id,
            @Valid @RequestBody StatusDto dto, Authentication auth) {
        return service.updateStatus(id, dto.getStatus(), auth.getName());
    }

    @PreAuthorize("hasRole('BLOOD_BANK')")
    @PutMapping("/{id}/assign-rider")
    public BloodRequest assignRider(@PathVariable Long id,
            @Valid @RequestBody RiderAssignDto dto) {
        return service.assignRider(id, dto.getRiderId());
    }

    @PreAuthorize("hasRole('RIDER')")
    @GetMapping("/rider/tasks")
    public List<BloodRequest> getRiderTasks(Authentication auth) {
        return service.getRiderTasks(auth.getName());
    }

    @PreAuthorize("hasRole('RIDER')")
    @PutMapping("/{id}/rider-status")
    public BloodRequest updateRiderStatus(@PathVariable Long id,
            @Valid @RequestBody StatusDto dto, Authentication auth) {
        return service.updateRiderStatus(id, dto.getStatus(), auth.getName());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public Page<BloodRequest> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getAllRequests(page, size);
    }
}
