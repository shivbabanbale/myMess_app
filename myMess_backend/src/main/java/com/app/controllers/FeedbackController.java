package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.model.Feedback;
import com.app.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /*
        ################ Add User Feedback ################
     */
    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse> addFeedback(@RequestBody Feedback feedback){

        ApiResponse apiResponse = feedbackService.addFeedback(feedback);

        if(apiResponse.isSuccess()){
            return new ResponseEntity<>(apiResponse, HttpStatus.OK);
        }else{
            return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);

        }


    }


    /*
           ############## Fetch Feedback For mess #############
     */
    @GetMapping("/feedback/{messEmail}")
    public ResponseEntity<List<Feedback>> getFeedbackForMess(@PathVariable String messEmail){
        return new ResponseEntity<>(feedbackService.getFeedbackForMess(messEmail),HttpStatus.OK);
    }
}
