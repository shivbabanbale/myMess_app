package com.app.repository;

import com.app.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    
    // Find by user email
    List<Payment> findByUserEmail(String userEmail);
    
    // Find by mess ID
    List<Payment> findByMessId(String messId);
    
    // Find by owner email
    List<Payment> findByOwnerEmail(String ownerEmail);
    
    // Find by user email and mess ID
    List<Payment> findByUserEmailAndMessId(String userEmail, String messId);
    
    // Find by payment status
    List<Payment> findByStatus(String status);
    
    // Find by payment date range
    List<Payment> findByPaymentDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by combination of user email and payment date range
    List<Payment> findByUserEmailAndPaymentDateBetween(String userEmail, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by combination of mess ID and payment date range
    List<Payment> findByMessIdAndPaymentDateBetween(String messId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by combination of owner email and payment date range
    List<Payment> findByOwnerEmailAndPaymentDateBetween(String ownerEmail, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find latest payment for a user in a mess
    Payment findFirstByUserEmailAndMessIdOrderByPaymentDateDesc(String userEmail, String messId);
} 