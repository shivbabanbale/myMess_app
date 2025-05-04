package com.app.dto;


import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private String name;
    private String contact;
    private String phoneNumber;
    private String otp;
    
    private String gender;
    private String address;
    private String imageName;
    private LocalDate currentDate;

    private String messId;

    //Data after user join mess
    private String messName;
    private LocalDate joinDate;
    private String subscriptionPlan;
    private String foodType;
}
