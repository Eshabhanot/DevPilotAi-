package com.devpilot.auth.repository;

import com.devpilot.auth.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {

    boolean existsByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    @Query("DELETE FROM RevokedToken r WHERE r.expiresAt < :now")
    int deleteByExpiresAtBefore(Instant now);
}
