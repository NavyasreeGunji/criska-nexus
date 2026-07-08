package com.criska.repository;

import com.criska.entity.Developer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DeveloperRepository extends JpaRepository<Developer, Long> {
    Optional<Developer> findByUsername(String username);
    List<Developer> findByLastLoginAtBetween(LocalDateTime start, LocalDateTime end);
}
