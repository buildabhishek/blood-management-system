package com.bms.service;

import com.bms.entity.User;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Firebase Cloud Messaging notification service.
 * Sends push notifications to mobile/web clients via FCM.
 * Gracefully no-ops if Firebase is not configured.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final boolean firebaseEnabled;

    public NotificationService() {
        // Check if Firebase has been initialized
        boolean enabled = false;
        try {
            com.google.firebase.FirebaseApp.getInstance();
            enabled = true;
        } catch (Exception e) {
            log.warn("Firebase not configured — push notifications disabled. Set FIREBASE_CREDENTIALS_PATH to enable.");
        }
        this.firebaseEnabled = enabled;
    }

    public void sendToUser(User user, String title, String body) {
        if (!firebaseEnabled || user.getFcmToken() == null || user.getFcmToken().isBlank()) return;
        send(user.getFcmToken(), title, body);
    }

    public void notifyBloodBankRequestReceived(User bloodBank, String bloodGroup, String hospitalName) {
        sendToUser(bloodBank,
            "🩸 New Blood Request",
            hospitalName + " needs " + bloodGroup + ". Tap to accept or reject.");
    }

    public void notifyHospitalRequestAccepted(User hospital, String bloodGroup, String bankName) {
        sendToUser(hospital,
            "✅ Request Accepted",
            bankName + " accepted your " + bloodGroup + " request. Rider will be assigned shortly.");
    }

    public void notifyHospitalRequestRejected(User hospital, String bloodGroup, String bankName) {
        sendToUser(hospital,
            "❌ Request Rejected",
            bankName + " could not fulfil your " + bloodGroup + " request. Please try another bank.");
    }

    public void notifyHospitalRiderAssigned(User hospital, String riderName, String bloodGroup) {
        sendToUser(hospital,
            "🏍 Rider Assigned",
            riderName + " is picking up " + bloodGroup + " for you.");
    }

    public void notifyHospitalDelivered(User hospital, String bloodGroup) {
        sendToUser(hospital,
            "📦 Blood Delivered",
            bloodGroup + " has been delivered. Please confirm receipt.");
    }

    public void notifyRiderNewTask(User rider, String bloodGroup, String hospitalName) {
        sendToUser(rider,
            "🚚 New Delivery Task",
            "Pick up " + bloodGroup + " for " + hospitalName);
    }

    private void send(String fcmToken, String title, String body) {
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
            log.warn("FCM send failed for token {}: {}", fcmToken.substring(0, 8) + "...", e.getMessage());
        }
    }
}
