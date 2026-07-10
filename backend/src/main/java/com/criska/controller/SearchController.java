package com.criska.controller;

import com.criska.repository.BugRepository;
import com.criska.repository.DeveloperRepository;
import com.criska.repository.StoryRepository;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final StoryRepository storyRepository;
    private final BugRepository bugRepository;
    private final DeveloperRepository developerRepository;

    public SearchController(StoryRepository s, BugRepository b, DeveloperRepository d) {
        this.storyRepository = s;
        this.bugRepository = b;
        this.developerRepository = d;
    }

    @GetMapping
    public Map<String, Object> search(@RequestParam("q") String q) {
        if (q == null || q.isBlank() || q.length() < 2) {
            return Map.of("stories", List.of(), "bugs", List.of(), "developers", List.of());
        }
        String lower = q.toLowerCase();

        List<Map<String, Object>> stories = storyRepository.findAll().stream()
            .filter(s -> matches(s.getTitle(), lower) || matches(s.getStoryNumber(), lower))
            .limit(6)
            .map(s -> Map.<String, Object>of(
                "id", String.valueOf(s.getId()),
                "title", s.getTitle() != null ? s.getTitle() : "",
                "subtitle", (s.getStoryNumber() != null ? s.getStoryNumber() : "") + " · " + (s.getStatus() != null ? s.getStatus() : ""),
                "type", "story"
            ))
            .collect(Collectors.toList());

        List<Map<String, Object>> bugs = bugRepository.findAll().stream()
            .filter(b -> matches(b.getTitle(), lower))
            .limit(6)
            .map(b -> Map.<String, Object>of(
                "id", String.valueOf(b.getId()),
                "title", b.getTitle() != null ? b.getTitle() : "",
                "subtitle", (b.getSeverity() != null ? b.getSeverity() : "") + " · " + (b.getStatus() != null ? b.getStatus() : ""),
                "type", "bug"
            ))
            .collect(Collectors.toList());

        List<Map<String, Object>> developers = developerRepository.findAll().stream()
            .filter(d -> matches(d.getName(), lower))
            .limit(6)
            .map(d -> Map.<String, Object>of(
                "id", String.valueOf(d.getId()),
                "title", d.getName() != null ? d.getName() : "",
                "subtitle", d.getRole() != null ? d.getRole() : "",
                "type", "developer"
            ))
            .collect(Collectors.toList());

        return Map.of("stories", stories, "bugs", bugs, "developers", developers);
    }

    private boolean matches(String text, String query) {
        return text != null && text.toLowerCase().contains(query);
    }
}
