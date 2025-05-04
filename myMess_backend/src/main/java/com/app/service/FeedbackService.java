package com.app.service;

import com.app.dto.ApiResponse;
import com.app.exceptions.ResourceNotFoundException;
import com.app.model.Feedback;
import com.app.model.MessOwner;
import com.app.repository.FeedbackRepository;
import com.app.repository.MessOwnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Service
public class FeedbackService {

    @Autowired
    private MessOwnerRepository messOwnerRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;


    /*
        ############### Add User Feedback ###############
     */
    public ApiResponse addFeedback(Feedback feedback){

        MessOwner messOwner = messOwnerRepository.findByEmail(feedback.getMessEmail()).orElseThrow(
                () -> new ResourceNotFoundException("Mess Not exist")
        );

        List<String> joinedUsers = messOwner.getJoinedUsers();
        String userEmail = feedback.getUserEmail();

        if(!joinedUsers.contains(userEmail)){
            ApiResponse build = ApiResponse.builder()
                    .message("The user is not in this Mess")
                    .success(false)
                    .build();

//            throw new ResourceNotFoundException("The User is not found in this mess");
            return build;
        }

        feedbackRepository.save(feedback);

        double currentRating = messOwner.getAverageRating() != null ? messOwner.getAverageRating() : 0.0;
        int currentFeedbackCount = messOwner.getFeedbackCount() != null ? messOwner.getFeedbackCount() : 0;

        // Update the mess's average rating
        double totalRating = currentRating * currentFeedbackCount;
        totalRating += feedback.getRating();
        messOwner.setFeedbackCount(currentFeedbackCount + 1);
        messOwner.setAverageRating(totalRating / messOwner.getFeedbackCount());
        messOwnerRepository.save(messOwner);

        ApiResponse build = ApiResponse.builder()
                .message("The Feedback send Successfully")
                .success(true)
                .build();

        return build;
    }


    /*
        ################### Fetch Feedback for Mess ###############
     */
    public List<Feedback> getFeedbackForMess(String messEmail){
        return feedbackRepository.findByMessEmail(messEmail);
    }
}
