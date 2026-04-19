package com.bms.repository;

import com.bms.entity.Role;
import com.bms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByPhoneAndActiveTrue(String phone);
    List<User> findByRole(Role role);
    List<User> findByRoleAndActiveTrue(Role role);
    Page<User> findAll(Pageable pageable);
}
