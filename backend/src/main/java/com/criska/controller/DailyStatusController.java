package com.criska.controller;

import com.criska.entity.DailyStatus;
import com.criska.repository.DailyStatusRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/status")
public class DailyStatusController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final DailyStatusRepository repository;

    public DailyStatusController(DailyStatusRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DailyStatus> list() {
        return repository.findAll();
    }

    @GetMapping("/developer/{developer}")
    public List<DailyStatus> byDeveloper(@PathVariable("developer") String developer) {
        return repository.findByDeveloper(developer);
    }

    @GetMapping("/date/{date}")
    public List<DailyStatus> byDate(@PathVariable("date") String date) {
        return repository.findByDate(LocalDate.parse(date));
    }

    // Returns entries submitted (created) on the given date, regardless of work date.
    // Falls back to work date for older entries that have no createdDate stored.
    @GetMapping("/submitted/{date}")
    public List<DailyStatus> submittedOn(@PathVariable("date") String date) {
        LocalDate workDate = LocalDate.parse(date);
        Instant start = workDate.atStartOfDay(IST).toInstant();
        Instant end   = workDate.plusDays(1).atStartOfDay(IST).toInstant();
        return repository.findSubmittedOnDate(start, end, workDate);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DailyStatus> get(@PathVariable("id") Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public DailyStatus create(@RequestBody DailyStatus dailyStatus) {
        if (dailyStatus.getCreatedDate() == null) {
            dailyStatus.setCreatedDate(Instant.now());
        }
        return repository.save(dailyStatus);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DailyStatus> update(@PathVariable("id") Long id, @RequestBody DailyStatus dailyStatus) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        dailyStatus.setId(id);
        return ResponseEntity.ok(repository.save(dailyStatus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
