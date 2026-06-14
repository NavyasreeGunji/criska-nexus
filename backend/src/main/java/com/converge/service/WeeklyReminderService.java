package com.converge.service;

import com.converge.entity.DailyStatus;
import com.converge.entity.Developer;
import com.converge.repository.DailyStatusRepository;
import com.converge.repository.DeveloperRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WeeklyReminderService {

    private final DeveloperRepository developerRepo;
    private final DailyStatusRepository dailyStatusRepo;
    private final JavaMailSender mailSender;

    public WeeklyReminderService(DeveloperRepository developerRepo,
                                  DailyStatusRepository dailyStatusRepo,
                                  JavaMailSender mailSender) {
        this.developerRepo = developerRepo;
        this.dailyStatusRepo = dailyStatusRepo;
        this.mailSender = mailSender;
    }

    // Runs every Friday at 5:00 PM IST (11:30 AM UTC)
    // Also callable via POST /api/admin/trigger-reminders (for external cron services)
    @Scheduled(cron = "0 30 11 * * FRI", zone = "UTC")
    public void sendWeeklyReminders() {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate friday = today.with(DayOfWeek.FRIDAY);

        // Collect all log dates for this week in one query
        List<DailyStatus> weekLogs = dailyStatusRepo.findByDateBetween(monday, friday);
        // Map: developer name → set of logged dates
        java.util.Map<String, Set<LocalDate>> loggedByDev = weekLogs.stream()
            .collect(Collectors.groupingBy(
                DailyStatus::getDeveloper,
                Collectors.mapping(DailyStatus::getDate, Collectors.toSet())
            ));

        // Build Mon–Fri date list (skip weekends just in case)
        List<LocalDate> workdays = new ArrayList<>();
        for (LocalDate d = monday; !d.isAfter(today); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY) {
                workdays.add(d);
            }
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEE, MMM d");

        for (Developer dev : developerRepo.findAll()) {
            if (dev.getEmail() == null || dev.getEmail().isBlank()) continue;

            Set<LocalDate> logged = loggedByDev.getOrDefault(dev.getName(), Set.of());
            List<LocalDate> missing = workdays.stream()
                .filter(d -> !logged.contains(d))
                .collect(Collectors.toList());

            if (missing.isEmpty()) continue;

            String missingDates = missing.stream()
                .map(fmt::format)
                .collect(Collectors.joining(", "));

            sendReminder(dev.getName(), dev.getEmail(), missingDates);
        }
    }

    private void sendReminder(String name, String email, String missingDates) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("⚠️ Daily Log Reminder – Missing Entries This Week");
            msg.setText(
                "Hi " + name + ",\n\n" +
                "You have not filled your daily log for the following day(s) this week:\n\n" +
                "  " + missingDates + "\n\n" +
                "Please log your work by end of day today (Friday).\n\n" +
                "Log it here: https://devtrack-converge.vercel.app/daily-log\n\n" +
                "Thanks,\nDevTrack – Engineering Portal"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send reminder to " + email + ": " + e.getMessage());
        }
    }
}
