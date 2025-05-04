package com.app.model;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String phoneNumber;
    private String password;
    private String contact;
    private String gender;
    private String address;
    private String imageName;

    private LocalDate currentDate;

    //Reference of Mess by using messId
    private String messId;

    //Data after user join mess
    private String messName;
    private LocalDate joinDate;
    private String subscriptionPlan;
    private String foodType;
}
