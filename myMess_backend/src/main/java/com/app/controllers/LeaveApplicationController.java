package com.app.controllers;

import com.app.dto.ApiResponse;
import com.app.dto.LeaveApplicationDto;
import com.app.service.LeaveApplicationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leave")

public class LeaveApplicationController {

    @Autowired
    private LeaveApplicationService leaveApplicationService;

    // Create a new leave application
    @PostMapping("/apply")
    public ResponseEntity<LeaveApplicationDto> createLeaveApplication(@Valid @RequestBody LeaveApplicationDto leaveApplicationDto) {
        LeaveApplicationDto createdLeave = leaveApplicationService.createLeaveApplication(leaveApplicationDto);
        return new ResponseEntity<>(createdLeave, HttpStatus.CREATED);
    }

    // Get a leave application by ID
    @GetMapping("/{id}")
    public ResponseEntity<LeaveApplicationDto> getLeaveApplicationById(@PathVariable String id) {
        LeaveApplicationDto leaveApplication = leaveApplicationService.getLeaveApplicationById(id);
        if (leaveApplication != null) {
            return new ResponseEntity<>(leaveApplication, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Get all leaves for a user by email
    @GetMapping("/user/email/{userEmail}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByUserEmail(@PathVariable String userEmail) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByUserEmail(userEmail);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }
    
    // Get all leaves for a user by ID (keeping for backward compatibility)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByUserId(@PathVariable String userId) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByUserId(userId);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }

    // Get all leaves for a mess
    @GetMapping("/mess/{messId}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByMessId(@PathVariable String messId) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByMessId(messId);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }
    
    // Get all leaves for a mess owner by email
    @GetMapping("/owner/{ownerEmail}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByOwnerEmail(@PathVariable String ownerEmail) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByOwnerEmail(ownerEmail);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }

    // Get all pending leaves for a mess
    @GetMapping("/pending/mess/{messId}")
    public ResponseEntity<List<LeaveApplicationDto>> getPendingLeaveApplicationsByMessId(@PathVariable String messId) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getPendingLeaveApplicationsByMessId(messId);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }
    
    // Get all pending leaves for a mess owner
    @GetMapping("/pending/owner/{ownerEmail}")
    public ResponseEntity<List<LeaveApplicationDto>> getPendingLeaveApplicationsByOwnerEmail(@PathVariable String ownerEmail) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getPendingLeaveApplicationsByOwnerEmail(ownerEmail);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }
    
    // Get all leaves for a user in a mess
    @GetMapping("/user/{userId}/mess/{messId}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByUserIdAndMessId(
            @PathVariable String userId, @PathVariable String messId) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByUserIdAndMessId(userId, messId);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }
    
    // Get all leaves for a user by email in a mess with owner email
    @GetMapping("/user/email/{userEmail}/owner/{ownerEmail}")
    public ResponseEntity<List<LeaveApplicationDto>> getLeaveApplicationsByUserEmailAndOwnerEmail(
            @PathVariable String userEmail, @PathVariable String ownerEmail) {
        List<LeaveApplicationDto> leaveApplications = leaveApplicationService.getLeaveApplicationsByUserEmailAndOwnerEmail(userEmail, ownerEmail);
        return new ResponseEntity<>(leaveApplications, HttpStatus.OK);
    }

    // Update a leave application
    @PutMapping("/{id}")
    public ResponseEntity<LeaveApplicationDto> updateLeaveApplication(
            @PathVariable String id, @Valid @RequestBody LeaveApplicationDto leaveApplicationDto) {
        LeaveApplicationDto updatedLeave = leaveApplicationService.updateLeaveApplication(id, leaveApplicationDto);
        if (updatedLeave != null) {
            return new ResponseEntity<>(updatedLeave, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Approve a leave application
    @PutMapping("/approve/{id}")
    public ResponseEntity<LeaveApplicationDto> approveLeaveApplication(@PathVariable String id) {
        LeaveApplicationDto approvedLeave = leaveApplicationService.approveLeaveApplication(id);
        if (approvedLeave != null) {
            return new ResponseEntity<>(approvedLeave, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Reject a leave application
    @PutMapping("/reject/{id}")
    public ResponseEntity<LeaveApplicationDto> rejectLeaveApplication(
            @PathVariable String id, @RequestParam String rejectionReason) {
        LeaveApplicationDto rejectedLeave = leaveApplicationService.rejectLeaveApplication(id, rejectionReason);
        if (rejectedLeave != null) {
            return new ResponseEntity<>(rejectedLeave, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Delete a leave application
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeaveApplication(@PathVariable String id) {
        leaveApplicationService.deleteLeaveApplication(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
} 