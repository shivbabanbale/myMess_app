package com.app.service;

import com.app.dto.PaymentDto;
import com.app.model.MessOwner;
import com.app.model.Payment;
import com.app.model.User;
import com.app.repository.MessOwnerRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.UserRepository;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MessOwnerRepository messOwnerRepository;
    
    @Autowired
    private ModelMapper modelMapper;
    
    /**
     * Records a new payment from a user to a mess
     */
    public PaymentDto recordPayment(String userEmail, String ownerEmail, String messId, 
                                 double amountPaid, double remainingDues) {
        // Verify that the user and mess exist
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        Optional<MessOwner> messOpt = messOwnerRepository.findById(messId);
        
        if (userOpt.isEmpty() || messOpt.isEmpty()) {
            throw new RuntimeException("User or Mess not found");
        }
        
        // Calculate total dues (amount paid + remaining)
        double totalDues = amountPaid + remainingDues;
        
        // Create and save the payment
        Payment payment = new Payment(userEmail, ownerEmail, messId, totalDues, amountPaid, remainingDues);
        Payment savedPayment = paymentRepository.save(payment);
        
        // Convert to DTO and return
        return convertToDto(savedPayment);
    }
    
    /**
     * Gets the pending dues for a specific user in a mess
     */
    public double getPendingDuesByUserEmail(String userEmail, String messId) {
        // Find the latest payment for this user in this mess
        Payment latestPayment = paymentRepository.findFirstByUserEmailAndMessIdOrderByPaymentDateDesc(userEmail, messId);
        
        if (latestPayment != null) {
            return latestPayment.getRemainingDues();
        }
        
        // If no payment record exists, calculate the default subscription amount
        Optional<MessOwner> messOpt = messOwnerRepository.findById(messId);
        if (messOpt.isPresent()) {
            MessOwner mess = messOpt.get();
            
            // Safe direct conversion to avoid type mismatch
            Double dues = 0.0;
            Integer pricePerMeal = null;
            Integer subscriptionPlan = null;
            
            try {
                pricePerMeal = mess.getPricePerMeal();
                subscriptionPlan = mess.getSubscriptionPlan();
                
                if (pricePerMeal != null && subscriptionPlan != null) {
                    // If subscription plan is a large number, it might be a fixed amount
                    if (subscriptionPlan > 100) {
                        dues = Double.valueOf(subscriptionPlan);
                    } else {
                        // Otherwise it's likely the number of days
                        dues = Double.valueOf(pricePerMeal) * Double.valueOf(subscriptionPlan);
                    }
                }
            } catch (Exception e) {
                // Log the exception but continue with default dues
                System.err.println("Error calculating dues: " + e.getMessage());
            }
            
            return dues;
        }
        
        // If we can't determine default amount, return 0
        return 0;
    }
    
    /**
     * Gets all payments for a specific user
     */
    public List<PaymentDto> getUserPayments(String userEmail) {
        List<Payment> payments = paymentRepository.findByUserEmail(userEmail);
        return payments.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Gets all payments for a specific mess
     */
    public List<PaymentDto> getMessPayments(String messId) {
        List<Payment> payments = paymentRepository.findByMessId(messId);
        return payments.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Gets payments for a user in a specific mess
     */
    public List<PaymentDto> getUserMessPayments(String userEmail, String messId) {
        List<Payment> payments = paymentRepository.findByUserEmailAndMessId(userEmail, messId);
        return payments.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Gets all pending dues for a mess owner
     */
    public double getTotalPendingDuesForMess(String messId) {
        List<Payment> latestPayments = paymentRepository.findByMessId(messId);
        
        // Group payments by user and get only the latest one for each
        Map<String, Payment> latestPaymentByUser = new HashMap<>();
        
        for (Payment payment : latestPayments) {
            String userEmail = payment.getUserEmail();
            Payment existing = latestPaymentByUser.get(userEmail);
            
            if (existing == null || payment.getPaymentDate().isAfter(existing.getPaymentDate())) {
                latestPaymentByUser.put(userEmail, payment);
            }
        }
        
        // Sum up the remaining dues from the latest payment for each user
        return latestPaymentByUser.values().stream()
            .mapToDouble(Payment::getRemainingDues)
            .sum();
    }
    
    /**
     * Get payments within a date range
     */
    public List<PaymentDto> getPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findByPaymentDateBetween(startDate, endDate);
        return payments.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert a Payment entity to a PaymentDto
     */
    private PaymentDto convertToDto(Payment payment) {
        PaymentDto dto = modelMapper.map(payment, PaymentDto.class);
        
        // Fetch and set additional display data
        Optional<User> userOpt = userRepository.findByEmail(payment.getUserEmail());
        userOpt.ifPresent(user -> dto.setUserName(user.getName()));
        
        Optional<MessOwner> messOpt = messOwnerRepository.findById(payment.getMessId());
        messOpt.ifPresent(mess -> dto.setMessName(mess.getMessName()));
        
        return dto;
    }
} 