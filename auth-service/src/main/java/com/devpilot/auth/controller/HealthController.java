package com.devpilot.auth.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "Auth Service is running!";
    }
}