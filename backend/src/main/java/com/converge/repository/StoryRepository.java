package com.converge.repository;

import com.converge.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByTeamId(Long teamId);
    List<Story> findBySprintId(Long sprintId);
    List<Story> findByAssignee(String assignee);
    boolean existsByStoryNumber(String storyNumber);
    boolean existsByStoryNumberAndIdNot(String storyNumber, Long id);
}
