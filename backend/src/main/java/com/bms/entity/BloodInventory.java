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
@Table(name = "blood_inventory")
public class BloodInventory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    @NotBlank(message = "Category is required")
    private String category; // Whole Blood, PCV, FFP, SDP, Platelets

    private String unitId;           // Barcode / unique unit identifier
    private Integer volumeMl;        // Volume in ml
    private LocalDate collectionDate;
    private LocalDate expiryDate;

    // Low-stock threshold — alert when quantity drops to or below this
    @Column(nullable = false)
    private int lowStockThreshold = 5;

    @ManyToOne
    @JoinColumn(name = "blood_bank_id")
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt","latitude","longitude","address","available","vehicleType","vehiclePlate","assignedZone"})
    private User bloodBank;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Convenience
    public Long getBloodBankId()  { return bloodBank != null ? bloodBank.getId()        : null; }
    public Double getLatitude()   { return bloodBank != null ? bloodBank.getLatitude()   : null; }
    public Double getLongitude()  { return bloodBank != null ? bloodBank.getLongitude()  : null; }
    public String getLocation()   {
        if (bloodBank == null) return null;
        return bloodBank.getEntityName() != null ? bloodBank.getEntityName() : bloodBank.getName();
    }
}
