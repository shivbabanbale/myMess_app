package com.app.service;

import com.app.dto.BookingSlotDto;
import java.time.LocalDate;
import java.util.List;

public interface BookingSlotService {
    
    // Create a new booking slot
    BookingSlotDto createBookingSlot(BookingSlotDto bookingSlotDto);
    
    // Get a booking slot by id
    BookingSlotDto getBookingSlotById(String id);
    
    // Get all booking slots by user email
    List<BookingSlotDto> getBookingSlotsByUserEmail(String userEmail);
    
    // Get all booking slots by mess email
    List<BookingSlotDto> getBookingSlotsByMessEmail(String messEmail);
    
    // Get all pending booking slots by mess email
    List<BookingSlotDto> getPendingBookingSlotsByMessEmail(String messEmail);
    
    // Get all confirmed booking slots by mess email
    List<BookingSlotDto> getConfirmedBookingSlotsByMessEmail(String messEmail);
    
    // Get all booking slots by date
    List<BookingSlotDto> getBookingSlotsByDate(LocalDate date);
    
    // Get all booking slots by date and mess email
    List<BookingSlotDto> getBookingSlotsByDateAndMessEmail(LocalDate date, String messEmail);
    
    // Get all booking slots by user email and status
    List<BookingSlotDto> getBookingSlotsByUserEmailAndStatus(String userEmail, String status);
    
    // Approve a booking slot
    BookingSlotDto approveBookingSlot(String id);
    
    // Confirm a booking slot after payment
    BookingSlotDto confirmBookingSlot(String id, String paymentId);
    
    // Cancel a booking slot
    BookingSlotDto cancelBookingSlot(String id);
    
    // Update a booking slot
    BookingSlotDto updateBookingSlot(String id, BookingSlotDto bookingSlotDto);
    
    // Delete a booking slot
    void deleteBookingSlot(String id);
    
    // Check availability of a slot
    boolean checkSlotAvailability(LocalDate date, String timeSlot, String messEmail);
} 