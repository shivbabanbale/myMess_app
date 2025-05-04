package com.app.service;

import com.app.dto.ApiResponse;
import com.app.dto.MessOwnerLoginDto;
import com.app.dto.UserLoginDto;
import com.app.exceptions.ResourceNotFoundException;
import com.app.model.MessOwner;
import com.app.model.User;
import com.app.repository.MessOwnerRepository;
import com.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessOwnerRepository messOwnerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ApiResponse login(UserLoginDto loginDto) {
        // Find user by email
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if password matches
        boolean matches = passwordEncoder.matches(loginDto.getPassword(), user.getPassword());

        return new ApiResponse(matches, "Login Successful");
    }


    public ApiResponse login(MessOwnerLoginDto loginDto) {
        // Find user by email
        MessOwner messOwner = messOwnerRepository.findByEmail(loginDto.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if password matches
        boolean matches = passwordEncoder.matches(loginDto.getPassword(), messOwner.getPassword());

        return new ApiResponse(matches, "Login Successful");
    }
}
