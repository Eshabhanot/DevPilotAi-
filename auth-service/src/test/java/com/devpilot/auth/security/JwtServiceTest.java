package com.devpilot.auth.security;

import com.devpilot.auth.entity.User;
import com.devpilot.auth.exception.ApiException;
import com.devpilot.auth.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String SECRET = "c3VwZXItc2VjcmV0LWtleS1mb3ItbXktbWljcm9zZXJ2aWNlcy1hcHAtMjAyNg==";
    private static final long EXPIRATION_MS = 60000; // 1 minute

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS, revokedTokenRepository);
    }

    @Test
    @DisplayName("Should generate valid signed JWT containing email, role, and userId claims")
    void shouldGenerateValidToken() {
        User user = new User();
        user.setName("Developer");
        user.setEmail("dev@devpilot.ai");
        user.setPassword("hashed");

        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        Claims claims = jwtService.validateAndExtractClaims(token);

        assertThat(claims.getSubject()).isEqualTo("dev@devpilot.ai");
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
        assertThat(claims.getExpiration()).isAfter(new Date());
    }

    @Test
    @DisplayName("Should reject token with tampered signature")
    void shouldRejectTamperedToken() {
        User user = new User();
        user.setName("Developer");
        user.setEmail("dev@devpilot.ai");

        String token = jwtService.generateToken(user);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(tamperedToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Should reject token signed with different secret key")
    void shouldRejectTokenSignedWithDifferentSecret() {
        SecretKey otherKey = Keys.hmacShaKeyFor(
                "different-secret-key-that-does-not-match-at-all-123456789".getBytes(StandardCharsets.UTF_8)
        );

        String invalidToken = Jwts.builder()
                .subject("dev@devpilot.ai")
                .claim("userId", 1L)
                .claim("role", "USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(otherKey)
                .compact();

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(invalidToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        SecretKey signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Date past = new Date(System.currentTimeMillis() - 5000);

        String expiredToken = Jwts.builder()
                .subject("dev@devpilot.ai")
                .claim("userId", 1L)
                .claim("role", "USER")
                .issuedAt(new Date(System.currentTimeMillis() - 60000))
                .expiration(past)
                .signWith(signingKey)
                .compact();

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(expiredToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Should reject token missing required claims")
    void shouldRejectTokenMissingRequiredClaims() {
        SecretKey signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

        // Missing role claim
        String missingRoleToken = Jwts.builder()
                .subject("dev@devpilot.ai")
                .claim("userId", 1L)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(signingKey)
                .compact();

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(missingRoleToken))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("role");

        // Missing subject claim
        String missingSubjectToken = Jwts.builder()
                .claim("userId", 1L)
                .claim("role", "USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(signingKey)
                .compact();

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(missingSubjectToken))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("subject");
    }

    @Test
    @DisplayName("Should reject revoked token with 401 ApiException")
    void shouldRejectRevokedToken() {
        User user = new User();
        user.setName("Developer");
        user.setEmail("dev@devpilot.ai");

        String token = jwtService.generateToken(user);

        when(revokedTokenRepository.existsByTokenHash(anyString())).thenReturn(true);

        assertThatThrownBy(() -> jwtService.validateAndExtractClaims(token))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    @DisplayName("Should revoke token and store its SHA-256 hash in denylist")
    void shouldRevokeTokenAndSaveHash() {
        User user = new User();
        user.setName("Developer");
        user.setEmail("dev@devpilot.ai");

        String token = jwtService.generateToken(user);

        when(revokedTokenRepository.existsByTokenHash(anyString())).thenReturn(false);

        jwtService.revokeToken(token);

        verify(revokedTokenRepository).save(any());
    }

    @Test
    @DisplayName("Should clean up expired tokens from denylist repository")
    void shouldCleanupExpiredRevokedTokens() {
        when(revokedTokenRepository.deleteByExpiresAtBefore(any(Instant.class))).thenReturn(5);

        int deleted = jwtService.cleanupExpiredRevokedTokens();

        assertThat(deleted).isEqualTo(5);
        verify(revokedTokenRepository).deleteByExpiresAtBefore(any(Instant.class));
    }
}
