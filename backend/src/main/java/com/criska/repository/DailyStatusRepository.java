package com.criska.repository;

import com.criska.entity.DailyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface DailyStatusRepository extends JpaRepository<DailyStatus, Long> {
    List<DailyStatus> findByDeveloper(String developer);
    List<DailyStatus> findByDate(LocalDate date);
    List<DailyStatus> findByDeveloperAndDate(String developer, LocalDate date);
    List<DailyStatus> findByCreatedDateBetween(Instant start, Instant end);

    // Returns entries submitted on the given day (by createdDate), falling back to
    // work date for older entries that have no createdDate stored.
    @Query("SELECT d FROM DailyStatus d WHERE " +
           "(d.createdDate IS NOT NULL AND d.createdDate >= :start AND d.createdDate < :end) " +
           "OR (d.createdDate IS NULL AND d.date = :workDate)")
    List<DailyStatus> findSubmittedOnDate(@Param("start") Instant start,
                                          @Param("end") Instant end,
                                          @Param("workDate") LocalDate workDate);
}
