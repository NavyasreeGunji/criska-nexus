package com.criska.repository;

import com.criska.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByTeamId(Long teamId);
    List<Story> findBySprintId(Long sprintId);
    List<Story> findByAssignee(String assignee);
    boolean existsByStoryNumber(String storyNumber);
    boolean existsByStoryNumberAndIdNot(String storyNumber, Long id);

    // Returns stories created on the given date.
    // Falls back to createdAt (Instant) for older stories that have no issue_created_date.
    @Query("SELECT s FROM Story s WHERE " +
           "(s.createdDate IS NOT NULL AND s.createdDate = :localDate) " +
           "OR (s.createdDate IS NULL AND s.createdAt IS NOT NULL AND s.createdAt >= :start AND s.createdAt < :end)")
    List<Story> findCreatedOnDate(@Param("localDate") LocalDate localDate,
                                  @Param("start") Instant start,
                                  @Param("end") Instant end);
}
