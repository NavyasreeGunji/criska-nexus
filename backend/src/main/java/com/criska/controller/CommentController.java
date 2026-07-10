package com.criska.controller;

import com.criska.entity.Comment;
import com.criska.repository.CommentRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Comment> list(
        @RequestParam("entityType") String entityType,
        @RequestParam("entityId") Long entityId
    ) {
        return repository.findByEntityTypeAndEntityIdOrderByCreatedAtAsc(entityType, entityId);
    }

    @PostMapping
    public Comment create(@RequestBody Comment comment) {
        comment.setCreatedAt(LocalDateTime.now());
        return repository.save(comment);
    }
}
