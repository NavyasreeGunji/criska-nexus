package com.criska.controller;

import com.criska.entity.LoginEvent;
import com.criska.repository.LoginEventRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/login-events")
public class LoginEventController {

    private final LoginEventRepository repository;

    public LoginEventController(LoginEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<LoginEvent> getByDate(@RequestParam("date") String date) {
        LocalDateTime start = LocalDate.parse(date).atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return repository.findByLoginAtBetweenOrderByLoginAtAsc(start, end);
    }
}
