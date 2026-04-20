package com.bms.controller;

import com.bms.entity.Role;
import com.bms.entity.User;
import com.bms.repository.BloodRequestRepository;
import com.bms.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;
    private final BloodRequestRepository requestRepo;

    public UserController(UserRepository userRepo, BloodRequestRepository requestRepo) {
        this.userRepo    = userRepo;
        this.requestRepo = requestRepo;
    }

    /**
     * Returns all active riders with their current active task count.
     * Blood bank uses this to avoid overloading a single rider.
     */
    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @GetMapping("/riders")
    public List<Map<String, Object>> getRiders() {
        return userRepo.findByRoleAndActiveTrue(Role.RIDER).stream().map(rider -> {
            long activeTasks = requestRepo.countActiveTasksByRider(rider);
            return Map.<String, Object>of(
                "id",          rider.getId(),
                "name",        rider.getName(),
                "phone",       rider.getPhone(),
                "activeTasks", activeTasks,
                "available",   activeTasks == 0
            );
        }).collect(Collectors.toList());
    }
}
