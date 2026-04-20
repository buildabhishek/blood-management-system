package com.bms.controller;

import com.bms.entity.NotificationLog;
import com.bms.repository.NotificationLogRepository;
import com.bms.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final UserService userService;
    private final NotificationLogRepository notifRepo;

    public NotificationController(UserService userService,
                                  NotificationLogRepository notifRepo) {
        this.userService = userService;
        this.notifRepo   = notifRepo;
    }

    /** Save FCM device token for authenticated user */
    @PostMapping("/save-token")
    public ResponseEntity<Map<String, String>> saveToken(
            @RequestBody Map<String, String> body, Authentication auth) {
        String fcmToken = body.get("token");
        if (fcmToken == null || fcmToken.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "token is required"));
        if (auth != null && auth.getName() != null)
            userService.updateFcmToken(auth.getName(), fcmToken);
        return ResponseEntity.ok(Map.of("message", "Token saved"));
    }

    /** Get all notifications for the logged-in user (latest 50) */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationLog>> getMyNotifications(Authentication auth) {
        List<NotificationLog> all = notifRepo
            .findByRecipient_PhoneOrderByCreatedAtDesc(auth.getName());
        // Return at most 50 — enough for the bell panel
        return ResponseEntity.ok(all.size() > 50 ? all.subList(0, 50) : all);
    }

    /** Unread count — used for the badge */
    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        long count = notifRepo.countByRecipient_PhoneAndReadFalse(auth.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** Mark all notifications as read */
    @PutMapping("/notifications/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication auth) {
        int updated = notifRepo.markAllReadByPhone(auth.getName());
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    /** Mark single notification as read */
    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(
            @PathVariable Long id, Authentication auth) {
        notifRepo.findById(id).ifPresent(n -> {
            if (n.getRecipient().getPhone().equals(auth.getName())) {
                n.setRead(true);
                notifRepo.save(n);
            }
        });
        return ResponseEntity.ok(Map.of("message", "Marked read"));
    }
}
