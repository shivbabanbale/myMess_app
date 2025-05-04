package com.app.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "mess")
public class MessOwner {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String contact;

    private String messName;
    private String messAddress;
    private String messType;//Veg or Non-veg
    private Integer capacity;
    private Integer pricePerMeal;
    private Integer subscriptionPlan;

    private LocalDate currentDate;

    //Mess Profile
    private String imageName;

    //Mess Images
    private List<String> messImages;

    //List of User which join the particular Mess
    private List<String> joinedUsers = new ArrayList<>();


    private Double latitude;
    private Double longitude;


    private Double averageRating;
    private Integer feedbackCount;

    private List<Attendance> attendance;
}
