package com.bms.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter @Setter
@Entity
@Table(name = "blood_requests")
public class BloodRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Patient name is required")
    @Size(min = 2, max = 100)
    private String patientName;

    private Integer patientAge;
    private String  wardBed;
    private String  attendingPhysician;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;

    private String componentType; // Whole Blood, PCV, FFP, SDP

    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 50, message = "Quantity cannot exceed 50 units")
    private int quantity;

    @Enumerated(EnumType.STRING)
    private Urgency urgency = Urgency.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    private String notes;
    private String rejectionReason;

    // Receipt attachment (base64)
    @Column(columnDefinition = "TEXT")
    private String receiptData;
    private String receiptFileName;
    private String receiptMimeType;

    // Delivery OTP — READ_ONLY so it's returned in JSON but never accepted from client
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String deliveryOtp;
    private LocalDateTime otpExpiry;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address","available","vehicleType","vehiclePlate","assignedZone"})
    private User hospital;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address","available","vehicleType","vehiclePlate","assignedZone"})
    private User bloodBank;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address","available","vehicleType","vehiclePlate","assignedZone"})
    private User rider;

    @CreationTimestamp @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Long version;

    @PrePersist
    protected void onCreate() {
        if (status == null) status = RequestStatus.PENDING;
        if (urgency == null) urgency = Urgency.NORMAL;
    }

    // Convenience getters
    public String getHospitalName()  { return hospital  != null ? (hospital.getEntityName()  != null ? hospital.getEntityName()  : hospital.getName())  : null; }
    public String getBloodBankName() { return bloodBank != null ? (bloodBank.getEntityName() != null ? bloodBank.getEntityName() : bloodBank.getName())  : null; }
    public String getRiderName()     { return rider     != null ? rider.getName()     : null; }
    public Long   getRiderId()       { return rider     != null ? rider.getId()       : null; }
    public String getRiderPhone()    { return rider     != null ? rider.getPhone()    : null; }
    public boolean hasReceipt()      { return receiptData != null && !receiptData.isBlank(); }
}
