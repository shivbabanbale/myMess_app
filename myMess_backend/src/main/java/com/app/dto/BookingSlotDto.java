package com.app.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSlotDto {
    private String id;
    
    // User details
    private String userEmail;
    private String userName;
    
    // Mess details
    private String messId;
    private String messEmail;
    private String messName;
    
    // Booking details
    private LocalDate date;
    private String timeSlot; // E.g., "7:00 AM - 8:00 AM", "12:00 PM - 1:00 PM", etc.
    
    // Status values: "PENDING", "APPROVED", "CONFIRMED", "CANCELLED", "COMPLETED"
    private String status;
    
    // Payment details
    private boolean isPaid;
    private String paymentId;
    private Double amount;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
} 