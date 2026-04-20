package com.bms.service;

import com.bms.entity.NotificationLog;
import com.bms.entity.User;
import com.bms.repository.NotificationLogRepository;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Sends push notifications via FCM AND persists them to the DB
 * so the notification bell in each dashboard can show history.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final boolean firebaseEnabled;
    private final NotificationLogRepository logRepo;

    public NotificationService(NotificationLogRepository logRepo) {
        this.logRepo = logRepo;
        boolean enabled = false;
        try {
            com.google.firebase.FirebaseApp.getInstance();
            enabled = true;
        } catch (Exception e) {
            log.warn("Firebase not configured — push notifications disabled.");
        }
        this.firebaseEnabled = enabled;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public void notifyBloodBankRequestReceived(User bloodBank, String bloodGroup, String hospitalName) {
        deliver(bloodBank,
            "🩸 New Blood Request",
            hospitalName + " needs " + bloodGroup + ". Tap to accept or reject.",
            "REQUEST", null);
    }

    public void notifyHospitalRequestAccepted(User hospital, String bloodGroup, String bankName) {
        deliver(hospital,
            "✅ Request Accepted",
            bankName + " accepted your " + bloodGroup + " request. Rider will be assigned shortly.",
            "REQUEST", null);
    }

    public void notifyHospitalRequestRejected(User hospital, String bloodGroup, String bankName, String reason) {
        String msg = bankName + " could not fulfil your " + bloodGroup + " request.";
        if (reason != null && !reason.isBlank()) msg += " Reason: " + reason;
        msg += " Please try another blood bank.";
        deliver(hospital, "❌ Request Rejected", msg, "REQUEST", null);
    }

    public void notifyHospitalRequestCancelled(User bloodBank, String bloodGroup, String hospitalName) {
        deliver(bloodBank,
            "🚫 Request Cancelled",
            hospitalName + " cancelled their " + bloodGroup + " request.",
            "REQUEST", null);
    }

    public void notifyHospitalRiderAssigned(User hospital, String riderName, String bloodGroup, Long requestId) {
        deliver(hospital,
            "🏍 Rider Assigned",
            riderName + " is on their way to pick up " + bloodGroup + " for you.",
            "REQUEST", requestId);
    }

    public void notifyHospitalDelivered(User hospital, String bloodGroup, Long requestId) {
        deliver(hospital,
            "📦 Blood Delivered",
            bloodGroup + " has been successfully delivered. Please confirm receipt.",
            "REQUEST", requestId);
    }

    public void notifyRiderNewTask(User rider, String bloodGroup, String hospitalName, Long requestId) {
        deliver(rider,
            "🚚 New Delivery Task",
            "Pick up " + bloodGroup + " and deliver to " + hospitalName + ".",
            "REQUEST", requestId);
    }

    public void notifyRiderTaskCancelled(User rider, String bloodGroup) {
        deliver(rider,
            "🚫 Task Cancelled",
            "The " + bloodGroup + " delivery task has been cancelled.",
            "REQUEST", null);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void deliver(User user, String title, String body, String refType, Long refId) {
        if (user == null) return;

        // 1. Persist to DB (always — even if FCM fails)
        NotificationLog entry = new NotificationLog();
        entry.setRecipient(user);
        entry.setTitle(title);
        entry.setMessage(body);
        entry.setRefType(refType);
        entry.setRefId(refId);
        try {
            logRepo.save(entry);
        } catch (Exception e) {
            log.warn("Failed to persist notification log: {}", e.getMessage());
        }

        // 2. Push via FCM (best-effort)
        if (firebaseEnabled && user.getFcmToken() != null && !user.getFcmToken().isBlank()) {
            sendFcm(user.getFcmToken(), title, body);
        }
    }

    private void sendFcm(String fcmToken, String title, String body) {
        try {
            Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .build();
            String response = FirebaseMessaging.getInstance().send(message);
            log.debug("FCM sent: {}", response);
        } catch (FirebaseMessagingException e) {
            log.warn("FCM send failed: {}", e.getMessage());
        }
    }
}
