package com.app.service;

import com.app.dto.LeaveApplicationDto;

import java.util.List;

public interface LeaveApplicationService {
    
    // Create a new leave application
    LeaveApplicationDto createLeaveApplication(LeaveApplicationDto leaveApplicationDto);
    
    // Get a leave application by ID
    LeaveApplicationDto getLeaveApplicationById(String id);
    
    // Get all leave applications for a user by ID
    List<LeaveApplicationDto> getLeaveApplicationsByUserId(String userId);
    
    // Get all leave applications for a user by email
    List<LeaveApplicationDto> getLeaveApplicationsByUserEmail(String userEmail);
    
    // Get all leave applications for a mess
    List<LeaveApplicationDto> getLeaveApplicationsByMessId(String messId);
    
    // Get all leave applications for a mess owner by email
    List<LeaveApplicationDto> getLeaveApplicationsByOwnerEmail(String ownerEmail);
    
    // Get all pending leave applications for a mess
    List<LeaveApplicationDto> getPendingLeaveApplicationsByMessId(String messId);
    
    // Get all pending leave applications for a mess owner
    List<LeaveApplicationDto> getPendingLeaveApplicationsByOwnerEmail(String ownerEmail);
    
    // Get all leave applications for a user in a mess
    List<LeaveApplicationDto> getLeaveApplicationsByUserIdAndMessId(String userId, String messId);
    
    // Get all leave applications for a user by email in a mess with owner email
    List<LeaveApplicationDto> getLeaveApplicationsByUserEmailAndOwnerEmail(String userEmail, String ownerEmail);
    
    // Update a leave application
    LeaveApplicationDto updateLeaveApplication(String id, LeaveApplicationDto leaveApplicationDto);
    
    // Approve a leave application
    LeaveApplicationDto approveLeaveApplication(String id);
    
    // Reject a leave application
    LeaveApplicationDto rejectLeaveApplication(String id, String rejectionReason);
    
    // Delete a leave application
    void deleteLeaveApplication(String id);
} 