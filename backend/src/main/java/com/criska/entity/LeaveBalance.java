package com.criska.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_balance")
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String employeeName;
    private Integer year;

    // Allocations (editable per policy)
    private Double casualTotal;
    private Double sickTotal;
    private Double annualTotal;
    private Double carryForward; // PL carried from previous year

    // Used (sum of approved leaves of each type)
    private Double casualUsed;
    private Double sickUsed;
    private Double annualUsed;
    private Double lopDays;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String n) { this.employeeName = n; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Double getCasualTotal() { return casualTotal; }
    public void setCasualTotal(Double v) { this.casualTotal = v; }
    public Double getSickTotal() { return sickTotal; }
    public void setSickTotal(Double v) { this.sickTotal = v; }
    public Double getAnnualTotal() { return annualTotal; }
    public void setAnnualTotal(Double v) { this.annualTotal = v; }
    public Double getCarryForward() { return carryForward; }
    public void setCarryForward(Double v) { this.carryForward = v; }
    public Double getCasualUsed() { return casualUsed; }
    public void setCasualUsed(Double v) { this.casualUsed = v; }
    public Double getSickUsed() { return sickUsed; }
    public void setSickUsed(Double v) { this.sickUsed = v; }
    public Double getAnnualUsed() { return annualUsed; }
    public void setAnnualUsed(Double v) { this.annualUsed = v; }
    public Double getLopDays() { return lopDays; }
    public void setLopDays(Double v) { this.lopDays = v; }
}
