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
@Table(name = "blood_inventory")
public class BloodInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;

    // FIX 6: Changed @Min(0) to @Min(1) — cannot add 0 units to inventory
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    private LocalDate collectionDate;
    private LocalDate expiryDate;

    @NotBlank(message = "Category is required")
    private String category; // Whole Blood, PCV, FFP, SDP, Platelets

    @ManyToOne
    @JsonIgnoreProperties({"password", "phone", "role", "entityName", "address", "fcmToken",
                            "active", "createdAt", "updatedAt"})
    private User bloodBank;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public String getLocation() {
        if (bloodBank == null) return null;
        return bloodBank.getEntityName() != null ? bloodBank.getEntityName() : bloodBank.getName();
    }

    public Long getBloodBankId() { return bloodBank != null ? bloodBank.getId() : null; }

    public Double getLatitude()  { return bloodBank != null ? bloodBank.getLatitude()  : null; }
    public Double getLongitude() { return bloodBank != null ? bloodBank.getLongitude() : null; }
}
