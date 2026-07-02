package com.criska.entity;

import jakarta.persistence.*;

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
    @Column(name = "project_types")
    private String projectIds; // comma-separated project IDs (e.g. P-001,P-002)
    private String username;
    private String password;

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
    public String getProjectIds() { return projectIds; }
    public void setProjectIds(String projectIds) { this.projectIds = projectIds; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
