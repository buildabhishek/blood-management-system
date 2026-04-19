package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "blood_camps")
public class BloodCamp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Camp name is required")
    private String name;

    @NotBlank(message = "Location is required")
    private String location;

    private Double latitude;
    private Double longitude;

    @NotNull(message = "Camp date is required")
    private LocalDate campDate;

    @Min(0)
    private int totalUnitsCollected;

    /**
     * JSON string storing per-blood-group unit counts.
     * Format: {"A+":12,"A-":3,"B+":8,"B-":2,"AB+":1,"AB-":0,"O+":15,"O-":4}
     * Stored as TEXT so no schema change needed.
     */
    @Column(columnDefinition = "TEXT")
    private String bloodUnitsJson;

    @ManyToOne
    @JsonIgnoreProperties({"password", "phone", "role", "entityName", "address",
                            "fcmToken", "active", "createdAt", "updatedAt"})
    private User organiser;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
