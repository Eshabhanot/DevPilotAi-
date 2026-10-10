package com.devpilot.auth.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/protected")
public class ProtectedTestController {

    @GetMapping("/test")
    public Map<String, String> test(Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "Anonymous";
        return Map.of(
                "message", "Authenticated successfully! Request reached Auth Service.",
                "user", user
        );
    }
}
