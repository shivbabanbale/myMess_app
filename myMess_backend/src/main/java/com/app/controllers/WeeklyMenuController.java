package com.app.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.app.model.WeeklyMenu;
import com.app.service.WeeklyMenuService;

@RestController
@RequestMapping("/menu")
public class WeeklyMenuController {

    @Autowired
    private WeeklyMenuService menuService;
    
    // Get weekly menu for a specific mess
    @GetMapping("/{messEmail}")
    public ResponseEntity<?> getMenuByMessEmail(@PathVariable String messEmail) {
        try {
            WeeklyMenu menu = menuService.getMenuByMessEmail(messEmail);
            if (menu != null) {
                return ResponseEntity.ok(menu);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No menu found for mess with email: " + messEmail);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error retrieving menu: " + e.getMessage());
        }
    }
    
    // Get the LATEST weekly menu for a specific mess (by lastUpdated)
    @GetMapping("/latest/{messEmail}")
    public ResponseEntity<?> getLatestMenuByMessEmail(@PathVariable String messEmail) {
        try {
            WeeklyMenu menu = menuService.getLatestMenuByMessEmail(messEmail);
            if (menu != null) {
                return ResponseEntity.ok(menu);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No menu found for mess with email: " + messEmail);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error retrieving latest menu: " + e.getMessage());
        }
    }
    
    // Create or update weekly menu
    @PostMapping("/save")
    public ResponseEntity<?> saveMenu(@RequestBody WeeklyMenu menu) {
        try {
            WeeklyMenu savedMenu = menuService.saveMenu(menu);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMenu);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error saving menu: " + e.getMessage());
        }
    }
    
    // Delete weekly menu
    @DeleteMapping("/{menuId}")
    public ResponseEntity<?> deleteMenu(@PathVariable String menuId) {
        try {
            menuService.deleteMenu(menuId);
            return ResponseEntity.ok("Menu deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting menu: " + e.getMessage());
        }
    }
    
    // Check if a menu exists for a mess
    @GetMapping("/exists/{messEmail}")
    public ResponseEntity<?> menuExists(@PathVariable String messEmail) {
        try {
            boolean exists = menuService.menuExistsForMess(messEmail);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking menu existence: " + e.getMessage());
        }
    }
} 