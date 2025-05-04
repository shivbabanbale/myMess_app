package com.app.repository;

import com.app.model.Feedback;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FeedbackRepository extends MongoRepository<Feedback, String> {
    List<Feedback> findByMessEmail(String email);

    List<Feedback> findByUserEmail(String email);
}
