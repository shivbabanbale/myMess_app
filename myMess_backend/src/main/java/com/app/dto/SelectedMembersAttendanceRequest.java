package com.app.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for marking attendance for selected members
 * This DTO is used when a mess owner wants to mark attendance for multiple selected members at once
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SelectedMembersAttendanceRequest {
    private String ownerEmail;     // Email of the mess owner
    private List<String> userEmails; // List of user emails to mark attendance for
    private LocalDate date;        // Date of attendance
    private String status;         // Attendance status (Present or Absent)
} 