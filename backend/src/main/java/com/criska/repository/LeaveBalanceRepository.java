package com.criska.repository;

import com.criska.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    Optional<LeaveBalance> findByEmployeeNameAndYear(String employeeName, Integer year);
    List<LeaveBalance> findByYear(Integer year);
}
