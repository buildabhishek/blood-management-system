package com.bms.controller;

import com.bms.entity.NotificationLog;
import com.bms.repository.NotificationLogRepository;
import com.bms.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final UserService userService;
    private final NotificationLogRepository repo;

    public NotificationController(UserService u, NotificationLogRepository r) {
        userService = u; repo = r;
    }

    // BUG FIX: moved to /api/notifications/save-token for consistency
    @PostMapping("/notifications/save-token")
    public ResponseEntity<?> saveToken(@RequestBody Map<String, String> body, Authentication auth) {
        String token = body.get("token");
        if (token == null || token.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "token required."));
        if (auth != null) userService.updateFcmToken(auth.getName(), token);
        return ResponseEntity.ok(Map.of("message", "Token saved."));
    }

    // BUG FIX: keep legacy /api/save-token path working so existing clients don't break
    @PostMapping("/save-token")
    public ResponseEntity<?> saveTokenLegacy(@RequestBody Map<String, String> body, Authentication auth) {
        return saveToken(body, auth);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Authentication auth) {
        List<NotificationLog> all = repo.findByRecipient_PhoneOrderByCreatedAtDesc(auth.getName());
        List<NotificationLog> page = all.size() > 50 ? all.subList(0, 50) : all;
        // BUG FIX: return safe DTO map instead of full entity (prevents user data leakage via recipient field)
        List<Map<String, Object>> result = page.stream().map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",        n.getId());
            m.put("title",     n.getTitle());
            m.put("message",   n.getMessage());
            m.put("refType",   n.getRefType());
            m.put("refId",     n.getRefId());
            m.put("read",      n.isRead());
            m.put("createdAt", n.getCreatedAt());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", repo.countByRecipient_PhoneAndReadFalse(auth.getName())));
    }

    @PutMapping("/notifications/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication auth) {
        return ResponseEntity.ok(Map.of("updated", repo.markAllReadByPhone(auth.getName())));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id, Authentication auth) {
        repo.findById(id).ifPresent(n -> {
            // BUG FIX: was missing auth check — any logged-in user could mark any notification read
            if (n.getRecipient().getPhone().equals(auth.getName())) { n.setRead(true); repo.save(n); }
        });
        return ResponseEntity.ok(Map.of("message", "Marked read."));
    }
}
