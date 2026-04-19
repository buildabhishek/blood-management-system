package com.bms.service;

import com.bms.dto.RegisterRequest;
import com.bms.entity.Role;
import com.bms.entity.User;
import com.bms.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest req) {
        if (userRepository.findByPhone(req.getPhone()).isPresent())
            throw new RuntimeException("Phone number already registered");
        if (req.getRole() == Role.ADMIN)
            throw new RuntimeException("Admin registration is not allowed");

        User user = new User();
        user.setName(req.getName());
        user.setPhone(req.getPhone());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());
        user.setEntityName(req.getEntityName());
        user.setAddress(req.getAddress());
        user.setLatitude(req.getLatitude());
        user.setLongitude(req.getLongitude());
        user.setActive(true);
        return userRepository.save(user);
    }

    public User findByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void updateFcmToken(String phone, String fcmToken) {
        userRepository.findByPhone(phone).ifPresent(u -> {
            u.setFcmToken(fcmToken);
            userRepository.save(u);
        });
    }

    @Transactional
    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.ADMIN)
            throw new RuntimeException("Cannot deactivate admin accounts");
        user.setActive(false);
        userRepository.save(user);
    }
}
