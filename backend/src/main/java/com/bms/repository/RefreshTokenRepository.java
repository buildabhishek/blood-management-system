package com.bms.repository;

import com.bms.entity.RefreshToken;
import com.bms.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    // BUG FIX: added @Param("user") and @Transactional to the @Modifying query.
    // Without @Param, Spring Data cannot bind the :user parameter reliably.
    // Without @Transactional, calling this outside a transaction throws
    // "No EntityManager with actual transaction available".
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    void deleteByUser(@Param("user") User user);
}
