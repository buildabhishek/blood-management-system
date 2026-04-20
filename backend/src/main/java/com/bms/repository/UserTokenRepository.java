package com.bms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bms.entity.UserToken;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
}
