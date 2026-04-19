package com.bms.controller;

import com.bms.entity.*;
import com.bms.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PreAuthorize("hasAnyRole('BLOOD_BANK','ADMIN')")
    @GetMapping("/riders")
    public List<User> getRiders() {
        return userRepo.findByRoleAndActiveTrue(Role.RIDER);
    }
}
