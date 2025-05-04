package com.app.service;

import com.app.model.WeeklyMenu;

public interface WeeklyMenuService {
    
    // Save or update a weekly menu
    WeeklyMenu saveMenu(WeeklyMenu menu);
    
    // Get menu by mess email
    WeeklyMenu getMenuByMessEmail(String messEmail);
    
    // Get the LATEST menu by mess email (sorted by lastUpdated)
    WeeklyMenu getLatestMenuByMessEmail(String messEmail);
    
    // Delete menu
    void deleteMenu(String menuId);
    
    // Check if menu exists for a mess
    boolean menuExistsForMess(String messEmail);
} 