package com.app.service.impl;

import com.app.dto.BookingSlotDto;
import com.app.model.BookingSlot;
import com.app.repository.BookingSlotRepository;
import com.app.service.BookingSlotService;
import com.app.service.NotificationService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingSlotServiceImpl implements BookingSlotService {

    @Autowired
    private BookingSlotRepository bookingSlotRepository;
    
    @Autowired
    private ModelMapper modelMapper;
    
    @Autowired
    private NotificationService notificationService;

    @Override
    public BookingSlotDto createBookingSlot(BookingSlotDto bookingSlotDto) {
        // Set default values
        bookingSlotDto.setStatus("PENDING");
        bookingSlotDto.setPaid(false);
        bookingSlotDto.setCreatedAt(LocalDateTime.now());
        bookingSlotDto.setUpdatedAt(LocalDateTime.now());
        
        // Convert DTO to entity
        BookingSlot bookingSlot = modelMapper.map(bookingSlotDto, BookingSlot.class);
        
        // Save to database
        BookingSlot savedBookingSlot = bookingSlotRepository.save(bookingSlot);
        
        // Send notification to mess owner
        try {
            notificationService.createNotification(
                savedBookingSlot.getMessEmail(),
                savedBookingSlot.getUserEmail(),
                "New Booking Request",
                "You have received a new booking request for " + savedBookingSlot.getDate() + 
                " at " + savedBookingSlot.getTimeSlot() + " from " + savedBookingSlot.getUserName(),
                "BOOKING_REQUEST",
                savedBookingSlot.getId()
            );
        } catch (Exception e) {
            // Log the error but don't stop the booking process
            System.err.println("Error sending notification: " + e.getMessage());
        }
        
        // Convert saved entity back to DTO and return
        return modelMapper.map(savedBookingSlot, BookingSlotDto.class);
    }

    @Override
    public BookingSlotDto getBookingSlotById(String id) {
        // Get booking slot from database
        BookingSlot bookingSlot = bookingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking slot not found with id: " + id));
        
        // Convert entity to DTO and return
        return modelMapper.map(bookingSlot, BookingSlotDto.class);
    }

    @Override
    public List<BookingSlotDto> getBookingSlotsByUserEmail(String userEmail) {
        // Get booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByUserEmail(userEmail);
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getBookingSlotsByMessEmail(String messEmail) {
        // Get booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByMessEmail(messEmail);
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getPendingBookingSlotsByMessEmail(String messEmail) {
        // Get pending booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByMessEmailAndStatus(messEmail, "PENDING");
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getConfirmedBookingSlotsByMessEmail(String messEmail) {
        // Get confirmed booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByMessEmailAndStatus(messEmail, "CONFIRMED");
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getBookingSlotsByDate(LocalDate date) {
        // Get booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByDate(date);
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getBookingSlotsByDateAndMessEmail(LocalDate date, String messEmail) {
        // Get booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByDateAndMessEmail(date, messEmail);
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<BookingSlotDto> getBookingSlotsByUserEmailAndStatus(String userEmail, String status) {
        // Get booking slots from database
        List<BookingSlot> bookingSlots = bookingSlotRepository.findByUserEmailAndStatus(userEmail, status);
        
        // Convert entities to DTOs and return
        return bookingSlots.stream()
                .map(bookingSlot -> modelMapper.map(bookingSlot, BookingSlotDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public BookingSlotDto approveBookingSlot(String id) {
        // Get booking slot from database
        BookingSlot bookingSlot = bookingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking slot not found with id: " + id));
        
        // Update status
        bookingSlot.setStatus("APPROVED");
        bookingSlot.setApprovedAt(LocalDateTime.now());
        bookingSlot.setUpdatedAt(LocalDateTime.now());
        
        // Save to database
        BookingSlot savedBookingSlot = bookingSlotRepository.save(bookingSlot);
        
        // Send notification to user
        try {
            notificationService.createNotification(
                savedBookingSlot.getUserEmail(),
                savedBookingSlot.getMessEmail(),
                "Booking Request Approved",
                "Your booking request for " + savedBookingSlot.getDate() + 
                " at " + savedBookingSlot.getTimeSlot() + " has been approved. Please proceed with payment to confirm.",
                "BOOKING_APPROVED",
                savedBookingSlot.getId()
            );
        } catch (Exception e) {
            // Log the error but don't stop the approval process
            System.err.println("Error sending notification: " + e.getMessage());
        }
        
        // Convert saved entity back to DTO and return
        return modelMapper.map(savedBookingSlot, BookingSlotDto.class);
    }

    @Override
    public BookingSlotDto confirmBookingSlot(String id, String paymentId) {
        // Get booking slot from database
        BookingSlot bookingSlot = bookingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking slot not found with id: " + id));
        
        // Update status
        bookingSlot.setStatus("CONFIRMED");
        bookingSlot.setPaymentId(paymentId);
        bookingSlot.setPaid(true);
        bookingSlot.setConfirmedAt(LocalDateTime.now());
        bookingSlot.setUpdatedAt(LocalDateTime.now());
        
        // Save to database
        BookingSlot savedBookingSlot = bookingSlotRepository.save(bookingSlot);
        
        // Send notification to user
        try {
            notificationService.createNotification(
                savedBookingSlot.getUserEmail(),
                savedBookingSlot.getMessEmail(),
                "Booking Confirmed",
                "Your booking for " + savedBookingSlot.getDate() + 
                " at " + savedBookingSlot.getTimeSlot() + " has been confirmed.",
                "BOOKING_CONFIRMED",
                savedBookingSlot.getId()
            );
            
            // Also notify mess owner
            notificationService.createNotification(
                savedBookingSlot.getMessEmail(),
                savedBookingSlot.getUserEmail(),
                "Booking Confirmed",
                "A booking for " + savedBookingSlot.getDate() + 
                " at " + savedBookingSlot.getTimeSlot() + " has been confirmed by " + savedBookingSlot.getUserName(),
                "BOOKING_CONFIRMED",
                savedBookingSlot.getId()
            );
        } catch (Exception e) {
            // Log the error but don't stop the confirmation process
            System.err.println("Error sending notification: " + e.getMessage());
        }
        
        // Convert saved entity back to DTO and return
        return modelMapper.map(savedBookingSlot, BookingSlotDto.class);
    }

    @Override
    public BookingSlotDto cancelBookingSlot(String id) {
        // Get booking slot from database
        BookingSlot bookingSlot = bookingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking slot not found with id: " + id));
        
        // Update status
        bookingSlot.setStatus("CANCELLED");
        bookingSlot.setCancelledAt(LocalDateTime.now());
        bookingSlot.setUpdatedAt(LocalDateTime.now());
        
        // Save to database
        BookingSlot savedBookingSlot = bookingSlotRepository.save(bookingSlot);
        
        // Send notification to appropriate party
        try {
            // Notify the other party about cancellation
            if (bookingSlot.getStatus().equals("PENDING") || bookingSlot.getStatus().equals("APPROVED")) {
                // If user cancels, notify mess owner
                notificationService.createNotification(
                    savedBookingSlot.getMessEmail(),
                    savedBookingSlot.getUserEmail(),
                    "Booking Cancelled",
                    "A booking for " + savedBookingSlot.getDate() + 
                    " at " + savedBookingSlot.getTimeSlot() + " has been cancelled by " + savedBookingSlot.getUserName(),
                    "BOOKING_CANCELLED",
                    savedBookingSlot.getId()
                );
            } else {
                // If mess owner cancels, notify user
                notificationService.createNotification(
                    savedBookingSlot.getUserEmail(),
                    savedBookingSlot.getMessEmail(),
                    "Booking Cancelled",
                    "Your booking for " + savedBookingSlot.getDate() + 
                    " at " + savedBookingSlot.getTimeSlot() + " has been cancelled by the mess owner.",
                    "BOOKING_CANCELLED",
                    savedBookingSlot.getId()
                );
            }
        } catch (Exception e) {
            // Log the error but don't stop the cancellation process
            System.err.println("Error sending notification: " + e.getMessage());
        }
        
        // Convert saved entity back to DTO and return
        return modelMapper.map(savedBookingSlot, BookingSlotDto.class);
    }

    @Override
    public BookingSlotDto updateBookingSlot(String id, BookingSlotDto bookingSlotDto) {
        // Get booking slot from database
        BookingSlot bookingSlot = bookingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking slot not found with id: " + id));
        
        // Update fields (preserving certain fields)
        if (bookingSlotDto.getDate() != null) {
            bookingSlot.setDate(bookingSlotDto.getDate());
        }
        
        if (bookingSlotDto.getTimeSlot() != null) {
            bookingSlot.setTimeSlot(bookingSlotDto.getTimeSlot());
        }
        
        if (bookingSlotDto.getAmount() != null) {
            bookingSlot.setAmount(bookingSlotDto.getAmount());
        }
        
        // Always update the updated timestamp
        bookingSlot.setUpdatedAt(LocalDateTime.now());
        
        // Save to database
        BookingSlot savedBookingSlot = bookingSlotRepository.save(bookingSlot);
        
        // Convert saved entity back to DTO and return
        return modelMapper.map(savedBookingSlot, BookingSlotDto.class);
    }

    @Override
    public void deleteBookingSlot(String id) {
        // Check if booking slot exists
        if (!bookingSlotRepository.existsById(id)) {
            throw new RuntimeException("Booking slot not found with id: " + id);
        }
        
        // Delete from database
        bookingSlotRepository.deleteById(id);
    }

    @Override
    public boolean checkSlotAvailability(LocalDate date, String timeSlot, String messEmail) {
        // Get booking slots for the specified date, time slot, and mess
        List<BookingSlot> existingBookings = bookingSlotRepository.findByDateAndTimeSlotAndMessEmail(date, timeSlot, messEmail);
        
        // Check if there are any confirmed bookings (assuming there's a limit on concurrent bookings)
        long confirmedBookings = existingBookings.stream()
                .filter(booking -> booking.getStatus().equals("CONFIRMED") || booking.getStatus().equals("APPROVED"))
                .count();
        
        // Assume a maximum of 5 concurrent bookings per slot (this should be configurable)
        final int MAX_CONCURRENT_BOOKINGS = 5;
        
        // Return true if slots are available, false otherwise
        return confirmedBookings < MAX_CONCURRENT_BOOKINGS;
    }
} 