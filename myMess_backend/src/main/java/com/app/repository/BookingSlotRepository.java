package com.app.repository;

import com.app.model.BookingSlot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingSlotRepository extends MongoRepository<BookingSlot, String> {
    
    // Find all booking slots by user email
    List<BookingSlot> findByUserEmail(String userEmail);
    
    // Find all booking slots by mess email
    List<BookingSlot> findByMessEmail(String messEmail);
    
    // Find all booking slots by date
    List<BookingSlot> findByDate(LocalDate date);
    
    // Find all booking slots by status
    List<BookingSlot> findByStatus(String status);
    
    // Find all booking slots by user email and status
    List<BookingSlot> findByUserEmailAndStatus(String userEmail, String status);
    
    // Find all booking slots by mess email and status
    List<BookingSlot> findByMessEmailAndStatus(String messEmail, String status);
    
    // Find all booking slots by user email, mess email and status
    List<BookingSlot> findByUserEmailAndMessEmailAndStatus(String userEmail, String messEmail, String status);
    
    // Find all booking slots by date and status
    List<BookingSlot> findByDateAndStatus(LocalDate date, String status);
    
    // Find all booking slots by date and mess email
    List<BookingSlot> findByDateAndMessEmail(LocalDate date, String messEmail);
    
    // Find all booking slots by date, mess email and status
    List<BookingSlot> findByDateAndMessEmailAndStatus(LocalDate date, String messEmail, String status);
    
    // Find all booking slots by date, time slot and mess email
    List<BookingSlot> findByDateAndTimeSlotAndMessEmail(LocalDate date, String timeSlot, String messEmail);
} 