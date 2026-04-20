package com.bms.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class FirebaseService {

    public void sendNotification(String token) throws Exception {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle("Blood Needed 🚑")
                        .setBody("Urgent requirement for O+ blood")
                        .build())
                .build();

        FirebaseMessaging.getInstance().send(message);
    }
}
