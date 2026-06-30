package com.converge.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_status")
public class DailyStatus extends BaseAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    private String jiraId;

    @Column(columnDefinition = "TEXT")
    private String taskName;

    @Column(columnDefinition = "TEXT")
    private String workDescription;
    private String status;
    private String blockerDescription;
    private Double hoursSpent;
    private String priority;
    private String developer;
    private String logType;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getJiraId() { return jiraId; }
    public void setJiraId(String jiraId) { this.jiraId = jiraId; }
    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }
    public String getWorkDescription() { return workDescription; }
    public void setWorkDescription(String workDescription) { this.workDescription = workDescription; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBlockerDescription() { return blockerDescription; }
    public void setBlockerDescription(String blockerDescription) { this.blockerDescription = blockerDescription; }
    public Double getHoursSpent() { return hoursSpent; }
    public void setHoursSpent(Double hoursSpent) { this.hoursSpent = hoursSpent; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getDeveloper() { return developer; }
    public void setDeveloper(String developer) { this.developer = developer; }
    public String getLogType() { return logType; }
    public void setLogType(String logType) { this.logType = logType; }
}
