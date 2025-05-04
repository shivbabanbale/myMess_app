package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.dto.AttendanceRequest;
import com.app.dto.SelectedMembersAttendanceRequest;
import com.app.model.Attendance;
import com.app.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@RestController
@RequestMapping("/attendance")

public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    /**
     * Mark attendance for multiple users
     */
    @PostMapping("/mark")
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody AttendanceRequest attendanceRequest) {
        try {
        List<Attendance> attendanceRecords = attendanceRequest.getAttendance().stream()
                .map(record -> new Attendance(
                        null, // ID is auto-generated
                            attendanceRequest.getOwnerEmail(),
                            record.getUserEmail(),
                        record.getDate(),
                        record.getStatus()
                ))
                .collect(Collectors.toList());

            attendanceService.markBulkAttendance(attendanceRecords);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance marked successfully", null),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to mark attendance: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    /**
     * Mark attendance for selected members
     * This endpoint allows marking attendance for specific members on a given date
     */
    @PostMapping("/mark-selected")
    public ResponseEntity<?> markAttendanceForSelectedMembers(@RequestBody SelectedMembersAttendanceRequest request) {
        try {
            List<Attendance> attendanceRecords = new ArrayList<>();
            
            // Create an attendance record for each user email
            for (String userEmail : request.getUserEmails()) {
                Attendance attendance = new Attendance();
                attendance.setOwnerEmail(request.getOwnerEmail());
                attendance.setUserEmail(userEmail);
                attendance.setDate(request.getDate());
                attendance.setStatus(request.getStatus());
                
                // Save each attendance record individually
                attendanceService.markAttendance(attendance);
                attendanceRecords.add(attendance);
            }
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                String.format("Attendance marked for %d members", attendanceRecords.size()),
                attendanceRecords
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse(false, "Failed to mark attendance: " + e.getMessage(), null)
            );
        }
    }

    /**
     * Mark attendance for a single user
     */
    @PostMapping("/mark-single")
    public ResponseEntity<ApiResponse> markSingleAttendance(@RequestBody Attendance attendance) {
        try {
            Attendance savedAttendance = attendanceService.markAttendance(attendance);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance marked successfully", savedAttendance),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to mark attendance: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get attendance records for a specific owner on a given date
     */
    @GetMapping("/by-owner")
    public ResponseEntity<ApiResponse> getAttendanceByOwner(
            @RequestParam String ownerEmail,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            List<Attendance> attendance = attendanceService.getAttendanceByOwnerAndDate(ownerEmail, date);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance fetched successfully", attendance),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to fetch attendance: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get attendance records for a specific user
     */
    @GetMapping("/by-user")
    public ResponseEntity<ApiResponse> getAttendanceByUser(
            @RequestParam String userEmail) {
        
        try {
            List<Attendance> attendance = attendanceService.getAttendanceByUser(userEmail);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance fetched successfully", attendance),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to fetch attendance: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get attendance records for a specific owner within a date range
     */
    @GetMapping("/by-owner/range")
    public ResponseEntity<ApiResponse> getAttendanceByOwnerAndDateRange(
            @RequestParam String ownerEmail,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            List<Attendance> attendance = attendanceService.getAttendanceByOwnerAndDateRange(ownerEmail, startDate, endDate);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance fetched successfully", attendance),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to fetch attendance: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Generate attendance report for an owner
     */
    @GetMapping("/report")
    public ResponseEntity<ApiResponse> generateAttendanceReport(
            @RequestParam String ownerEmail,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        try {
            Map<String, Map<String, Integer>> report = attendanceService.generateAttendanceReport(ownerEmail, startDate, endDate);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance report generated successfully", report),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to generate attendance report: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Delete an attendance record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteAttendance(@PathVariable String id) {
        try {
            attendanceService.deleteAttendance(id);
            return new ResponseEntity<>(
                    new ApiResponse(true, "Attendance record deleted successfully", null),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    new ApiResponse(false, "Failed to delete attendance record: " + e.getMessage(), null),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    /**
     * DTO for marking attendance for selected members
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelectedMembersAttendanceRequest {
        private String ownerEmail;
        private List<String> userEmails;
        private LocalDate date;
        private String status; // Present or Absent
    }

    /**
     * Get all dates when a user was marked as present
     */
    @GetMapping("/present-dates")
    public ResponseEntity<?> getUserPresentDates(@RequestParam String userEmail) {
        try {
            List<Attendance> presentDates = attendanceService.getUserPresentDates(userEmail);
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Present dates fetched successfully",
                presentDates
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse(false, "Failed to fetch present dates: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get all dates when a user was marked as present (just the dates, not full attendance records)
     */
    @GetMapping("/present-dates-only")
    public ResponseEntity<?> getUserPresentDatesOnly(@RequestParam String userEmail) {
        try {
            List<LocalDate> presentDates = attendanceService.getUserPresentDatesOnly(userEmail);
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Present dates fetched successfully",
                presentDates
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse(false, "Failed to fetch present dates: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get all dates when a user was marked as present within a date range
     */
    @GetMapping("/present-dates/range")
    public ResponseEntity<?> getUserPresentDatesInRange(
            @RequestParam String userEmail,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<Attendance> presentDates = attendanceService.getUserPresentDatesInRange(userEmail, startDate, endDate);
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Present dates fetched successfully",
                presentDates
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse(false, "Failed to fetch present dates: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get a summary of user's attendance for a specific month
     */
    @GetMapping("/monthly-summary")
    public ResponseEntity<?> getMonthlyAttendanceSummary(
            @RequestParam String userEmail,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            // Calculate start and end date of the month
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.plusMonths(1).minusDays(1);
            
            // Get present dates within the month
            List<LocalDate> presentDates = attendanceService.getUserPresentDatesOnlyInRange(userEmail, startDate, endDate);
            
            // Calculate attendance stats
            int totalDays = endDate.getDayOfMonth();
            int presentDaysCount = presentDates.size();
            double attendancePercentage = (double) presentDaysCount / totalDays * 100;
            
            // Create summary object
            Map<String, Object> summary = Map.of(
                "userEmail", userEmail,
                "year", year,
                "month", month,
                "totalDays", totalDays,
                "presentDays", presentDaysCount,
                "presentDates", presentDates,
                "attendancePercentage", Math.round(attendancePercentage * 100.0) / 100.0
            );
            
            return ResponseEntity.ok(new ApiResponse(
                true,
                "Monthly attendance summary fetched successfully",
                summary
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse(false, "Failed to fetch monthly summary: " + e.getMessage(), null)
            );
        }
    }
}

