package com.criska.repository;

import com.criska.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {
    List<LoginEvent> findByLoginAtBetweenOrderByLoginAtAsc(LocalDateTime start, LocalDateTime end);
}
