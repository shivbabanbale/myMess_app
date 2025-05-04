package com.app.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegistrationDto {
    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "Name must contain characters only")
    private String name;

//    @Email(message = "Invalid Email format")
    @NotBlank(message = "Email is Required")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Invalid Email !")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private LocalDate currentDate=LocalDate.now();

}
