package com.criska.controller;

import com.criska.entity.Sprint;
import com.criska.entity.Story;
import com.criska.repository.SprintRepository;
import com.criska.repository.StoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    private final SprintRepository repository;
    private final StoryRepository storyRepository;

    public SprintController(SprintRepository repository, StoryRepository storyRepository) {
        this.repository = repository;
        this.storyRepository = storyRepository;
    }

    @GetMapping
    public List<Sprint> list() {
        return repository.findAll();
    }

    @GetMapping("/team/{teamId}")
    public List<Sprint> byTeam(@PathVariable("teamId") Long teamId) {
        return repository.findByTeamId(teamId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sprint> get(@PathVariable("id") Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Sprint create(@RequestBody Sprint sprint) {
        return repository.save(sprint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sprint> update(@PathVariable("id") Long id, @RequestBody Sprint sprint) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();

        Sprint existing = repository.findById(id).orElse(null);

        // When a sprint transitions to completed, move incomplete stories to the next sprint
        if (existing != null
                && !"completed".equals(existing.getStatus())
                && "completed".equals(sprint.getStatus())) {

            List<Story> incomplete = storyRepository.findBySprintId(id).stream()
                    .filter(s -> !"done".equals(s.getStatus()) && !"for_qe_testing".equals(s.getStatus()))
                    .collect(Collectors.toList());

            if (!incomplete.isEmpty()) {
                Sprint nextSprint = repository.findByTeamId(existing.getTeamId()).stream()
                        .filter(s -> !s.getId().equals(id) && !"completed".equals(s.getStatus()))
                        .filter(s -> s.getStartDate() != null && existing.getEndDate() != null
                                && !s.getStartDate().isBefore(existing.getEndDate()))
                        .min(Comparator.comparing(Sprint::getStartDate))
                        .orElse(null);

                if (nextSprint != null) {
                    for (Story story : incomplete) {
                        story.setSprintId(nextSprint.getId());
                        storyRepository.save(story);
                    }
                }
            }
        }

        sprint.setId(id);
        return ResponseEntity.ok(repository.save(sprint));
    }
}
