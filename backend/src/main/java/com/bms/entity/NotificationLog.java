package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter @Setter
@Entity
@Table(name = "notification_logs")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who should see this notification
    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address"})
    private User recipient;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    // Optional link: "REQUEST:42" or "CAMP:7" — frontend uses to navigate
    private String refType;
    private Long   refId;

    @Column(nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
