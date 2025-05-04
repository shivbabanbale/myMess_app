package com.app.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.app.model.WeeklyMenu;

@Repository
public interface WeeklyMenuRepository extends MongoRepository<WeeklyMenu, String> {
    
    // Find menu by mess email
    WeeklyMenu findByMessEmail(String messEmail);
    
    // Find latest menu by mess email (ordered by lastUpdated)
    // Method name follows Spring Data naming convention to find first result
    // No @Query annotation needed as the method name defines the query
    WeeklyMenu findTopByMessEmailOrderByLastUpdatedDesc(String messEmail);
    
    // Check if menu exists for a specific mess
    boolean existsByMessEmail(String messEmail);
} 