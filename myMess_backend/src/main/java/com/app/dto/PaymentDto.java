package com.app.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private String id;
    
    private String userEmail;
    private String ownerEmail;
    private String messId;
    
    private double totalDues;
    private double amountPaid;
    private double remainingDues;
    
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String transactionId;
    
    private String status;
    private String notes;
    
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    
    // Additional fields for frontend display
    private String userName;
    private String messName;
} 