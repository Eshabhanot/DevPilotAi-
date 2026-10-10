package com.devpilot.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Persisted token denylist entity for server-side stateless JWT revocation.
 * Stores the SHA-256 cryptographic hash of the JWT rather than the raw token
 * to protect sensitive authentication data at rest.
 */
@Entity
@Table(
    name = "revoked_tokens",
    indexes = {
        @Index(name = "idx_revoked_token_hash", columnList = "tokenHash", unique = true),
        @Index(name = "idx_revoked_token_expires_at", columnList = "expiresAt")
    }
)
public class RevokedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false, length = 255)
    private String userEmail;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false, updatable = false)
    private Instant revokedAt = Instant.now();

    public RevokedToken() {
    }

    public RevokedToken(String tokenHash, String userEmail, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.userEmail = userEmail;
        this.expiresAt = expiresAt;
        this.revokedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }
}
