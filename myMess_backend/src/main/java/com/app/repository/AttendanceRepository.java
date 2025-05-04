package com.app.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.app.model.Attendance;

@Repository
public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    // Find all attendance records for a specific owner on a given date
    List<Attendance> findByOwnerEmailAndDate(String ownerEmail, LocalDate date);
    
    // Find all attendance records for a specific user
    List<Attendance> findByUserEmail(String userEmail);
    
    // Find all attendance records for a specific owner
    List<Attendance> findByOwnerEmail(String ownerEmail);
    
    // Find attendance record for a specific user on a specific date
    Attendance findByUserEmailAndDate(String userEmail, LocalDate date);
    
    // Find attendance records for users of a specific owner within a date range
    List<Attendance> findByOwnerEmailAndDateBetween(String ownerEmail, LocalDate startDate, LocalDate endDate);
    
    // Find attendance records for a specific user within a date range
    List<Attendance> findByUserEmailAndDateBetween(String userEmail, LocalDate startDate, LocalDate endDate);
    
    // Find by owner email, user email and date
    Attendance findByOwnerEmailAndUserEmailAndDate(String ownerEmail, String userEmail, LocalDate date);
    
    // Find all attendance records where user is present
    List<Attendance> findByUserEmailAndStatusIgnoreCase(String userEmail, String status);
    
    // Find attendance records where user is present within a date range
    List<Attendance> findByUserEmailAndStatusIgnoreCaseAndDateBetween(String userEmail, String status, LocalDate startDate, LocalDate endDate);
}

