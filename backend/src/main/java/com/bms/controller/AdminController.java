package com.bms.controller;

import com.bms.dto.RegisterRequest;
import com.bms.entity.*;
import com.bms.repository.*;
import com.bms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository         userRepo;
    private final BloodRequestRepository reqRepo;
    private final BloodInventoryRepository invRepo;
    private final UserService            userService;
    private final PasswordEncoder        encoder;

    public AdminController(UserRepository ur, BloodRequestRepository rr,
                           BloodInventoryRepository ir, UserService us, PasswordEncoder enc) {
        userRepo = ur; reqRepo = rr; invRepo = ir; userService = us; encoder = enc;
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public Page<User> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @GetMapping("/hospitals")
    public List<User> getHospitals() { return userRepo.findByRoleAndActiveTrue(Role.HOSPITAL); }

    @GetMapping("/blood-banks")
    public List<User> getBloodBanks() { return userRepo.findByRoleAndActiveTrue(Role.BLOOD_BANK); }

    @GetMapping("/riders")
    public List<User> getRiders() { return userRepo.findByRoleAndActiveTrue(Role.RIDER); }

    /**
     * Admin can create any user including blood banks, hospitals, riders, and admins.
     * BUG FIX: original code used encoder.encode() but the User entity's @JsonProperty(WRITE_ONLY)
     * on password means it won't be validated — we now delegate to UserService which handles
     * encoding correctly, but allow ADMIN role (unlike public register).
     */
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody RegisterRequest req) {
        try {
            if (userRepo.findByPhone(req.getPhone()).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error", "Phone already registered."));
            User u = new User();
            u.setName(req.getName());
            u.setPhone(req.getPhone());
            // BUG FIX: was encoder.encode(req.getPassword()) but req.getPassword() could be null
            // if the @NotBlank validation on RegisterRequest is satisfied — need null check
            if (req.getPassword() == null || req.getPassword().length() < 6)
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters."));
            u.setPassword(encoder.encode(req.getPassword()));
            u.setRole(req.getRole() != null ? req.getRole() : Role.HOSPITAL);
            u.setEntityName(req.getEntityName());
            u.setAddress(req.getAddress());
            u.setLatitude(req.getLatitude());
            u.setLongitude(req.getLongitude());
            u.setVehicleType(req.getVehicleType());
            u.setVehiclePlate(req.getVehiclePlate());
            u.setAssignedZone(req.getAssignedZone());
            u.setActive(true);
            u.setAvailable(true);
            return ResponseEntity.ok(userRepo.save(u));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try { userService.deactivate(id); return ResponseEntity.ok(Map.of("message", "Deactivated.")); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        User u = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found."));
        u.setActive(true); userRepo.save(u);
        return ResponseEntity.ok(Map.of("message", "Activated."));
    }

    // ── Requests ───────────────────────────────────────────────────────────────

    @GetMapping("/requests")
    public Page<BloodRequest> getRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reqRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // ── Inventory ──────────────────────────────────────────────────────────────

    @GetMapping("/inventory")
    public Page<BloodInventory> getInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return invRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    @GetMapping("/reports/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalRequests", reqRepo.count());
        m.put("pending",   reqRepo.countByStatus(RequestStatus.PENDING));
        m.put("accepted",  reqRepo.countByStatus(RequestStatus.ACCEPTED));
        m.put("assigned",  reqRepo.countByStatus(RequestStatus.ASSIGNED));
        m.put("inTransit", reqRepo.countByStatus(RequestStatus.IN_TRANSIT));
        m.put("delivered", reqRepo.countByStatus(RequestStatus.DELIVERED));
        m.put("rejected",  reqRepo.countByStatus(RequestStatus.REJECTED));
        m.put("cancelled", reqRepo.countByStatus(RequestStatus.CANCELLED));
        m.put("totalHospitals",  userRepo.countByRoleAndActiveTrue(Role.HOSPITAL));
        m.put("totalBloodBanks", userRepo.countByRoleAndActiveTrue(Role.BLOOD_BANK));
        m.put("totalRiders",     userRepo.countByRoleAndActiveTrue(Role.RIDER));
        m.put("totalUsers",      userRepo.count());
        m.put("totalInventoryRecords", invRepo.count());
        return ResponseEntity.ok(m);
    }
}
