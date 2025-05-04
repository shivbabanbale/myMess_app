package com.app.controllers;

import com.app.model.Booking;
import com.app.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/book")
    public ResponseEntity<String> bookSlot(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String messId = request.get("messId");
        String slotType = request.get("slotType");
        String paymentId = request.get("paymentId");

//        // Step 1: Verify Payment
//        boolean isPaymentValid = bookingService.verifyPayment(paymentId);
//        if (!isPaymentValid) {
//            return ResponseEntity.badRequest().body("Payment verification failed.");
//        }
//
//        // Step 2: Check if the slot is open
//        if (!bookingService.isSlotOpen(slotType)) {
//            return ResponseEntity.badRequest().body("Slot booking is closed for this time.");
//        }
//
//        // Step 3: Check if user already booked this slot
//        if (bookingService.isSlotAlreadyBooked(userId, slotType)) {
//            return ResponseEntity.badRequest().body("You have already booked a slot for this time.");
//        }

        // Step 4: Save Booking
        Booking booking = bookingService.saveBooking(userId, messId, slotType, paymentId);
        return ResponseEntity.ok("Slot booked successfully! Booking ID: " + booking.getId());
    }
}

