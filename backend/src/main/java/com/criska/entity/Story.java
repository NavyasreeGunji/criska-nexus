package com.criska.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "story")
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "story_number", unique = true)
    private String storyNumber;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer points;
    private String status;
    private String reporter;
    private String assignee;

    @Column(name = "created_by")
    private String createdBy;
    private Long teamId;
    private Long sprintId;

    @Column(name = "spilled_from_sprint_id")
    private Long spilledFromSprintId;

    @Column(name = "issue_created_date")
    private LocalDate createdDate;

    private LocalDate dueDate;
    private LocalDate startedDate;
    private LocalDate completedDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStoryNumber() { return storyNumber; }
    public void setStoryNumber(String storyNumber) { this.storyNumber = storyNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReporter() { return reporter; }
    public void setReporter(String reporter) { this.reporter = reporter; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }
    public Long getSpilledFromSprintId() { return spilledFromSprintId; }
    public void setSpilledFromSprintId(Long spilledFromSprintId) { this.spilledFromSprintId = spilledFromSprintId; }
    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getStartedDate() { return startedDate; }
    public void setStartedDate(LocalDate startedDate) { this.startedDate = startedDate; }
    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
}
