package com.criska.controller;

import com.criska.entity.Story;
import com.criska.repository.StoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final StoryRepository repository;

    public StoryController(StoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Story> list() {
        return repository.findAll();
    }

    @GetMapping("/team/{teamId}")
    public List<Story> byTeam(@PathVariable("teamId") Long teamId) {
        return repository.findByTeamId(teamId);
    }

    @GetMapping("/sprint/{sprintId}")
    public List<Story> bySprint(@PathVariable("sprintId") Long sprintId) {
        return repository.findBySprintId(sprintId);
    }

    @GetMapping("/assignee/{assignee}")
    public List<Story> byAssignee(@PathVariable("assignee") String assignee) {
        return repository.findByAssignee(assignee);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Story> get(@PathVariable("id") Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/created-on/{date}")
    public List<Story> createdOn(@PathVariable("date") String date) {
        LocalDate localDate = LocalDate.parse(date);
        Instant start = localDate.atStartOfDay(IST).toInstant();
        Instant end   = localDate.plusDays(1).atStartOfDay(IST).toInstant();
        return repository.findCreatedOnDate(localDate, start, end);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Story story) {
        if (story.getStoryNumber() != null && !story.getStoryNumber().isBlank()
                && repository.existsByStoryNumber(story.getStoryNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Story number '" + story.getStoryNumber() + "' already exists."));
        }
        if (story.getCreatedAt() == null) {
            story.setCreatedAt(Instant.now());
        }
        return ResponseEntity.ok(repository.save(story));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, @RequestBody Story story) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        if (story.getStoryNumber() != null && !story.getStoryNumber().isBlank()
                && repository.existsByStoryNumberAndIdNot(story.getStoryNumber(), id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Story number '" + story.getStoryNumber() + "' already exists."));
        }
        story.setId(id);
        return ResponseEntity.ok(repository.save(story));
    }
}
