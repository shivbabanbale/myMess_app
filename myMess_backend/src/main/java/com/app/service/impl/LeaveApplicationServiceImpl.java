package com.app.service.impl;

import com.app.dto.LeaveApplicationDto;
import com.app.model.LeaveApplication;
import com.app.model.LeaveStatus;
import com.app.repository.LeaveApplicationRepository;
import com.app.service.LeaveApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LeaveApplicationServiceImpl implements LeaveApplicationService {

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Override
    public LeaveApplicationDto createLeaveApplication(LeaveApplicationDto leaveApplicationDto) {
        LeaveApplication leaveApplication = convertToEntity(leaveApplicationDto);
        leaveApplication.setStatus(LeaveStatus.PENDING);
        leaveApplication.setApplicationDate(LocalDate.now());
        
        LeaveApplication savedLeaveApplication = leaveApplicationRepository.save(leaveApplication);
        return convertToDto(savedLeaveApplication);
    }

    @Override
    public LeaveApplicationDto getLeaveApplicationById(String id) {
        Optional<LeaveApplication> leaveApplicationOptional = leaveApplicationRepository.findById(id);
        return leaveApplicationOptional.map(this::convertToDto).orElse(null);
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByUserId(String userId) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByUserId(userId);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByUserEmail(String userEmail) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByUserEmail(userEmail);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByMessId(String messId) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByMessId(messId);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByOwnerEmail(String ownerEmail) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByOwnerEmail(ownerEmail);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getPendingLeaveApplicationsByMessId(String messId) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByMessIdAndStatus(messId, LeaveStatus.PENDING);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getPendingLeaveApplicationsByOwnerEmail(String ownerEmail) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByOwnerEmailAndStatus(ownerEmail, LeaveStatus.PENDING);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByUserIdAndMessId(String userId, String messId) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByUserIdAndMessId(userId, messId);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDto> getLeaveApplicationsByUserEmailAndOwnerEmail(String userEmail, String ownerEmail) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findByUserEmailAndOwnerEmail(userEmail, ownerEmail);
        return leaveApplications.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public LeaveApplicationDto updateLeaveApplication(String id, LeaveApplicationDto leaveApplicationDto) {
        Optional<LeaveApplication> leaveApplicationOptional = leaveApplicationRepository.findById(id);
        
        if (leaveApplicationOptional.isPresent()) {
            LeaveApplication existingLeaveApplication = leaveApplicationOptional.get();
            
            if (leaveApplicationDto.getStartDate() != null) {
                existingLeaveApplication.setStartDate(leaveApplicationDto.getStartDate());
            }
            
            if (leaveApplicationDto.getEndDate() != null) {
                existingLeaveApplication.setEndDate(leaveApplicationDto.getEndDate());
            }
            
            if (leaveApplicationDto.getReason() != null) {
                existingLeaveApplication.setReason(leaveApplicationDto.getReason());
            }
            
            LeaveApplication updatedLeaveApplication = leaveApplicationRepository.save(existingLeaveApplication);
            return convertToDto(updatedLeaveApplication);
        }
        
        return null;
    }

    @Override
    public LeaveApplicationDto approveLeaveApplication(String id) {
        Optional<LeaveApplication> leaveApplicationOptional = leaveApplicationRepository.findById(id);
        
        if (leaveApplicationOptional.isPresent()) {
            LeaveApplication leaveApplication = leaveApplicationOptional.get();
            leaveApplication.setStatus(LeaveStatus.APPROVED);
            leaveApplication.setApprovedDate(LocalDate.now());
            
            LeaveApplication updatedLeaveApplication = leaveApplicationRepository.save(leaveApplication);
            return convertToDto(updatedLeaveApplication);
        }
        
        return null;
    }

    @Override
    public LeaveApplicationDto rejectLeaveApplication(String id, String rejectionReason) {
        Optional<LeaveApplication> leaveApplicationOptional = leaveApplicationRepository.findById(id);
        
        if (leaveApplicationOptional.isPresent()) {
            LeaveApplication leaveApplication = leaveApplicationOptional.get();
            leaveApplication.setStatus(LeaveStatus.REJECTED);
            leaveApplication.setRejectionReason(rejectionReason);
            leaveApplication.setRejectedDate(LocalDate.now());
            
            LeaveApplication updatedLeaveApplication = leaveApplicationRepository.save(leaveApplication);
            return convertToDto(updatedLeaveApplication);
        }
        
        return null;
    }

    @Override
    public void deleteLeaveApplication(String id) {
        leaveApplicationRepository.deleteById(id);
    }

    private LeaveApplication convertToEntity(LeaveApplicationDto dto) {
        LeaveApplication entity = new LeaveApplication();
        
        entity.setUserId(dto.getUserId());
        entity.setUserEmail(dto.getUserEmail());
        entity.setMessId(dto.getMessId());
        entity.setOwnerEmail(dto.getOwnerEmail());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setReason(dto.getReason());
        entity.setMessName(dto.getMessName());
        
        return entity;
    }

    private LeaveApplicationDto convertToDto(LeaveApplication entity) {
        LeaveApplicationDto dto = new LeaveApplicationDto();
        
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setUserEmail(entity.getUserEmail());
        dto.setMessId(entity.getMessId());
        dto.setOwnerEmail(entity.getOwnerEmail());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        dto.setApplicationDate(entity.getApplicationDate());
        dto.setApprovedDate(entity.getApprovedDate());
        dto.setRejectedDate(entity.getRejectedDate());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setMessName(entity.getMessName());
        
        return dto;
    }
} 