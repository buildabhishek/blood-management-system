package com.bms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne @JoinColumn(nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant expiryDate;

    public boolean isExpired() { return Instant.now().isAfter(expiryDate); }
}
