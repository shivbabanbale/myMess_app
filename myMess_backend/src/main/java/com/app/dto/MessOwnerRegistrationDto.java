package com.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessOwnerRegistrationDto {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid Email format")
    @NotBlank(message = "Email is Required")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private LocalDate currentDate=LocalDate.now();
}
