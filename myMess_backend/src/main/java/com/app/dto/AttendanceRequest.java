package com.app.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequest {
    private String ownerEmail;
    private List<AttendanceRecord> attendance;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceRecord {
        private String userEmail;
        private LocalDate date;
        private String status; // Present or Absent
    }

    // Getters and Setters
}

