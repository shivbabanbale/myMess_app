package com.app.dto;

import com.app.model.LeaveStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveApplicationDto {

    private String id;
    
    private String userId;
    
    @NotBlank(message = "User email is required")
    @Email(message = "Invalid email format")
    private String userEmail;
    
    private String messId;
    
    @NotBlank(message = "Owner email is required")
    @Email(message = "Invalid email format")
    private String ownerEmail;
    
    private String messName;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotBlank(message = "Reason is required")
    private String reason;
    
    private LeaveStatus status;
    
    private LocalDate applicationDate;
    private LocalDate approvedDate;
    private LocalDate rejectedDate;
    private String rejectionReason;
    
    private boolean approved = false;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 