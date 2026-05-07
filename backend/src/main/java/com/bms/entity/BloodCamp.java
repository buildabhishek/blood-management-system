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

@Getter @Setter
@Entity
@Table(name = "blood_camps")
public class BloodCamp {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Camp name is required")
    private String name;

    @NotBlank(message = "Location is required")
    private String location;

    private Double latitude;
    private Double longitude;

    @NotNull(message = "Camp date is required")
    private LocalDate campDate;
    private String campTime;         // e.g. "9:00 AM - 5:00 PM"

    private String partnerInstitution;   // Hospital / College / Corporate
    private Integer targetUnits;         // Collection goal
    private Integer totalUnitsCollected;
    private Integer donorsAttended;

    // JSON breakdown per blood group: {"A+":12,"B+":8,...}
    @Column(columnDefinition = "TEXT")
    private String bloodUnitsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampStatus status = CampStatus.UPCOMING;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt"})
    private User organiser;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum CampStatus { UPCOMING, ONGOING, COMPLETED, CANCELLED }
}
