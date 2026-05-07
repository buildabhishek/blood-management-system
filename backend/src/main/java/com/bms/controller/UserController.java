package com.bms.controller;

import com.bms.entity.*;
import com.bms.repository.*;
import com.bms.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository         userRepo;
    private final BloodRequestRepository reqRepo;
    private final UserService            userService;

    // BUG FIX: define the active statuses constant here to match service layer
    private static final List<RequestStatus> ACTIVE_RIDER_STATUSES =
        List.of(RequestStatus.ASSIGNED, RequestStatus.IN_TRANSIT);

    public UserController(UserRepository ur, BloodRequestRepository rr, UserService us) {
        userRepo = ur; reqRepo = rr; userService = us;
    }

    /** All active riders with task count — for blood bank assign-rider modal */
    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @GetMapping("/riders")
    public List<Map<String, Object>> getRiders() {
        return userRepo.findByRoleAndActiveTrue(Role.RIDER).stream().map(r -> {
            // BUG FIX: pass statuses list to fixed repo method (old call had wrong 1-arg signature)
            long tasks = reqRepo.countActiveTasksByRider(r, ACTIVE_RIDER_STATUSES);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          r.getId());
            m.put("name",        r.getName());
            m.put("phone",       r.getPhone());
            m.put("vehicleType", r.getVehicleType());
            m.put("assignedZone",r.getAssignedZone());
            m.put("available",   r.isAvailable() && tasks == 0);
            m.put("activeTasks", tasks);
            return m;
        }).collect(Collectors.toList());
    }

    /** Rider toggles own availability */
    @PreAuthorize("hasRole('RIDER')")
    @PutMapping("/availability")
    public ResponseEntity<?> setAvailability(@RequestBody Map<String, Boolean> body, Authentication auth) {
        Boolean available = body.get("available");
        if (available == null) return ResponseEntity.badRequest().body(Map.of("error", "available field required."));
        userService.setAvailability(auth.getName(), available);
        return ResponseEntity.ok(Map.of("message", "Availability updated.", "available", available));
    }

    /** Current user's own profile */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        User u = userRepo.findByPhone(auth.getName()).orElseThrow();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           u.getId());
        m.put("name",         u.getName());
        m.put("phone",        u.getPhone());
        m.put("role",         u.getRole());
        m.put("entityName",   u.getEntityName());
        m.put("address",      u.getAddress());
        m.put("latitude",     u.getLatitude());
        m.put("longitude",    u.getLongitude());
        m.put("vehicleType",  u.getVehicleType());
        m.put("vehiclePlate", u.getVehiclePlate());
        m.put("assignedZone", u.getAssignedZone());
        m.put("available",    u.isAvailable());
        m.put("active",       u.isActive());
        return ResponseEntity.ok(m);
    }
}
