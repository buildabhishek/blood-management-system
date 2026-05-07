package com.bms.security;

import com.bms.entity.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private final Key key;
    private final long accessExpiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration:900000}") long accessExpiration) {
        if (secret.length() < 32)
            throw new IllegalStateException("JWT secret too short — must be at least 32 characters.");
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessExpiration = accessExpiration;
    }

    public String generateAccessToken(UserDetails ud, Role role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role.name());
        claims.put("type", "access");
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(ud.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) { return claims(token).getSubject(); }

    public boolean validateToken(String token, UserDetails ud) {
        try {
            return extractUsername(token).equals(ud.getUsername()) && !isExpired(token);
        } catch (JwtException e) { return false; }
    }

    private Claims claims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }

    private boolean isExpired(String token) {
        return claims(token).getExpiration().before(new Date());
    }
}
