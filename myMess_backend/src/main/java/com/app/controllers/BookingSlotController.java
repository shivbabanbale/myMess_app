package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.dto.BookingSlotDto;
import com.app.service.BookingSlotService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/slot")
public class BookingSlotController {

    @Autowired
    private BookingSlotService bookingSlotService;

    // Create a new booking slot
    @PostMapping("/book")
    public ResponseEntity<BookingSlotDto> createBookingSlot(@Valid @RequestBody BookingSlotDto bookingSlotDto) {
        BookingSlotDto createdBookingSlot = bookingSlotService.createBookingSlot(bookingSlotDto);
        return new ResponseEntity<>(createdBookingSlot, HttpStatus.CREATED);
    }

    // Get a booking slot by id
    @GetMapping("/{id}")
    public ResponseEntity<BookingSlotDto> getBookingSlotById(@PathVariable String id) {
        BookingSlotDto bookingSlot = bookingSlotService.getBookingSlotById(id);
        return new ResponseEntity<>(bookingSlot, HttpStatus.OK);
    }

    // Get all booking slots by user email
    @GetMapping("/user/{userEmail}")
    public ResponseEntity<List<BookingSlotDto>> getBookingSlotsByUserEmail(@PathVariable String userEmail) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getBookingSlotsByUserEmail(userEmail);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all booking slots by mess email
    @GetMapping("/mess/{messEmail}")
    public ResponseEntity<List<BookingSlotDto>> getBookingSlotsByMessEmail(@PathVariable String messEmail) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getBookingSlotsByMessEmail(messEmail);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all pending booking slots by mess email
    @GetMapping("/pending/mess/{messEmail}")
    public ResponseEntity<List<BookingSlotDto>> getPendingBookingSlotsByMessEmail(@PathVariable String messEmail) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getPendingBookingSlotsByMessEmail(messEmail);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all confirmed booking slots by mess email
    @GetMapping("/confirmed/mess/{messEmail}")
    public ResponseEntity<List<BookingSlotDto>> getConfirmedBookingSlotsByMessEmail(@PathVariable String messEmail) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getConfirmedBookingSlotsByMessEmail(messEmail);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all booking slots by date
    @GetMapping("/date/{date}")
    public ResponseEntity<List<BookingSlotDto>> getBookingSlotsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getBookingSlotsByDate(date);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all booking slots by date and mess email
    @GetMapping("/date/{date}/mess/{messEmail}")
    public ResponseEntity<List<BookingSlotDto>> getBookingSlotsByDateAndMessEmail(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable String messEmail) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getBookingSlotsByDateAndMessEmail(date, messEmail);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Get all booking slots by user email and status
    @GetMapping("/user/{userEmail}/status/{status}")
    public ResponseEntity<List<BookingSlotDto>> getBookingSlotsByUserEmailAndStatus(
            @PathVariable String userEmail,
            @PathVariable String status) {
        List<BookingSlotDto> bookingSlots = bookingSlotService.getBookingSlotsByUserEmailAndStatus(userEmail, status);
        return new ResponseEntity<>(bookingSlots, HttpStatus.OK);
    }

    // Approve a booking slot
    @PutMapping("/approve/{id}")
    public ResponseEntity<BookingSlotDto> approveBookingSlot(@PathVariable String id) {
        BookingSlotDto approvedBookingSlot = bookingSlotService.approveBookingSlot(id);
        return new ResponseEntity<>(approvedBookingSlot, HttpStatus.OK);
    }

    // Confirm a booking slot after payment
    @PutMapping("/confirm/{id}")
    public ResponseEntity<BookingSlotDto> confirmBookingSlot(
            @PathVariable String id,
            @RequestParam String paymentId) {
        BookingSlotDto confirmedBookingSlot = bookingSlotService.confirmBookingSlot(id, paymentId);
        return new ResponseEntity<>(confirmedBookingSlot, HttpStatus.OK);
    }

    // Cancel a booking slot
    @PutMapping("/cancel/{id}")
    public ResponseEntity<BookingSlotDto> cancelBookingSlot(@PathVariable String id) {
        BookingSlotDto cancelledBookingSlot = bookingSlotService.cancelBookingSlot(id);
        return new ResponseEntity<>(cancelledBookingSlot, HttpStatus.OK);
    }

    // Update a booking slot
    @PutMapping("/{id}")
    public ResponseEntity<BookingSlotDto> updateBookingSlot(
            @PathVariable String id,
            @Valid @RequestBody BookingSlotDto bookingSlotDto) {
        BookingSlotDto updatedBookingSlot = bookingSlotService.updateBookingSlot(id, bookingSlotDto);
        return new ResponseEntity<>(updatedBookingSlot, HttpStatus.OK);
    }

    // Delete a booking slot
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBookingSlot(@PathVariable String id) {
        bookingSlotService.deleteBookingSlot(id);
        ApiResponse response = new ApiResponse("Booking slot deleted successfully", true);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // Check availability of a slot
    @GetMapping("/check-availability")
    public ResponseEntity<Boolean> checkSlotAvailability(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String timeSlot,
            @RequestParam String messEmail) {
        boolean isAvailable = bookingSlotService.checkSlotAvailability(date, timeSlot, messEmail);
        return new ResponseEntity<>(isAvailable, HttpStatus.OK);
    }
} 