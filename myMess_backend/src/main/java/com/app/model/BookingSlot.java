package com.app.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "booking_slots")
public class BookingSlot {
    @Id
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
    private String status = "PENDING";
    
    // Payment details
    private boolean isPaid = false;
    private String paymentId;
    private Double amount;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
} 