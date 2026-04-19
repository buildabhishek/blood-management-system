package com.bms.service;

import com.bms.entity.RefreshToken;
import com.bms.entity.User;
import com.bms.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repo;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public RefreshToken create(User user) {
        // Revoke any existing token for this user
        repo.deleteByUser(user);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));
        return repo.save(token);
    }

    public RefreshToken findByToken(String token) {
        return repo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found or already used"));
    }

    @Transactional
    public void revoke(String token) {
        repo.findByToken(token).ifPresent(repo::delete);
    }
}
