package com.app.repository;

import com.app.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByMessIdAndBookingDate(String messId, LocalDate date);
    boolean existsByUserIdAndSlotTypeAndBookingDate(String userId, String slotType, LocalDate date);
}

