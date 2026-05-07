package com.bms.service;

import com.bms.entity.User;
import com.bms.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository repo;
    public CustomUserDetailsService(UserRepository repo) { this.repo = repo; }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        // BUG FIX: was findByPhone() — deactivated users could still be authenticated by the
        // AuthenticationManager (password was verified), then rejected in the controller.
        // This leaks timing information and is a logic gap. Enforce active=true at the
        // UserDetails layer so Spring Security itself rejects deactivated accounts.
        User user = repo.findByPhoneAndActiveTrue(phone)
            .orElseThrow(() -> new UsernameNotFoundException("User not found or account is deactivated: " + phone));
        return new org.springframework.security.core.userdetails.User(
            user.getPhone(), user.getPassword(),
            /* enabled */ true, /* accountNonExpired */ true,
            /* credentialsNonExpired */ true, /* accountNonLocked */ true,
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
    }
}
