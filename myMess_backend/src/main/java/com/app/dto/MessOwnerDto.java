package com.app.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessOwnerDto {

    private String id;
    private String name;
    private String contact;
    private String email;

    private String messName;
    private String messAddress;
    private String messType;//Veg or Non-veg
    private Integer capacity;
    private Integer pricePerMeal;
    private Integer subscriptionPlan;
    private LocalDate currentDate;

    private String imageName;

    private List<String> messImages;

    private List<String> joinedUsers = new ArrayList<>();

    private Double latitude;
    private Double longitude;
    private Double distance; // Distance from user in kilometers

    private Double averageRating;
    private Integer feedbackCount;
}
