package com.criska.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "deployment")
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String environment; // production | staging
    private String status;      // planned | in_progress | success | failed | rolled_back
    private String deployedBy;
    @JsonProperty("date")
    private LocalDate deployDate;
    @JsonProperty("time")
    private String deployTime;

    private String crNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;
    private Double hours;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDeployedBy() { return deployedBy; }
    public void setDeployedBy(String deployedBy) { this.deployedBy = deployedBy; }
    @JsonProperty("date")
    public LocalDate getDeployDate() { return deployDate; }
    @JsonProperty("date")
    public void setDeployDate(LocalDate deployDate) { this.deployDate = deployDate; }
    @JsonProperty("time")
    public String getDeployTime() { return deployTime; }
    @JsonProperty("time")
    public void setDeployTime(String deployTime) { this.deployTime = deployTime; }
    public String getCrNumber() { return crNumber; }
    public void setCrNumber(String crNumber) { this.crNumber = crNumber; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Double getHours() { return hours; }
    public void setHours(Double hours) { this.hours = hours; }
}
