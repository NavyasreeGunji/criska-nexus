package com.criska.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_event")
public class LoginEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String developerName;
    private String role;

    @Column(name = "login_at")
    private LocalDateTime loginAt;

    public LoginEvent() {}

    public LoginEvent(String developerName, String role, LocalDateTime loginAt) {
        this.developerName = developerName;
        this.role = role;
        this.loginAt = loginAt;
    }

    public Long getId() { return id; }
    public String getDeveloperName() { return developerName; }
    public void setDeveloperName(String developerName) { this.developerName = developerName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getLoginAt() { return loginAt; }
    public void setLoginAt(LocalDateTime loginAt) { this.loginAt = loginAt; }
}
