package com.app.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "payments")
public class Payment {
    
    @Id
    private String id;
    
    private String userEmail;
    private String ownerEmail;
    private String messId;
    
    private double totalDues;      // Total amount that was due
    private double amountPaid;     // Amount paid in this transaction
    private double remainingDues;  // Remaining amount after payment
    
    private LocalDateTime paymentDate;
    private String paymentMethod;  // "CASH", "ONLINE", "UPI", etc.
    private String transactionId;  // External payment gateway transaction ID (if applicable)
    
    private String status;         // "PENDING", "COMPLETED", "FAILED"
    private String notes;          // Any additional notes about the payment
    
    // Payment period details
    private LocalDateTime periodStart;  // Start of the payment period
    private LocalDateTime periodEnd;    // End of the payment period
    
    // Constructor with essential fields
    public Payment(String userEmail, String ownerEmail, String messId, 
                   double totalDues, double amountPaid, double remainingDues) {
        this.userEmail = userEmail;
        this.ownerEmail = ownerEmail;
        this.messId = messId;
        this.totalDues = totalDues;
        this.amountPaid = amountPaid;
        this.remainingDues = remainingDues;
        this.paymentDate = LocalDateTime.now();
        this.status = "COMPLETED";
    }
} 