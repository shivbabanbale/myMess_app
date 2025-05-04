package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.dto.NotificationDto;
import com.app.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * Get all notifications for a user
     * 
     * @param userEmail The email of the user
     * @return ResponseEntity with a list of notifications
     */
    @GetMapping("/user/{userEmail}")
    public ResponseEntity<List<NotificationDto>> getNotificationsForUser(@PathVariable String userEmail) {
        List<NotificationDto> notifications = notificationService.getNotificationsForUser(userEmail);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notifications for a user
     * 
     * @param userEmail The email of the user
     * @return ResponseEntity with a list of unread notifications
     */
    @GetMapping("/user/{userEmail}/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotificationsForUser(@PathVariable String userEmail) {
        List<NotificationDto> notifications = notificationService.getUnreadNotificationsForUser(userEmail);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Count unread notifications for a user
     * 
     * @param userEmail The email of the user
     * @return ResponseEntity with the count of unread notifications
     */
    @GetMapping("/user/{userEmail}/unread/count")
    public ResponseEntity<Map<String, Long>> countUnreadNotificationsForUser(@PathVariable String userEmail) {
        long count = notificationService.countUnreadNotifications(userEmail);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Mark a notification as read
     * 
     * @param notificationId The ID of the notification
     * @param userEmail The email of the user
     * @return ResponseEntity with the updated notification or error
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markNotificationAsRead(
            @PathVariable String notificationId,
            @RequestParam String userEmail) {
        
        NotificationDto updatedNotification = notificationService.markAsRead(notificationId, userEmail);
        
        if (updatedNotification == null) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse(false, "Notification not found or unauthorized"));
        }
        
        return ResponseEntity.ok(updatedNotification);
    }
    
    /**
     * Mark all notifications for a user as read
     * 
     * @param userEmail The email of the user
     * @return ResponseEntity with the count of notifications marked as read
     */
    @PutMapping("/user/{userEmail}/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllNotificationsAsRead(@PathVariable String userEmail) {
        int count = notificationService.markAllAsRead(userEmail);
        return ResponseEntity.ok(Map.of("markedAsRead", count));
    }
    
    /**
     * Delete a notification
     * 
     * @param notificationId The ID of the notification
     * @param userEmail The email of the user
     * @return ResponseEntity with success or error
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse> deleteNotification(
            @PathVariable String notificationId,
            @RequestParam String userEmail) {
        
        boolean deleted = notificationService.deleteNotification(notificationId, userEmail);
        
        if (!deleted) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse(false, "Notification not found or unauthorized"));
        }
        
        return ResponseEntity.ok(new ApiResponse(true, "Notification deleted successfully"));
    }
    
    /**
     * Delete all notifications for a user
     * 
     * @param userEmail The email of the user
     * @return ResponseEntity with success message
     */
    @DeleteMapping("/user/{userEmail}")
    public ResponseEntity<ApiResponse> deleteAllNotificationsForUser(@PathVariable String userEmail) {
        notificationService.deleteAllNotificationsForUser(userEmail);
        return ResponseEntity.ok(new ApiResponse(true, "All notifications deleted successfully"));
    }
    
    /**
     * Send a notification
     * 
     * @param recipientEmail The email of the recipient
     * @param senderEmail The email of the sender (optional, defaults to "system@myMessApp.com")
     * @param title The notification title
     * @param message The notification message
     * @param notificationType The type of notification
     * @param relatedEntityId Optional ID of a related entity (messId, userId, etc.)
     * @return ResponseEntity with the created notification
     */
    @PostMapping("/send")
    public ResponseEntity<NotificationDto> sendNotification(
            @RequestParam String recipientEmail,
            @RequestParam(required = false, defaultValue = "system@myMessApp.com") String senderEmail,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam String notificationType,
            @RequestParam(required = false) String relatedEntityId) {
        
        NotificationDto notification = notificationService.createNotification(
            recipientEmail,
            senderEmail,
            title,
            message,
            notificationType,
            relatedEntityId
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }
    
    /**
     * Create a test notification (for development purposes)
     * 
     * @param recipientEmail The email of the recipient
     * @param senderEmail The email of the sender (optional, defaults to "system@myMessApp.com")
     * @param title The notification title
     * @param message The notification message
     * @param notificationType The type of notification (optional, defaults to "TEST")
     * @return ResponseEntity with the created notification
     */
    @PostMapping("/test")
    public ResponseEntity<NotificationDto> createTestNotification(
            @RequestParam String recipientEmail,
            @RequestParam(required = false, defaultValue = "system@myMessApp.com") String senderEmail,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam(required = false, defaultValue = "TEST") String notificationType) {
        
        NotificationDto notification = notificationService.createNotification(
            recipientEmail,
            senderEmail,
            title,
            message,
            notificationType,
            null
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }
    
    /**
     * Send notifications to multiple recipients
     * 
     * @param recipientEmails List of recipient emails (comma-separated)
     * @param senderEmail The email of the sender (optional, defaults to "system@myMessApp.com")
     * @param title The notification title
     * @param message The notification message
     * @param notificationType The type of notification
     * @param relatedEntityId Optional ID of a related entity (messId, userId, etc.)
     * @return ResponseEntity with the count of notifications sent
     */
    @PostMapping("/send-bulk")
    public ResponseEntity<Map<String, Object>> sendBulkNotifications(
            @RequestParam String recipientEmails,
            @RequestParam(required = false, defaultValue = "system@myMessApp.com") String senderEmail,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam String notificationType,
            @RequestParam(required = false) String relatedEntityId) {
        
        String[] emails = recipientEmails.split(",");
        List<NotificationDto> sentNotifications = new ArrayList<>();
        int failedCount = 0;
        
        for (String email : emails) {
            String trimmedEmail = email.trim();
            if (!trimmedEmail.isEmpty()) {
                try {
                    NotificationDto notification = notificationService.createNotification(
                        trimmedEmail,
                        senderEmail,
                        title,
                        message,
                        notificationType,
                        relatedEntityId
                    );
                    sentNotifications.add(notification);
                } catch (Exception e) {
                    failedCount++;
                }
            }
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "totalEmails", emails.length,
            "successCount", sentNotifications.size(),
            "failedCount", failedCount,
            "notifications", sentNotifications
        ));
    }
} 