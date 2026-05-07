package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository repo;
    @Value("${jwt.refresh-expiration:604800000}") private long refreshMs;

    public RefreshTokenService(RefreshTokenRepository repo) { this.repo = repo; }

    @Transactional
    public RefreshToken create(User user) {
        repo.deleteByUser(user);
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(UUID.randomUUID().toString());
        rt.setExpiryDate(Instant.now().plusMillis(refreshMs));
        return repo.save(rt);
    }

    public RefreshToken findByToken(String token) {
        return repo.findByToken(token).orElseThrow(() -> new RuntimeException("Refresh token not found or already used."));
    }

    @Transactional
    public void revoke(String token) {
        repo.findByToken(token).ifPresent(repo::delete);
    }
}
