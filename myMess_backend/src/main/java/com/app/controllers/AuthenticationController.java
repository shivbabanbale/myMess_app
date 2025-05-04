package com.app.controllers;

import com.app.jwt.JwtUtil;
import com.app.model.MessOwner;
import com.app.model.User;
import com.app.repository.MessOwnerRepository;
import com.app.repository.UserRepository;
import com.app.service.OTPService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    @Autowired
    private OTPService otpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessOwnerRepository messOwnerRepository;

    @Autowired
    private JwtUtil jwtUtil;

    Logger logger= LoggerFactory.getLogger(AuthenticationController.class);


    // Endpoint to send OTP to email
    @PostMapping("/sendOtp")
    public ResponseEntity<String> sendOtp(@RequestParam String contact) {
        logger.info("The Email is: "+contact);
        logger.info("OTP on going");
        Optional<User> existingUser = userRepository.findByEmail(contact);
        String otp = otpService.generateOtp(contact);

        if (existingUser.isPresent()) {
            String s = otpService.sendOtp(contact, otp);
            logger.info("OTP sent for login: {}",s);
            return ResponseEntity.ok("OTP sent for login."+s);
        } else {
            String s = otpService.sendOtp(contact, otp);
            return ResponseEntity.ok("OTP sent for account creation."+s);
        }
    }

//    // Endpoint to send OTP to mobile number
//    @PostMapping("/sendOtpSms")
//    public ResponseEntity<String> sendOtpSms(@RequestParam String mobileNumber) {
//        // Generate a random OTP
//        String otp = generateOtp();
//        smsService.sendOtpSms(mobileNumber, otp); // Send OTP to mobile number
//
//        return ResponseEntity.ok("OTP sent to mobile: " + mobileNumber);
//    }

    @PostMapping("/verifyOtp")
    public ResponseEntity<String> verifyOtp(@RequestParam String contact, @RequestParam String otp) {
        if (otpService.verifyOtp(contact, otp)) {
            Optional<User> existingUser = userRepository.findByEmail(contact);

            if (existingUser.isPresent()) {
                // User exists
                String token = jwtUtil.generateToken(contact);
                return ResponseEntity.ok("Login successful. Token: " + token);
            } else {
                // Create new user
                User newUser = new User();
                newUser.setEmail(contact);
                newUser.setCurrentDate(LocalDate.now());
                userRepository.save(newUser);

                // Generate token
                String token = jwtUtil.generateToken(contact);
                return ResponseEntity.ok("Account created and login successful. Token: " + token);
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP.");
        }
    }



    @PostMapping("/sendOtpToMess")
    public ResponseEntity<String> sendOtpToMess(@RequestParam String contact) {
        Optional<MessOwner> existingMess = messOwnerRepository.findByEmail(contact);
        String otp = otpService.generateOtp(contact);

        if (existingMess.isPresent()) {
            String s = otpService.sendOtp(contact, otp);
            return ResponseEntity.ok("OTP sent for login."+s);
        } else {
            String s = otpService.sendOtp(contact, otp);
            return ResponseEntity.ok("OTP sent for account creation."+s);
        }
    }


    @PostMapping("/verifyMess")
    public ResponseEntity<String> verifyOtpOfMess(@RequestParam String contact, @RequestParam String otp) {
        if (otpService.verifyOtp(contact, otp)) {
            Optional<MessOwner> existingUser = messOwnerRepository.findByEmail(contact);

            if (existingUser.isPresent()) {
                String token = jwtUtil.generateToken(contact);
                return ResponseEntity.ok("Login successful. Token: " + token);
            } else {
                // Create new user
                MessOwner messOwner=new MessOwner();
                messOwner.setEmail(contact);
                messOwner.setCurrentDate(LocalDate.now());
                System.out.println(messOwner);
                messOwnerRepository.save(messOwner);


                String token = jwtUtil.generateToken(contact);
                return ResponseEntity.ok("Account created and login successful. Token: " + token);
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid OTP.");
        }
    }

}

