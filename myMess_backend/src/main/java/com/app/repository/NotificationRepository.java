package com.app.repository;

import com.app.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    /**
     * Find all notifications for a specific recipient
     * 
     * @param recipientEmail the email of the recipient
     * @return a list of notifications
     */
    List<Notification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    
    /**
     * Find all unread notifications for a specific recipient
     * 
     * @param recipientEmail the email of the recipient
     * @param isRead the read status
     * @return a list of notifications
     */
    List<Notification> findByRecipientEmailAndIsReadOrderByCreatedAtDesc(String recipientEmail, boolean isRead);
    
    /**
     * Count unread notifications for a specific recipient
     * 
     * @param recipientEmail the email of the recipient
     * @param isRead the read status
     * @return the count of notifications
     */
    long countByRecipientEmailAndIsRead(String recipientEmail, boolean isRead);
    
    /**
     * Delete all notifications for a specific recipient
     * 
     * @param recipientEmail the email of the recipient
     */
    void deleteByRecipientEmail(String recipientEmail);
} 