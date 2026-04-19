package com.bms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import com.bms.service.CustomUserDetailsService;

import io.jsonwebtoken.JwtException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // ✅ 1. Skip authentication for public endpoints
        if (path.startsWith("/api/auth") || path.startsWith("/error")) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        // ✅ 2. No token → continue (Spring will handle unauthorized later)
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            String username = jwtUtil.extractUsername(token);

            // ✅ 3. Authenticate only if not already authenticated
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 🔐 ALWAYS load from DB (never trust token roles)
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // ✅ 4. Validate token properly
                if (jwtUtil.validateToken(token, userDetails)) {

                    // 🔥 FIXED: Use authorities from UserDetails (NOT token)
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    // Attach request details (IP, session)
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // ✅ Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

        } catch (JwtException e) {
            // ❌ Invalid token → send 401 immediately
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
            return;

        } catch (Exception e) {
            // ❌ Any unexpected error
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Authentication processing failed\"}");
            return;
        }

        // ✅ Continue filter chain
        chain.doFilter(request, response);
    }
}
