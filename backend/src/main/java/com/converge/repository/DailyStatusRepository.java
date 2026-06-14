package com.converge.repository;

import com.converge.entity.DailyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DailyStatusRepository extends JpaRepository<DailyStatus, Long> {
    List<DailyStatus> findByDeveloper(String developer);
    List<DailyStatus> findByDate(LocalDate date);
    List<DailyStatus> findByDeveloperAndDate(String developer, LocalDate date);
    List<DailyStatus> findByDeveloperAndDateBetween(String developer, LocalDate from, LocalDate to);
    List<DailyStatus> findByDateBetween(LocalDate from, LocalDate to);
}
