package com.app.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "bookings")
public class Booking {
    @Id
    private String id;
    private String userId;
    private String messId;
    private String slotType; // "afternoon" or "night"
    private LocalDate bookingDate;  // Booking date
    private String paymentId; // Razorpay Payment ID
    private boolean isPaymentVerified;
    private String status;
    // Getters and setters
}

