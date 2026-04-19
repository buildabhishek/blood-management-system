package com.bms.service;

import com.bms.entity.User;
import com.bms.repository.UserRepository;

import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + phone));

        // FIX: Check active flag — deactivated users must not be able to log in
        if (!user.isActive()) {
            throw new UsernameNotFoundException("Account is deactivated for phone: " + phone);
        }

        // Convert role to authority (explicit control)
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // ✅ 3. Build UserDetails object
        return new org.springframework.security.core.userdetails.User(
                user.getPhone(),
                user.getPassword(),
                true, // account non-expired
                true, // credentials non-expired
                true, // account non-locked
                true, // enabled
                authorities);
    }
}
