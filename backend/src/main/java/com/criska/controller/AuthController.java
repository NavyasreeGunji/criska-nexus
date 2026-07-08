package com.criska.controller;

import com.criska.entity.Developer;
import com.criska.repository.DeveloperRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final DeveloperRepository repository;

    public AuthController(DeveloperRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));
        }

        Developer dev = repository.findByUsername(username.trim().toLowerCase()).orElse(null);
        if (dev == null || !password.equals(dev.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }
        dev.setLastLoginAt(LocalDateTime.now());
        repository.save(dev);
        return ResponseEntity.ok(dev);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String username        = body.get("username");
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");

        if (username == null || currentPassword == null || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 8 characters"));
        }

        Developer dev = repository.findByUsername(username.trim().toLowerCase()).orElse(null);
        if (dev == null || !currentPassword.equals(dev.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Current password is incorrect"));
        }

        dev.setPassword(newPassword);
        repository.save(dev);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
