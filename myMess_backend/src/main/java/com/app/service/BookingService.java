package com.app.service;

import com.app.model.Booking;
import com.app.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    public Booking saveBooking(String userId, String messId, String slotType, String paymentId) {
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setMessId(messId);
        booking.setSlotType(slotType);
        booking.setBookingDate(LocalDate.now());
        booking.setPaymentId(paymentId);
        booking.setStatus("CONFIRMED");
        return bookingRepository.save(booking);
    }

    public boolean isSlotOpen(String slotType){
        if (slotType.equalsIgnoreCase("afternoon") && LocalTime.now().isAfter(LocalTime.of(12, 0))) {
           return false;
        }
        if (slotType.equalsIgnoreCase("night") && LocalTime.now().isAfter(LocalTime.of(19, 0))) {
            return false;
        }

        return true;
    }
}


