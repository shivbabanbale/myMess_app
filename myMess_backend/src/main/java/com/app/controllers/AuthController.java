package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.dto.MessOwnerLoginDto;
import com.app.dto.UserLoginDto;
import com.app.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;


   @PostMapping("/login")
   public ResponseEntity<ApiResponse> loginUser(@RequestBody UserLoginDto loginDto) {
        ApiResponse isAuthenticated = authService.login(loginDto);
        System.out.println("User Login start");

        if (isAuthenticated.isSuccess()) {
            // In a real application, generate a JWT token here and return it
            return ResponseEntity.ok(isAuthenticated);
        } else {
            isAuthenticated.setMessage("Invalid Email or Password");
            isAuthenticated.setSuccess(false);
            return ResponseEntity.status(401).body(isAuthenticated);
        }
    }

    @PostMapping("/login_messOwner")
    public ResponseEntity<ApiResponse> loginMessOwner(@RequestBody MessOwnerLoginDto loginDto) {
        ApiResponse isAuthenticated = authService.login(loginDto);

        if (isAuthenticated.isSuccess()) {
            // In a real application, generate a JWT token here and return it
            return ResponseEntity.ok(isAuthenticated);
        } else {
            isAuthenticated.setMessage("Invalid Email or Password");
            isAuthenticated.setSuccess(false);
return ResponseEntity.status(401).body(isAuthenticated);
}
}
}
