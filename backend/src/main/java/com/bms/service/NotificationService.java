package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.NotificationLogRepository;
import com.google.firebase.messaging.*;
import org.slf4j.*;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationLogRepository logRepo;
    private final boolean fcmEnabled;

    public NotificationService(NotificationLogRepository logRepo) {
        this.logRepo = logRepo;
        boolean ok = false;
        try { com.google.firebase.FirebaseApp.getInstance(); ok = true; }
        catch (Exception e) { log.warn("FCM disabled — Firebase not initialised."); }
        this.fcmEnabled = ok;
    }

    // ── Public notification methods ────────────────────────────────────────────

    public void notifyBloodBankNewRequest(User bank, String bg, String hospital, Urgency urgency) {
        String prefix = urgency == Urgency.CRITICAL ? "🚨 CRITICAL" : urgency == Urgency.URGENT ? "⚡ URGENT" : "🩸 New";
        deliver(bank, prefix + " Blood Request",
            hospital + " needs " + bg + ". Tap to accept or reject.", "REQUEST", null);
    }

    public void notifyHospitalAccepted(User hospital, String bg, String bank) {
        deliver(hospital, "✅ Request Accepted",
            bank + " accepted your " + bg + " request. Rider will be assigned shortly.", "REQUEST", null);
    }

    public void notifyHospitalRejected(User hospital, String bg, String bank, String reason) {
        String msg = bank + " could not fulfil your " + bg + " request.";
        if (reason != null && !reason.isBlank()) msg += " Reason: " + reason;
        deliver(hospital, "❌ Request Rejected", msg, "REQUEST", null);
    }

    /**
     * BUG FIX: Renamed from notifyHospitalCancelled → notifyBloodBankCancelled.
     * The recipient of this notification is the BLOOD BANK (hospital cancelled their request),
     * not the hospital. The old name was misleading and the recipient was also wrong in the
     * BloodRequestService.cancel() call — it was passing bloodBank as the recipient while
     * the method was named "notifyHospital...". Method and call site are now correctly aligned.
     */
    public void notifyBloodBankCancelled(User bank, String bg, String hospital) {
        deliver(bank, "🚫 Request Cancelled",
            hospital + " cancelled their " + bg + " request.", "REQUEST", null);
    }

    public void notifyHospitalRiderAssigned(User hospital, String rider, String bg, Long reqId) {
        deliver(hospital, "🏍 Rider Assigned",
            rider + " is heading to pick up " + bg + " for you. Track live in your dashboard.", "REQUEST", reqId);
    }

    public void notifyHospitalPickedUp(User hospital, String bg, Long reqId) {
        deliver(hospital, "📦 Blood Picked Up",
            bg + " has been picked up and is in transit to your hospital.", "REQUEST", reqId);
    }

    public void notifyHospitalDelivered(User hospital, String bg, Long reqId) {
        deliver(hospital, "✅ Blood Delivered",
            bg + " has been successfully delivered. Please confirm receipt.", "REQUEST", reqId);
    }

    public void notifyRiderNewTask(User rider, String bg, String hospital, Long reqId) {
        deliver(rider, "🚚 New Delivery Task",
            "Pick up " + bg + " and deliver to " + hospital + ".", "REQUEST", reqId);
    }

    public void notifyRiderTaskCancelled(User rider, String bg) {
        deliver(rider, "🚫 Task Cancelled", "The " + bg + " delivery task has been cancelled.", "REQUEST", null);
    }

    public void notifyBloodBankLowStock(User bank, String bg, int qty) {
        deliver(bank, "⚠️ Low Stock Alert",
            bg + " is running low — only " + qty + " unit(s) remaining. Please replenish.", "SYSTEM", null);
    }

    public void notifySystem(User user, String title, String message) {
        deliver(user, title, message, "SYSTEM", null);
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    private void deliver(User user, String title, String body, String refType, Long refId) {
        if (user == null) return;
        try {
            NotificationLog n = new NotificationLog();
            n.setRecipient(user); n.setTitle(title); n.setMessage(body);
            n.setRefType(refType); n.setRefId(refId);
            logRepo.save(n);
        } catch (Exception e) { log.warn("Failed to persist notification: {}", e.getMessage()); }
        if (fcmEnabled && user.getFcmToken() != null && !user.getFcmToken().isBlank())
            sendFcm(user.getFcmToken(), title, body);
    }

    private void sendFcm(String token, String title, String body) {
        try {
            FirebaseMessaging.getInstance().send(Message.builder()
                .setToken(token)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .build());
        } catch (FirebaseMessagingException e) { log.warn("FCM send failed: {}", e.getMessage()); }
    }
}
