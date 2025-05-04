package com.app.model;

import java.util.HashMap;
import java.util.Map;

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
@Document(collection = "weekly_menu")
public class WeeklyMenu {
    @Id
    private String id;
    
    // Reference to mess by email
    private String messEmail;
    
    // Menu items for each day of the week
    // Format: { "breakfast": "Poha, Tea", "lunch": "Rice, Dal", "dinner": "Roti, Sabzi" }
    private Map<String, String> mondayMenu = new HashMap<>();
    private Map<String, String> tuesdayMenu = new HashMap<>();
    private Map<String, String> wednesdayMenu = new HashMap<>();
    private Map<String, String> thursdayMenu = new HashMap<>();
    private Map<String, String> fridayMenu = new HashMap<>();
    private Map<String, String> saturdayMenu = new HashMap<>();
    private Map<String, String> sundayMenu = new HashMap<>();
    
    // Last updated timestamp
    private long lastUpdated;
} 