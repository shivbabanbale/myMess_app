package com.app.service;

import com.app.dto.NotificationDto;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationService {
    
    /**
     * Create a notification
     * 
     * @param recipientEmail the email of the recipient
     * @param senderEmail the email of the sender
     * @param title the notification title
     * @param message the notification message
     * @param notificationType the type of notification
     * @param relatedEntityId an optional ID related to this notification
     * @return the created notification as DTO
     */
    NotificationDto createNotification(String recipientEmail, String senderEmail, String title, 
                                      String message, String notificationType, String relatedEntityId);
    
    /**
     * Get all notifications for a user
     * 
     * @param userEmail the email of the user
     * @return a list of notifications
     */
    List<NotificationDto> getNotificationsForUser(String userEmail);
    
    /**
     * Get unread notifications for a user
     * 
     * @param userEmail the email of the user
     * @return a list of unread notifications
     */
    List<NotificationDto> getUnreadNotificationsForUser(String userEmail);
    
    /**
     * Count unread notifications for a user
     * 
     * @param userEmail the email of the user
     * @return the count of unread notifications
     */
    long countUnreadNotifications(String userEmail);
    
    /**
     * Mark a notification as read
     * 
     * @param notificationId the ID of the notification
     * @param userEmail the email of the user
     * @return the updated notification or null if not found or unauthorized
     */
    NotificationDto markAsRead(String notificationId, String userEmail);
    
    /**
     * Mark all notifications for a user as read
     * 
     * @param userEmail the email of the user
     * @return the number of notifications marked as read
     */
    int markAllAsRead(String userEmail);
    
    /**
     * Delete a notification
     * 
     * @param notificationId the ID of the notification
     * @param userEmail the email of the user
     * @return true if deleted, false if not found or unauthorized
     */
    boolean deleteNotification(String notificationId, String userEmail);
    
    /**
     * Delete all notifications for a user
     * 
     * @param userEmail the email of the user
     */
    void deleteAllNotificationsForUser(String userEmail);
    
    /**
     * Create a notification for a new member joining a mess
     * 
     * @param messId the ID of the mess
     * @param messName the name of the mess
     * @param ownerEmail the email of the mess owner
     * @param newMemberEmail the email of the new member
     * @param newMemberName the name of the new member
     * @return the created notification
     */
    NotificationDto createMemberJoinedNotification(String messId, String messName, 
                                                  String ownerEmail, String newMemberEmail, 
                                                  String newMemberName);
    
    /**
     * Create a notification for a payment due
     * 
     * @param messId the ID of the mess
     * @param messName the name of the mess
     * @param memberEmail the email of the member
     * @param amount the amount due
     * @param dueDate the due date
     * @return the created notification
     */
    NotificationDto createPaymentDueNotification(String messId, String messName, 
                                               String memberEmail, double amount, 
                                               LocalDateTime dueDate);
    
    /**
     * Send menu update notifications to all members of a mess
     * 
     * @param messId the ID of the mess
     * @param messName the name of the mess
     * @param memberEmails the emails of all members
     * @param ownerEmail the email of the mess owner
     * @return the number of notifications sent
     */
    int createMenuUpdateNotifications(String messId, String messName, 
                                    List<String> memberEmails, String ownerEmail);
} 