package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "blood_requests")
public class BloodRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Patient name is required")
    @Size(min = 2, max = 100)
    private String patientName;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 50, message = "Quantity cannot exceed 50 units")
    private int quantity;

    @Enumerated(EnumType.STRING)
    private Urgency urgency;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private String notes;

    @ManyToOne
    @JsonIgnoreProperties({"password", "phone", "role", "entityName", "address", "fcmToken",
                            "active", "createdAt", "updatedAt", "latitude", "longitude"})
    private User hospital;

    @ManyToOne
    @JsonIgnoreProperties({"password", "phone", "role", "entityName", "address", "fcmToken",
                            "active", "createdAt", "updatedAt", "latitude", "longitude"})
    private User bloodBank;

    @ManyToOne
    @JsonIgnoreProperties({"password", "phone", "role", "entityName", "address", "fcmToken",
                            "active", "createdAt", "updatedAt", "latitude", "longitude"})
    private User rider;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) this.status = RequestStatus.PENDING;
    }

    // ── Convenience getters for frontend ─────────────────────────────────────
    public String getHospitalName() {
        if (hospital == null) return null;
        return hospital.getEntityName() != null ? hospital.getEntityName() : hospital.getName();
    }

    public String getBloodBankName() {
        if (bloodBank == null) return null;
        return bloodBank.getEntityName() != null ? bloodBank.getEntityName() : bloodBank.getName();
    }

    public String getRiderName() { return rider != null ? rider.getName() : null; }
    public Long getRiderId() { return rider != null ? rider.getId() : null; }
}
