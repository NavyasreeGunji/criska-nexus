package com.criska.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "developer")
public class Developer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String role;
    private String teamIds;
    private String projectTypes; // comma-separated: "Client" | "Internal"
    private String username;
    private String password;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getTeamIds() { return teamIds; }
    public void setTeamIds(String teamIds) { this.teamIds = teamIds; }
    public String getProjectTypes() { return projectTypes; }
    public void setProjectTypes(String projectTypes) { this.projectTypes = projectTypes; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
