package com.devpilot.auth.service;

import com.devpilot.auth.dto.AuthResponse;
import com.devpilot.auth.dto.LoginRequest;
import com.devpilot.auth.dto.RegisterRequest;
import com.devpilot.auth.dto.UserProfileResponse;
import com.devpilot.auth.entity.User;
import com.devpilot.auth.exception.ApiException;
import com.devpilot.auth.repository.UserRepository;
import com.devpilot.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("Should successfully register user, hashing password and never storing plaintext")
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest(
                "Alice Engineer",
                "alice@devpilot.ai",
                "securePassword123"
        );

        when(userRepository.existsByEmail("alice@devpilot.ai")).thenReturn(false);
        when(passwordEncoder.encode("securePassword123")).thenReturn("$2a$12$hashedPassword");

        AuthResponse response = authService.register(request);

        assertThat(response.message()).isEqualTo("Registration successful");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getName()).isEqualTo("Alice Engineer");
        assertThat(savedUser.getEmail()).isEqualTo("alice@devpilot.ai");
        assertThat(savedUser.getPassword()).isEqualTo("$2a$12$hashedPassword");
        assertThat(savedUser.getPassword()).isNotEqualTo("securePassword123");
    }

    @Test
    @DisplayName("Should reject duplicate registration pre-check with HTTP 409 Conflict")
    void shouldRejectDuplicateEmailPreCheck() {
        RegisterRequest request = new RegisterRequest(
                "Duplicate User",
                "existing@devpilot.ai",
                "password123"
        );

        when(userRepository.existsByEmail("existing@devpilot.ai")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("already registered");
                });

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should safely handle concurrent duplicate registration database constraint violation with HTTP 409")
    void shouldHandleConcurrentDuplicateRegistration() {
        RegisterRequest request = new RegisterRequest(
                "Concurrent User",
                "concurrent@devpilot.ai",
                "password123"
        );

        when(userRepository.existsByEmail("concurrent@devpilot.ai")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hash");
        when(userRepository.save(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("unique_email violation"));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiEx.getMessage()).contains("already registered");
                });
    }

    @Test
    @DisplayName("Should authenticate valid credentials and return signed JWT")
    void shouldAuthenticateValidLogin() {
        LoginRequest request = new LoginRequest("alice@devpilot.ai", "password123");

        User existingUser = new User();
        existingUser.setEmail("alice@devpilot.ai");
        existingUser.setPassword("$2a$12$hashed");

        when(userRepository.findByEmail("alice@devpilot.ai")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password123", "$2a$12$hashed")).thenReturn(true);
        when(jwtService.generateToken(existingUser)).thenReturn("signed-jwt-token");
        when(jwtService.getExpirationSeconds()).thenReturn(900L);

        AuthResponse response = authService.login(request);

        assertThat(response.message()).isEqualTo("Login successful");
        assertThat(response.token()).isEqualTo("signed-jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);
    }

    @Test
    @DisplayName("Should return HTTP 401 for non-existent email without revealing account existence")
    void shouldReturn401ForNonExistentUser() {
        LoginRequest request = new LoginRequest("nonexistent@devpilot.ai", "password123");

        when(userRepository.findByEmail("nonexistent@devpilot.ai")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.getMessage()).isEqualTo("Invalid email or password");
                });
    }

    @Test
    @DisplayName("Should return HTTP 401 for incorrect password")
    void shouldReturn401ForIncorrectPassword() {
        LoginRequest request = new LoginRequest("alice@devpilot.ai", "wrongPassword");

        User existingUser = new User();
        existingUser.setEmail("alice@devpilot.ai");
        existingUser.setPassword("$2a$12$hashed");

        when(userRepository.findByEmail("alice@devpilot.ai")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrongPassword", "$2a$12$hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    ApiException apiEx = (ApiException) ex;
                    assertThat(apiEx.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(apiEx.getMessage()).isEqualTo("Invalid email or password");
                });
    }

    @Test
    @DisplayName("Should revoke token on logout")
    void shouldRevokeTokenOnLogout() {
        authService.logout("Bearer test-token-123");
        verify(jwtService).revokeToken("test-token-123");
    }

    @Test
    @DisplayName("Should reject logout when Bearer header is missing or malformed")
    void shouldRejectInvalidLogoutHeader() {
        assertThatThrownBy(() -> authService.logout(null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bearer");

        assertThatThrownBy(() -> authService.logout("Basic dXNlcjpwYXNz"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Bearer");

        assertThatThrownBy(() -> authService.logout("Bearer "))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("Should retrieve current user profile from authenticated email")
    void shouldGetCurrentUserProfile() {
        User user = new User();
        user.setName("Alice");
        user.setEmail("alice@devpilot.ai");

        when(userRepository.findByEmail("alice@devpilot.ai")).thenReturn(Optional.of(user));

        UserProfileResponse profile = authService.getCurrentUser("alice@devpilot.ai");

        assertThat(profile.name()).isEqualTo("Alice");
        assertThat(profile.email()).isEqualTo("alice@devpilot.ai");
        assertThat(profile.role()).isEqualTo("USER");
    }
}
