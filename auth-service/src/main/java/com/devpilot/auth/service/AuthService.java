package com.devpilot.auth.service;

import com.devpilot.auth.dto.AuthResponse;
import com.devpilot.auth.dto.LoginRequest;
import com.devpilot.auth.dto.RegisterRequest;
import com.devpilot.auth.dto.UserProfileResponse;
import com.devpilot.auth.entity.User;
import com.devpilot.auth.exception.ApiException;
import com.devpilot.auth.repository.UserRepository;
import com.devpilot.auth.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        // Fast pre-check for existing email
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent duplicate registration caught by database unique constraint
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        return new AuthResponse(
                "Registration successful", null, null, 0
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        // Return 401 for non-existent user or bad password without revealing account existence
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                "Login successful",
                token,
                "Bearer",
                jwtService.getExpirationSeconds()
        );
    }

    @Transactional
    public void logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Authorization header must be a Bearer token"
            );
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Bearer token cannot be empty"
            );
        }

        jwtService.revokeToken(token);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    private String normalizeEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
