package com.bms.controller;

import com.bms.dto.*;
import com.bms.entity.RefreshToken;
import com.bms.entity.User;
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

    private final UserService userService;
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(UserService userService, AuthenticationManager authManager,
            JwtUtil jwtUtil, RefreshTokenService refreshTokenService,
            LoginAttemptService loginAttemptService) {
        this.userService = userService;
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return ResponseEntity.ok(Map.of("message", "Registered successfully", "id", user.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        String phone = req.getPhone();

        // Rate limiting / lockout check
        if (loginAttemptService.isLocked(phone)) {
            return ResponseEntity.status(429).body(
                Map.of("error", "Account temporarily locked due to too many failed attempts. Try again later."));
        }

        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(phone, req.getPassword()));

            User dbUser = userService.findByPhone(phone);
            if (!dbUser.isActive()) {
                return ResponseEntity.status(401).body(Map.of("error", "Account is deactivated"));
            }

            // Save FCM token if provided
            if (req.getFcmToken() != null && !req.getFcmToken().isBlank()) {
                userService.updateFcmToken(phone, req.getFcmToken());
            }

            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            String accessToken  = jwtUtil.generateAccessToken(userDetails, dbUser.getRole());
            RefreshToken refresh = refreshTokenService.create(dbUser);

            loginAttemptService.recordSuccess(phone);

            Map<String, Object> resp = new HashMap<>();
            resp.put("token",        accessToken);
            resp.put("refreshToken", refresh.getToken());
            resp.put("role",         dbUser.getRole().name());
            if (dbUser.getEntityName() != null) resp.put("entityName", dbUser.getEntityName());

            return ResponseEntity.ok(resp);

        } catch (BadCredentialsException e) {
            loginAttemptService.recordFailure(phone);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid phone or password"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Authentication failed"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        try {
            RefreshToken rt = refreshTokenService.findByToken(req.getRefreshToken());
            if (rt.isExpired()) {
                refreshTokenService.revoke(req.getRefreshToken());
                return ResponseEntity.status(401).body(Map.of("error", "Refresh token expired. Please log in again."));
            }
            User user = rt.getUser();
            UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getPhone())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

            String newAccess  = jwtUtil.generateAccessToken(userDetails, user.getRole());
            RefreshToken newRt = refreshTokenService.create(user); // rotate

            return ResponseEntity.ok(Map.of(
                "token",        newAccess,
                "refreshToken", newRt.getToken()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) RefreshTokenRequest req) {
        if (req != null && req.getRefreshToken() != null) {
            refreshTokenService.revoke(req.getRefreshToken());
        }
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PutMapping("/fcm-token")
    public ResponseEntity<?> updateFcmToken(@RequestBody Map<String, String> body,
            org.springframework.security.core.Authentication auth) {
        userService.updateFcmToken(auth.getName(), body.get("fcmToken"));
        return ResponseEntity.ok(Map.of("message", "FCM token updated"));
    }
}
