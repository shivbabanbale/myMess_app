package com.app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;



@Service
public class OTPService {

    @Autowired
    private JavaMailSender mailSender;


    @Value("$(spring.mail.username)")
    private String fromEmailId;


    private Map<String, String> otpStore = new HashMap<>();
    private Map<String, LocalDateTime> otpTimestamps = new HashMap<>();
    private static final int OTP_EXPIRATION_MINUTES = 5;


    // Generate and store OTP
    public String generateOtp(String contact) {
        String otp = String.valueOf((int) (Math.random() * 9000) + 1000); // Generate a 4-digit OTP
        otpStore.put(contact, otp);
        otpTimestamps.put(contact, LocalDateTime.now());
        return otp;
    }


    public String sendOtp(String contact, String otp) {
        // Logic to send OTP
        if (contact.contains("@")) {
            sendOtpEmail(contact, otp);
        } else {
            sendOtpSms(contact, otp);
        }

        return otp;
    }

    /*
        ############## Send OTP on Email ##############
     */
    public void sendOtpEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmailId);  // Use a valid 'from' address
        message.setTo(email);
        message.setSubject("Your OTP Code");
        message.setText("Your OTP is: " + otp);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            // Handle exceptions properly
        }
    }

    /*
        ########## Send SMS ###########
     */
    private void sendOtpSms(String mobileNumber, String otp) {
        // For simplicity, just printing. Replace with actual SMS-sending logic (e.g., Twilio API).
        System.out.println("Sending OTP to mobile: " + mobileNumber + ", OTP: " + otp);
    }


    /*
        ############## Verify OTP #############
     */
    public boolean verifyOtp(String contact, String otp) {
        if (!otpStore.containsKey(contact)) {
            return false; // No OTP was generated for this contact
        }

        // Check OTP match
        String storedOtp = otpStore.get(contact);
        if (!storedOtp.equals(otp)) {
            return false; // OTP does not match
        }

        // Check expiration
        LocalDateTime storedTime = otpTimestamps.get(contact);
        if (storedTime.plusMinutes(OTP_EXPIRATION_MINUTES).isBefore(LocalDateTime.now())) {
            otpStore.remove(contact); // Clean up expired OTP
            otpTimestamps.remove(contact);
            return false; // OTP expired
        }

        // OTP is valid, clean up
        otpStore.remove(contact);
        otpTimestamps.remove(contact);
        return true;
    }
}

