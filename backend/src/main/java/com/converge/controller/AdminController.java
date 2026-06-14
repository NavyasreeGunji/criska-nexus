package com.converge.controller;

import com.converge.service.WeeklyReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final WeeklyReminderService reminderService;

    public AdminController(WeeklyReminderService reminderService) {
        this.reminderService = reminderService;
    }

    // Called by cron-job.org every Friday to wake Render and fire reminders
    @PostMapping("/trigger-reminders")
    public ResponseEntity<String> triggerReminders() {
        reminderService.sendWeeklyReminders();
        return ResponseEntity.ok("Reminders sent");
    }
}
