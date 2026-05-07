package com.bms.service;

import com.bms.dto.RegisterRequest;
import com.bms.entity.*;
import com.bms.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.UUID;

// ═══════════════════════════════════════════════════════════════════════════════
// UserService
// ═══════════════════════════════════════════════════════════════════════════════
@Service
public class UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    UserService(UserRepository userRepo, PasswordEncoder encoder) {
        this.userRepo = userRepo;
        this.encoder  = encoder;
    }

    @Transactional
    public User register(RegisterRequest r) {
        if (userRepo.findByPhone(r.getPhone()).isPresent())
            throw new RuntimeException("Phone number already registered.");
        if (r.getRole() == Role.ADMIN)
            throw new RuntimeException("Admin registration is not allowed.");

        User u = new User();
        u.setName(r.getName());
        u.setPhone(r.getPhone());
        u.setPassword(encoder.encode(r.getPassword()));
        u.setRole(r.getRole());
        u.setEntityName(r.getEntityName());
        u.setAddress(r.getAddress());
        u.setLatitude(r.getLatitude());
        u.setLongitude(r.getLongitude());
        u.setVehicleType(r.getVehicleType());
        u.setVehiclePlate(r.getVehiclePlate());
        u.setAssignedZone(r.getAssignedZone());
        u.setActive(true);
        u.setAvailable(true);
        return userRepo.save(u);
    }

    public User findByPhone(String phone) {
        return userRepo.findByPhone(phone).orElseThrow(() -> new RuntimeException("User not found."));
    }

    @Transactional
    public void updateFcmToken(String phone, String token) {
        userRepo.findByPhone(phone).ifPresent(u -> { u.setFcmToken(token); userRepo.save(u); });
    }

    @Transactional
    public void setAvailability(String phone, boolean available) {
        userRepo.findByPhone(phone).ifPresent(u -> { u.setAvailable(available); userRepo.save(u); });
    }

    @Transactional
    public void deactivate(Long id) {
        User u = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found."));
        if (u.getRole() == Role.ADMIN) throw new RuntimeException("Cannot deactivate admin.");
        u.setActive(false);
        userRepo.save(u);
    }

    @Transactional
    public User updateProfile(Long id, RegisterRequest r) {
        User u = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found."));
        if (r.getName()        != null) u.setName(r.getName());
        if (r.getEntityName()  != null) u.setEntityName(r.getEntityName());
        if (r.getAddress()     != null) u.setAddress(r.getAddress());
        if (r.getLatitude()    != null) u.setLatitude(r.getLatitude());
        if (r.getLongitude()   != null) u.setLongitude(r.getLongitude());
        if (r.getVehicleType() != null) u.setVehicleType(r.getVehicleType());
        if (r.getVehiclePlate()!= null) u.setVehiclePlate(r.getVehiclePlate());
        if (r.getAssignedZone()!= null) u.setAssignedZone(r.getAssignedZone());
        if (r.getPassword()    != null && r.getPassword().length() >= 6)
            u.setPassword(encoder.encode(r.getPassword()));
        return userRepo.save(u);
    }
}
