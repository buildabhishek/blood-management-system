package com.bms.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.*;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.io.*;

@Configuration
public class FirebaseConfig {
    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials.path:}") private String credPath;
    @Value("${firebase.project-id:}")       private String projectId;

    @PostConstruct
    public void init() {
        if (credPath == null || credPath.isBlank()) {
            log.info("Firebase not configured — push notifications disabled.");
            return;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions opts = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(new FileInputStream(credPath)))
                    .setProjectId(projectId)
                    .build();
                FirebaseApp.initializeApp(opts);
                log.info("Firebase initialised for project: {}", projectId);
            }
        } catch (IOException e) {
            log.warn("Firebase init failed: {} — push disabled.", e.getMessage());
        }
    }
}
