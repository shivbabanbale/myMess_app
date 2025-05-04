package com.app.model;

import java.time.LocalDate;

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
@Document(collection = "attendance")
public class Attendance {
    @Id
    private String id;
    private String ownerEmail;
    private String userEmail;
    private LocalDate date;
    private String status; // Present or Absent
}

