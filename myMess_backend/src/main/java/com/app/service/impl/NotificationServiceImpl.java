package com.app.service.impl;

import com.app.dto.NotificationDto;
import com.app.model.Notification;
import com.app.model.User;
import com.app.repository.NotificationRepository;
import com.app.repository.UserRepository;
import com.app.service.NotificationService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ModelMapper modelMapper;
    
    @Override
    public NotificationDto createNotification(String recipientEmail, String senderEmail, String title, 
                                             String message, String notificationType, String relatedEntityId) {
        Notification notification = new Notification();
        notification.setRecipientEmail(recipientEmail);
        notification.setSenderEmail(senderEmail);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(notificationType);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        // If sender email is provided, try to get sender name
        if (senderEmail != null) {
            if (senderEmail.equals("system@myMessApp.com")) {
                notification.setSenderName("MyMess System");
            } else {
                Optional<User> senderOpt = userRepository.findByEmail(senderEmail);
                senderOpt.ifPresent(sender -> notification.setSenderName(sender.getName()));
            }
        }
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDto(savedNotification);
    }
    
    @Override
    public List<NotificationDto> getNotificationsForUser(String userEmail) {
        List<Notification> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(userEmail);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<NotificationDto> getUnreadNotificationsForUser(String userEmail) {
        List<Notification> notifications = notificationRepository.findByRecipientEmailAndIsReadOrderByCreatedAtDesc(userEmail, false);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public long countUnreadNotifications(String userEmail) {
        return notificationRepository.countByRecipientEmailAndIsRead(userEmail, false);
    }
    
    @Override
    public NotificationDto markAsRead(String notificationId, String userEmail) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            
            // Security check: only the recipient can mark as read
            if (!notification.getRecipientEmail().equals(userEmail)) {
                return null;
            }
            
            notification.setRead(true);
            Notification updatedNotification = notificationRepository.save(notification);
            return convertToDto(updatedNotification);
        }
        
        return null;
    }
    
    @Override
    public int markAllAsRead(String userEmail) {
        List<Notification> unreadNotifications = notificationRepository.findByRecipientEmailAndIsReadOrderByCreatedAtDesc(userEmail, false);
        
        if (unreadNotifications.isEmpty()) {
            return 0;
        }
        
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        
        return unreadNotifications.size();
    }
    
    @Override
    public boolean deleteNotification(String notificationId, String userEmail) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            
            // Security check: only the recipient can delete
            if (!notification.getRecipientEmail().equals(userEmail)) {
                return false;
            }
            
            notificationRepository.delete(notification);
            return true;
        }
        
        return false;
    }
    
    @Override
    public void deleteAllNotificationsForUser(String userEmail) {
        notificationRepository.deleteByRecipientEmail(userEmail);
    }
    
    @Override
    public NotificationDto createMemberJoinedNotification(String messId, String messName, 
                                                         String ownerEmail, String newMemberEmail, 
                                                         String newMemberName) {
        String title = "New Member Joined";
        String message = newMemberName + " has joined your mess '" + messName + "'.";
        
        return createNotification(
            ownerEmail, 
            newMemberEmail, 
            title, 
            message, 
            "NEW_MEMBER", 
            messId
        );
    }
    
    @Override
    public NotificationDto createPaymentDueNotification(String messId, String messName, 
                                                       String memberEmail, double amount, 
                                                       LocalDateTime dueDate) {
        String title = "Payment Due Reminder";
        String message = "Your payment of ₹" + amount + " for mess '" + messName + "' is due on " + 
                        dueDate.toLocalDate() + ".";
        
        return createNotification(
            memberEmail, 
            "system@myMessApp.com", 
            title, 
            message, 
            "PAYMENT_DUE", 
            messId
        );
    }
    
    @Override
    public int createMenuUpdateNotifications(String messId, String messName, 
                                           List<String> memberEmails, String ownerEmail) {
        String title = "Menu Updated";
        String message = "The menu for mess '" + messName + "' has been updated.";
        
        for (String memberEmail : memberEmails) {
            // Don't send to the owner
            if (!memberEmail.equals(ownerEmail)) {
                createNotification(
                    memberEmail, 
                    ownerEmail, 
                    title, 
                    message, 
                    "MENU_UPDATE", 
                    messId
                );
            }
        }
        
        return memberEmails.size() - 1; // Minus one for the owner
    }
    
    private NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setRecipientEmail(notification.getRecipientEmail());
        dto.setSenderEmail(notification.getSenderEmail());
        dto.setSenderName(notification.getSenderName());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setNotificationType(notification.getNotificationType());
        dto.setRelatedEntityId(notification.getRelatedEntityId());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}