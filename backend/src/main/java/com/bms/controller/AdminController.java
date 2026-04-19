package com.bms.controller;

import com.bms.entity.*;
import com.bms.repository.*;
import com.bms.service.UserService;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final BloodRequestRepository requestRepository;
    private final BloodInventoryRepository inventoryRepository;
    private final UserService userService;

    public AdminController(UserRepository userRepository,
            BloodRequestRepository requestRepository,
            BloodInventoryRepository inventoryRepository,
            UserService userService) {
        this.userRepository      = userRepository;
        this.requestRepository   = requestRepository;
        this.inventoryRepository = inventoryRepository;
        this.userService         = userService;
    }

    @GetMapping("/users")
    public Page<User> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/hospitals")
    public List<User> getHospitals() {
        return userRepository.findByRoleAndActiveTrue(Role.HOSPITAL);
    }

    @GetMapping("/blood-banks")
    public List<User> getBloodBanks() {
        return userRepository.findByRoleAndActiveTrue(Role.BLOOD_BANK);
    }

    @GetMapping("/requests")
    public Page<BloodRequest> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return requestRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // Soft delete — never hard-deletes
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            userService.deactivate(id);
            return ResponseEntity.ok(Map.of("message", "User deactivated"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reports/requests-summary")
    public ResponseEntity<Map<String, Long>> requestsSummary() {
        return ResponseEntity.ok(Map.of(
            "total",     requestRepository.count(),
            "pending",   requestRepository.countByStatus(RequestStatus.PENDING),
            "accepted",  requestRepository.countByStatus(RequestStatus.ACCEPTED),
            "assigned",  requestRepository.countByStatus(RequestStatus.ASSIGNED),
            "inTransit", requestRepository.countByStatus(RequestStatus.IN_TRANSIT),
            "delivered", requestRepository.countByStatus(RequestStatus.DELIVERED),
            "rejected",  requestRepository.countByStatus(RequestStatus.REJECTED)
        ));
    }
}
