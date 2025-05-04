package com.app.repository;

import com.app.model.LeaveApplication;
import com.app.model.LeaveStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveApplicationRepository extends MongoRepository<LeaveApplication, String> {
    
    // Find leaves by user ID
    List<LeaveApplication> findByUserId(String userId);
    
    // Find leaves by user email
    List<LeaveApplication> findByUserEmail(String userEmail);
    
    // Find leaves by mess ID
    List<LeaveApplication> findByMessId(String messId);
    
    // Find leaves by owner email
    List<LeaveApplication> findByOwnerEmail(String ownerEmail);
    
    // Find leaves by user ID and mess ID
    List<LeaveApplication> findByUserIdAndMessId(String userId, String messId);
    
    // Find leaves by user email and owner email
    List<LeaveApplication> findByUserEmailAndOwnerEmail(String userEmail, String ownerEmail);
    
    // Find leaves by mess ID and status
    List<LeaveApplication> findByMessIdAndStatus(String messId, LeaveStatus status);
    
    // Find leaves by owner email and status
    List<LeaveApplication> findByOwnerEmailAndStatus(String ownerEmail, LeaveStatus status);
    
    // Find leaves for a specific date range
    List<LeaveApplication> findByStartDateGreaterThanEqualAndEndDateLessThanEqual(LocalDate startDate, LocalDate endDate);
    
    // Find leaves that overlap with a specific date range
    List<LeaveApplication> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate endDate, LocalDate startDate);
} 