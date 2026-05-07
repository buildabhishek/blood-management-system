package com.bms.service;

import com.bms.entity.*;
import com.bms.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.UUID;

@Service
public class LoginAttemptService {
    private final LoginAttemptRepository repo;
    @Value("${app.auth.max-attempts:5}")    private int maxAttempts;
    @Value("${app.auth.lockout-minutes:15}") private int lockoutMinutes;

    public LoginAttemptService(LoginAttemptRepository repo) { this.repo = repo; }

    public boolean isLocked(String phone) {
        return repo.findByPhone(phone).map(LoginAttempt::isLocked).orElse(false);
    }

    @Transactional
    public void recordFailure(String phone) {
        LoginAttempt a = repo.findByPhone(phone).orElseGet(() -> {
            LoginAttempt n = new LoginAttempt(); n.setPhone(phone); return n;
        });
        a.setFailureCount(a.getFailureCount() + 1);
        a.setLastAttemptAt(LocalDateTime.now());
        if (a.getFailureCount() >= maxAttempts)
            a.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
        repo.save(a);
    }

    @Transactional
    public void recordSuccess(String phone) {
        repo.findByPhone(phone).ifPresent(a -> {
            a.setFailureCount(0); a.setLockedUntil(null); repo.save(a);
        });
    }
}
