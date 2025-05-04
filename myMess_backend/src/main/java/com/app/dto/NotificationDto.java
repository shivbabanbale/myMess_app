package com.app.dto;

import java.time.LocalDateTime;

public class NotificationDto {
    private String id;
    private String recipientEmail;
    private String senderEmail;
    private String senderName;
    private String title;
    private String message;
    private String notificationType;
    private String relatedEntityId;
    private boolean isRead;
    private LocalDateTime createdAt;

    // Default constructor
    public NotificationDto() {
    }

    // Constructor with required fields
    public NotificationDto(String id, String recipientEmail, String senderEmail, String title, 
                          String message, String notificationType, boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.recipientEmail = recipientEmail;
        this.senderEmail = senderEmail;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    // Full constructor
    public NotificationDto(String id, String recipientEmail, String senderEmail, String senderName, 
                          String title, String message, String notificationType, 
                          String relatedEntityId, boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.recipientEmail = recipientEmail;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
        this.relatedEntityId = relatedEntityId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public String getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(String relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 