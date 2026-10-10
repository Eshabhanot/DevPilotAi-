package com.devpilot.auth.security;

import com.devpilot.auth.entity.RevokedToken;
import com.devpilot.auth.entity.User;
import com.devpilot.auth.exception.ApiException;
import com.devpilot.auth.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;
    private final RevokedTokenRepository revokedTokenRepository;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms:900000}") long expirationMs,
            RevokedTokenRepository revokedTokenRepository) {

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
        this.revokedTokenRepository = revokedTokenRepository;
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Parse, verify signature, and validate token expiration and structure.
     * Throws JwtException or IllegalArgumentException if invalid.
     */
    public Claims validateAndExtractClaims(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token is missing or blank");
        }

        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token.trim())
                .getPayload();

        validateRequiredClaims(claims);

        if (isTokenRevoked(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token has been revoked");
        }

        return claims;
    }

    /**
     * Validates required claims: subject, role, userId, and non-expired.
     */
    public void validateRequiredClaims(Claims claims) {
        if (claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new JwtException("Token missing required subject claim");
        }

        if (claims.get("role") == null) {
            throw new JwtException("Token missing required role claim");
        }

        if (claims.get("userId") == null) {
            throw new JwtException("Token missing required userId claim");
        }

        Date expiration = claims.getExpiration();
        if (expiration == null || expiration.before(new Date())) {
            throw new JwtException("Token is expired");
        }
    }

    /**
     * Compute SHA-256 hash of the token for secure storage without saving raw JWTs.
     */
    public String hashToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token cannot be blank");
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(token.trim().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Checks if the token's cryptographic hash is in the revocation denylist.
     */
    public boolean isTokenRevoked(String token) {
        String hash = hashToken(token);
        return revokedTokenRepository.existsByTokenHash(hash);
    }

    /**
     * Revokes a valid token by storing its SHA-256 hash in the database denylist until its expiration.
     */
    @Transactional
    public void revokeToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token.trim())
                .getPayload();

        String hash = hashToken(token);
        if (!revokedTokenRepository.existsByTokenHash(hash)) {
            Instant expiresAt = claims.getExpiration().toInstant();
            String userEmail = claims.getSubject();
            revokedTokenRepository.save(new RevokedToken(hash, userEmail, expiresAt));
        }
    }

    /**
     * Periodic cleanup of expired tokens from the revocation denylist.
     * Tokens past their expiration timestamp are already cryptographically rejected,
     * so they can be safely removed to keep the table compact.
     */
    @Scheduled(cron = "${app.jwt.cleanup-cron:0 0 * * * *}")
    @Transactional
    public int cleanupExpiredRevokedTokens() {
        return revokedTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }
}
