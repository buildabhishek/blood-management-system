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
@Table(name = "donors")
public class Donor {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Invalid phone number")
    private String phone;

    private String email;

    @NotNull(message = "Blood group is required")
    @Enumerated(EnumType.STRING)
    private BloodGroup bloodGroup;

    private LocalDate dateOfBirth;

    private LocalDate lastDonation;

    // Donation count
    @Column(nullable = false)
    private int donationCount = 0;

    // Health notes / questionnaire summary
    @Column(columnDefinition = "TEXT")
    private String healthNotes;

    // Address / zone
    private String address;
    private Double latitude;
    private Double longitude;

    @ManyToOne
    @JsonIgnoreProperties({"password","fcmToken","active","createdAt","updatedAt"})
    private User bloodBank;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Check 56-day re-donation eligibility
    public boolean isEligible() {
        if (lastDonation == null) return true;
        return lastDonation.plusDays(56).isBefore(LocalDate.now());
    }
}
