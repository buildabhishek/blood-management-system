package com.bms.controller;

import com.bms.dto.*;
import com.bms.entity.*;
import com.bms.security.JwtUtil;
import com.bms.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService           userService;
    private final AuthenticationManager authManager;
    private final JwtUtil               jwtUtil;
    private final RefreshTokenService   refreshService;
    private final LoginAttemptService   attemptService;

    public AuthController(UserService u, AuthenticationManager a, JwtUtil j,
                          RefreshTokenService r, LoginAttemptService l) {
        userService = u; authManager = a; jwtUtil = j; refreshService = r; attemptService = l;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return ResponseEntity.ok(Map.of("message", "Registered successfully", "id", user.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        String phone = req.getPhone();
        if (attemptService.isLocked(phone))
            return ResponseEntity.status(429).body(Map.of("error",
                "Account locked due to too many failed attempts. Try again in 15 minutes."));
        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(phone, req.getPassword()));
            User user = userService.findByPhone(phone);
            if (!user.isActive())
                return ResponseEntity.status(401).body(Map.of("error", "Account is deactivated."));
            if (req.getFcmToken() != null && !req.getFcmToken().isBlank())
                userService.updateFcmToken(phone, req.getFcmToken());

            UserDetails ud = (UserDetails) auth.getPrincipal();
            String accessToken = jwtUtil.generateAccessToken(ud, user.getRole());
            RefreshToken rt    = refreshService.create(user);
            attemptService.recordSuccess(phone);

            Map<String, Object> resp = new HashMap<>();
            resp.put("token",        accessToken);
            resp.put("refreshToken", rt.getToken());
            resp.put("role",         user.getRole().name());
            resp.put("name",         user.getName());
            resp.put("phone",        user.getPhone());
            if (user.getEntityName()  != null) resp.put("entityName",  user.getEntityName());
            if (user.getAssignedZone()!= null) resp.put("assignedZone", user.getAssignedZone());
            resp.put("available", user.isAvailable());
            return ResponseEntity.ok(resp);

        } catch (BadCredentialsException e) {
            attemptService.recordFailure(phone);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid phone or password."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Authentication failed."));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        try {
            RefreshToken rt = refreshService.findByToken(req.getRefreshToken());
            if (rt.isExpired()) {
                refreshService.revoke(req.getRefreshToken());
                return ResponseEntity.status(401).body(Map.of("error", "Session expired. Please log in again."));
            }
            User user = rt.getUser();
            UserDetails ud = org.springframework.security.core.userdetails.User
                .withUsername(user.getPhone()).password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name()).build();
            String newToken = jwtUtil.generateAccessToken(ud, user.getRole());
            RefreshToken newRt = refreshService.create(user);
            return ResponseEntity.ok(Map.of("token", newToken, "refreshToken", newRt.getToken()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) RefreshTokenRequest req) {
        if (req != null && req.getRefreshToken() != null) refreshService.revoke(req.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out."));
    }

    @PutMapping("/fcm-token")
    public ResponseEntity<?> updateFcm(@RequestBody Map<String, String> body, Authentication auth) {
        userService.updateFcmToken(auth.getName(), body.get("fcmToken"));
        return ResponseEntity.ok(Map.of("message", "FCM token updated."));
    }
}
