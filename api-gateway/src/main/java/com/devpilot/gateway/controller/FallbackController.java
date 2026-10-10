
package com.devpilot.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class FallbackController {

    @GetMapping("/fallback/auth")
    public Mono<ResponseEntity<Map<String, String>>> authFallback() {
        return Mono.just(
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "AUTH_SERVICE_UNAVAILABLE",
                    "message", "Authentication service is temporarily unavailable. Please try again."
                ))
        );
    }

    @GetMapping("/fallback/orchestrator")
    public Mono<ResponseEntity<Map<String, String>>> orchestratorFallback() {
        return Mono.just(
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "ORCHESTRATOR_SERVICE_UNAVAILABLE",
                    "message", "AI orchestrator service is temporarily unavailable. Please try again."
                ))
        );
    }
}
