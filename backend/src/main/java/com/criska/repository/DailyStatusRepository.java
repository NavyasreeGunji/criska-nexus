package com.criska.repository;

import com.criska.entity.DailyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface DailyStatusRepository extends JpaRepository<DailyStatus, Long> {
    List<DailyStatus> findByDeveloper(String developer);
    List<DailyStatus> findByDate(LocalDate date);
    List<DailyStatus> findByDeveloperAndDate(String developer, LocalDate date);
    List<DailyStatus> findByCreatedDateBetween(Instant start, Instant end);
}
