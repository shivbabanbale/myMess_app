package com.app.controllers;

import com.app.dto.PaymentDto;
import com.app.service.PaymentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * Records a new payment
     */
    @PostMapping("/payment/record")
    public ResponseEntity<?> recordPayment(
            @RequestParam String userEmail,
            @RequestParam String ownerEmail,
            @RequestParam String messId,
            @RequestParam double amountPaid,
            @RequestParam double remainingDues) {
        try {
            PaymentDto payment = paymentService.recordPayment(userEmail, ownerEmail, messId, amountPaid, remainingDues);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error recording payment: " + e.getMessage());
        }
    }

    /**
     * Get the pending dues for a specific user in a mess
     */
    @GetMapping("/payment/pending/user/{userEmail}/mess/{messId}")
    public ResponseEntity<?> getPendingDuesByUserEmail(
            @PathVariable String userEmail,
            @PathVariable String messId) {
        try {
            double pendingDues = paymentService.getPendingDuesByUserEmail(userEmail, messId);
            Map<String, Object> response = new HashMap<>();
            response.put("userEmail", userEmail);
            response.put("messId", messId);
            response.put("pendingDues", pendingDues);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching pending dues: " + e.getMessage());
        }
    }

    /**
     * Get all payments for a user
     */
    @GetMapping("/payment/user/{userEmail}")
    public ResponseEntity<?> getUserPayments(@PathVariable String userEmail) {
        try {
            List<PaymentDto> payments = paymentService.getUserPayments(userEmail);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching payments: " + e.getMessage());
        }
    }

    /**
     * Get all payments for a mess
     */
    @GetMapping("/payment/mess/{messId}")
    public ResponseEntity<?> getMessPayments(@PathVariable String messId) {
        try {
            List<PaymentDto> payments = paymentService.getMessPayments(messId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching payments: " + e.getMessage());
        }
    }

    /**
     * Get all payments for a user in a specific mess
     */
    @GetMapping("/payment/user/{userEmail}/mess/{messId}")
    public ResponseEntity<?> getUserMessPayments(
            @PathVariable String userEmail,
            @PathVariable String messId) {
        try {
            List<PaymentDto> payments = paymentService.getUserMessPayments(userEmail, messId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching payments: " + e.getMessage());
        }
    }

    /**
     * Get total pending dues for a mess
     */
    @GetMapping("/payment/total-pending/mess/{messId}")
    public ResponseEntity<?> getTotalPendingDuesForMess(@PathVariable String messId) {
        try {
            double totalPendingDues = paymentService.getTotalPendingDuesForMess(messId);
            Map<String, Object> response = new HashMap<>();
            response.put("messId", messId);
            response.put("totalPendingDues", totalPendingDues);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching total pending dues: " + e.getMessage());
        }
    }

    /**
     * Get payments within a date range
     */
    @GetMapping("/payment/date-range")
    public ResponseEntity<?> getPaymentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            List<PaymentDto> payments = paymentService.getPaymentsByDateRange(startDate, endDate);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching payments by date range: " + e.getMessage());
        }
    }
} 