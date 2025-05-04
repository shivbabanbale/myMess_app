package com.app.service;

import com.app.model.Attendance;
import com.app.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AttendanceService {
    @Autowired
    private AttendanceRepository attendanceRepository;

    /**
     * Mark attendance for a user
     * @param attendance The attendance record to save
     * @return The saved attendance record
     */
    public Attendance markAttendance(Attendance attendance) {
        // Check if an attendance record already exists for this user on this date
        Attendance existingAttendance = attendanceRepository.findByOwnerEmailAndUserEmailAndDate(
                attendance.getOwnerEmail(), attendance.getUserEmail(), attendance.getDate());
        
        if (existingAttendance != null) {
            // Update existing record
            existingAttendance.setStatus(attendance.getStatus());
            return attendanceRepository.save(existingAttendance);
        } else {
            // Create new record
            return attendanceRepository.save(attendance);
        }
    }
    
    /**
     * Mark attendance for multiple users
     * @param attendanceRecords List of attendance records to save
     * @return List of saved attendance records
     */
    public List<Attendance> markBulkAttendance(List<Attendance> attendanceRecords) {
        return attendanceRepository.saveAll(attendanceRecords);
    }
    
    /**
     * Get attendance records for a specific owner on a given date
     * @param ownerEmail Owner's email
     * @param date Date to check
     * @return List of attendance records
     */
    public List<Attendance> getAttendanceByOwnerAndDate(String ownerEmail, LocalDate date) {
        return attendanceRepository.findByOwnerEmailAndDate(ownerEmail, date);
    }
    
    /**
     * Get attendance records for a specific user
     * @param userEmail User's email
     * @return List of attendance records
     */
    public List<Attendance> getAttendanceByUser(String userEmail) {
        return attendanceRepository.findByUserEmail(userEmail);
    }
    
    /**
     * Get attendance record for a specific user on a specific date
     * @param userEmail User's email
     * @param date Date to check
     * @return Attendance record
     */
    public Attendance getAttendanceByUserAndDate(String userEmail, LocalDate date) {
        return attendanceRepository.findByUserEmailAndDate(userEmail, date);
    }
    
    /**
     * Get attendance records for users of a specific owner within a date range
     * @param ownerEmail Owner's email
     * @param startDate Start date
     * @param endDate End date
     * @return List of attendance records
     */
    public List<Attendance> getAttendanceByOwnerAndDateRange(String ownerEmail, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByOwnerEmailAndDateBetween(ownerEmail, startDate, endDate);
    }
    
    /**
     * Get attendance records for a specific user within a date range
     * @param userEmail User's email
     * @param startDate Start date
     * @param endDate End date
     * @return List of attendance records
     */
    public List<Attendance> getAttendanceByUserAndDateRange(String userEmail, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByUserEmailAndDateBetween(userEmail, startDate, endDate);
    }
    
    /**
     * Generate attendance report for an owner showing present/absent counts for each user
     * @param ownerEmail Owner's email
     * @param startDate Start date
     * @param endDate End date
     * @return Map of user emails to their attendance statistics
     */
    public Map<String, Map<String, Integer>> generateAttendanceReport(String ownerEmail, LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendanceRecords = getAttendanceByOwnerAndDateRange(ownerEmail, startDate, endDate);
        Map<String, Map<String, Integer>> report = new HashMap<>();
        
        for (Attendance attendance : attendanceRecords) {
            String userEmail = attendance.getUserEmail();
            
            // Initialize user entry if not exists
            if (!report.containsKey(userEmail)) {
                Map<String, Integer> stats = new HashMap<>();
                stats.put("present", 0);
                stats.put("absent", 0);
                stats.put("total", 0);
                report.put(userEmail, stats);
            }
            
            // Update stats
            Map<String, Integer> userStats = report.get(userEmail);
            if ("Present".equalsIgnoreCase(attendance.getStatus())) {
                userStats.put("present", userStats.get("present") + 1);
            } else if ("Absent".equalsIgnoreCase(attendance.getStatus())) {
                userStats.put("absent", userStats.get("absent") + 1);
            }
            userStats.put("total", userStats.get("total") + 1);
        }
        
        return report;
    }
    
    /**
     * Delete an attendance record
     * @param id Attendance record ID
     */
    public void deleteAttendance(String id) {
        attendanceRepository.deleteById(id);
    }
    
    /**
     * Get all dates when a user was marked as present
     * @param userEmail User's email
     * @return List of attendance records where user was present
     */
    public List<Attendance> getUserPresentDates(String userEmail) {
        return attendanceRepository.findByUserEmailAndStatusIgnoreCase(userEmail, "Present");
    }
    
    /**
     * Get all dates when a user was marked as present within a date range
     * @param userEmail User's email
     * @param startDate Start date
     * @param endDate End date
     * @return List of attendance records where user was present in the date range
     */
    public List<Attendance> getUserPresentDatesInRange(String userEmail, LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByUserEmailAndStatusIgnoreCaseAndDateBetween(userEmail, "Present", startDate, endDate);
    }
    
    /**
     * Get just the dates (not full attendance records) when a user was present
     * @param userEmail User's email
     * @return List of dates when the user was present
     */
    public List<LocalDate> getUserPresentDatesOnly(String userEmail) {
        List<Attendance> attendances = getUserPresentDates(userEmail);
        return attendances.stream()
                .map(Attendance::getDate)
                .collect(Collectors.toList());
    }
    
    /**
     * Get just the dates (not full attendance records) when a user was present within a date range
     * @param userEmail User's email
     * @param startDate Start date
     * @param endDate End date
     * @return List of dates when the user was present in the date range
     */
    public List<LocalDate> getUserPresentDatesOnlyInRange(String userEmail, LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendances = getUserPresentDatesInRange(userEmail, startDate, endDate);
        return attendances.stream()
                .map(Attendance::getDate)
                .collect(Collectors.toList());
    }
}

