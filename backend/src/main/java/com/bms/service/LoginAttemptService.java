package com.bms.service;

import com.bms.entity.LoginAttempt;
import com.bms.repository.LoginAttemptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LoginAttemptService {

    private final LoginAttemptRepository repo;

    @Value("${app.auth.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.auth.lockout-minutes:15}")
    private int lockoutMinutes;

    public LoginAttemptService(LoginAttemptRepository repo) {
        this.repo = repo;
    }

    public boolean isLocked(String phone) {
        return repo.findByPhone(phone).map(LoginAttempt::isLocked).orElse(false);
    }

    @Transactional
    public void recordFailure(String phone) {
        LoginAttempt attempt = repo.findByPhone(phone)
                .orElseGet(() -> { LoginAttempt a = new LoginAttempt(); a.setPhone(phone); return a; });

        attempt.setFailureCount(attempt.getFailureCount() + 1);
        attempt.setLastAttemptAt(LocalDateTime.now());

        if (attempt.getFailureCount() >= maxAttempts) {
            attempt.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
        }
        repo.save(attempt);
    }

    @Transactional
    public void recordSuccess(String phone) {
        repo.findByPhone(phone).ifPresent(a -> {
            a.setFailureCount(0);
            a.setLockedUntil(null);
            repo.save(a);
        });
    }
}
