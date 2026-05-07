package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter @Setter
@Entity
@Table(name = "notification_logs")
public class NotificationLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address"})
    private User recipient;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String refType;  // REQUEST, CAMP, SYSTEM
    private Long   refId;

    @Column(nullable = false)
    private boolean read = false;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;
}
