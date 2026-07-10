package com.criska.controller;

import com.criska.entity.LeaveBalance;
import com.criska.entity.LeaveRequest;
import com.criska.repository.LeaveBalanceRepository;
import com.criska.repository.LeaveRequestRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    // Default annual leave policy
    private static final double CASUAL_TOTAL  = 8.0;
    private static final double SICK_TOTAL    = 8.0;
    private static final double ANNUAL_TOTAL  = 12.0;
    private static final double MAX_CARRY_FWD = 5.0;

    private final LeaveRequestRepository requestRepo;
    private final LeaveBalanceRepository balanceRepo;

    public LeaveController(LeaveRequestRepository requestRepo, LeaveBalanceRepository balanceRepo) {
        this.requestRepo = requestRepo;
        this.balanceRepo = balanceRepo;
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    @GetMapping
    public List<LeaveRequest> all() {
        return requestRepo.findAllByOrderByAppliedOnDesc();
    }

    @GetMapping("/my/{name}")
    public List<LeaveRequest> myLeaves(@PathVariable("name") String name) {
        return requestRepo.findByEmployeeNameOrderByAppliedOnDesc(name);
    }

    @GetMapping("/balance/{name}/{year}")
    public LeaveBalance balance(@PathVariable("name") String name, @PathVariable("year") Integer year) {
        return getOrCreateBalance(name, year);
    }

    @GetMapping("/balances/{year}")
    public List<LeaveBalance> allBalances(@PathVariable("year") Integer year) {
        return balanceRepo.findByYear(year);
    }

    // ── Apply ─────────────────────────────────────────────────────────────────

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody LeaveRequest req) {
        if (req.getFromDate() == null || req.getToDate() == null || req.getFromDate().isAfter(req.getToDate())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid date range"));
        }
        double workingDays = countWorkingDays(req.getFromDate(), req.getToDate());
        req.setDays(workingDays);
        req.setStatus("pending");
        req.setAppliedOn(LocalDate.now());
        return ResponseEntity.ok(requestRepo.save(req));
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        LeaveRequest req = requestRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.notFound().build();
        if (!"pending".equals(req.getStatus())) return ResponseEntity.badRequest().body(Map.of("error", "Not pending"));

        int year = req.getFromDate().getYear();
        LeaveBalance bal = getOrCreateBalance(req.getEmployeeName(), year);
        double days = req.getDays() != null ? req.getDays() : 0;

        // Deduct from appropriate bucket; overflow → LOP
        String type = req.getLeaveType();
        if ("casual".equals(type)) {
            double remaining = bal.getCasualTotal() - bal.getCasualUsed();
            if (days <= remaining) {
                bal.setCasualUsed(bal.getCasualUsed() + days);
            } else {
                bal.setCasualUsed(bal.getCasualTotal());
                bal.setLopDays(bal.getLopDays() + (days - remaining));
                req.setLeaveType("lop");
            }
        } else if ("sick".equals(type)) {
            double remaining = bal.getSickTotal() - bal.getSickUsed();
            if (days <= remaining) {
                bal.setSickUsed(bal.getSickUsed() + days);
            } else {
                bal.setSickUsed(bal.getSickTotal());
                bal.setLopDays(bal.getLopDays() + (days - remaining));
                req.setLeaveType("lop");
            }
        } else if ("annual".equals(type)) {
            double totalAnnual = bal.getAnnualTotal() + (bal.getCarryForward() != null ? bal.getCarryForward() : 0);
            double remaining = totalAnnual - bal.getAnnualUsed();
            if (days <= remaining) {
                bal.setAnnualUsed(bal.getAnnualUsed() + days);
            } else {
                bal.setAnnualUsed(totalAnnual);
                bal.setLopDays(bal.getLopDays() + (days - remaining));
                req.setLeaveType("lop");
            }
        } else {
            // lop directly
            bal.setLopDays(bal.getLopDays() + days);
        }

        balanceRepo.save(bal);
        req.setStatus("approved");
        req.setApprovedBy(body.getOrDefault("approvedBy", ""));
        req.setApproverComments(body.getOrDefault("comments", ""));
        return ResponseEntity.ok(requestRepo.save(req));
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        LeaveRequest req = requestRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.notFound().build();
        req.setStatus("rejected");
        req.setApprovedBy(body.getOrDefault("approvedBy", ""));
        req.setApproverComments(body.getOrDefault("comments", ""));
        return ResponseEntity.ok(requestRepo.save(req));
    }

    // ── Cancel (by employee) ──────────────────────────────────────────────────

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable("id") Long id) {
        LeaveRequest req = requestRepo.findById(id).orElse(null);
        if (req == null) return ResponseEntity.notFound().build();

        // If it was approved, restore balance
        if ("approved".equals(req.getStatus())) {
            int year = req.getFromDate().getYear();
            LeaveBalance bal = getOrCreateBalance(req.getEmployeeName(), year);
            double days = req.getDays() != null ? req.getDays() : 0;
            String type = req.getLeaveType();
            if ("casual".equals(type)) bal.setCasualUsed(Math.max(0, bal.getCasualUsed() - days));
            else if ("sick".equals(type)) bal.setSickUsed(Math.max(0, bal.getSickUsed() - days));
            else if ("annual".equals(type)) bal.setAnnualUsed(Math.max(0, bal.getAnnualUsed() - days));
            else bal.setLopDays(Math.max(0, bal.getLopDays() - days));
            balanceRepo.save(bal);
        }

        req.setStatus("cancelled");
        return ResponseEntity.ok(requestRepo.save(req));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private LeaveBalance getOrCreateBalance(String name, int year) {
        return balanceRepo.findByEmployeeNameAndYear(name, year).orElseGet(() -> {
            // Compute carry-forward: unused annual leave from previous year (max MAX_CARRY_FWD)
            double carryFwd = 0;
            LeaveBalance prev = balanceRepo.findByEmployeeNameAndYear(name, year - 1).orElse(null);
            if (prev != null) {
                double totalPrev = prev.getAnnualTotal() + (prev.getCarryForward() != null ? prev.getCarryForward() : 0);
                double unused = totalPrev - prev.getAnnualUsed();
                carryFwd = Math.min(Math.max(unused, 0), MAX_CARRY_FWD);
            }
            LeaveBalance b = new LeaveBalance();
            b.setEmployeeName(name);
            b.setYear(year);
            b.setCasualTotal(CASUAL_TOTAL);
            b.setSickTotal(SICK_TOTAL);
            b.setAnnualTotal(ANNUAL_TOTAL);
            b.setCarryForward(carryFwd);
            b.setCasualUsed(0.0);
            b.setSickUsed(0.0);
            b.setAnnualUsed(0.0);
            b.setLopDays(0.0);
            return balanceRepo.save(b);
        });
    }

    private double countWorkingDays(LocalDate from, LocalDate to) {
        double count = 0;
        LocalDate d = from;
        while (!d.isAfter(to)) {
            DayOfWeek dow = d.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) count++;
            d = d.plusDays(1);
        }
        return count;
    }
}
