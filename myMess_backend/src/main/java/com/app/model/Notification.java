package com.app.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notifications")
public class Notification {
    
    @Id
    private String id;
    private String recipientEmail;
    private String senderEmail;
    private String senderName;
    private String title;
    private String message;
    private String notificationType; // e.g., "NEW_MEMBER", "PAYMENT_DUE", "ANNOUNCEMENT"
    private String relatedEntityId; // e.g., a messId, userId, or paymentId this notification is about
    private boolean isRead;
    private LocalDateTime createdAt;

    // Default constructor
    public Notification() {
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    // Constructor with required fields
    public Notification(String recipientEmail, String senderEmail, String title, String message, String notificationType) {
        this.recipientEmail = recipientEmail;
        this.senderEmail = senderEmail;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    // Full constructor
    public Notification(String recipientEmail, String senderEmail, String title, String message, 
                        String notificationType, String relatedEntityId) {
        this.recipientEmail = recipientEmail;
        this.senderEmail = senderEmail;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
        this.relatedEntityId = relatedEntityId;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
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

    @Override
    public String toString() {
        return "Notification{" +
                "id='" + id + '\'' +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", senderEmail='" + senderEmail + '\'' +
                ", senderName='" + senderName + '\'' +
                ", title='" + title + '\'' +
                ", message='" + message + '\'' +
                ", notificationType='" + notificationType + '\'' +
                ", relatedEntityId='" + relatedEntityId + '\'' +
                ", isRead=" + isRead +
                ", createdAt=" + createdAt +
                '}';
    }
} 