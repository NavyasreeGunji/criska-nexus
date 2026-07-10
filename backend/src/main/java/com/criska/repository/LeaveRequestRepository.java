package com.criska.repository;

import com.criska.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeNameOrderByAppliedOnDesc(String employeeName);
    List<LeaveRequest> findAllByOrderByAppliedOnDesc();
    List<LeaveRequest> findByStatus(String status);
}
