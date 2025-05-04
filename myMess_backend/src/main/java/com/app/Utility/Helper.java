package com.app.Utility;

import com.app.dto.PageableResponse;
import com.app.dto.UserDto;
import com.app.model.User;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.stream.Collectors;

public class Helper {

    public static <U,V> PageableResponse<V> getPageableResponse(Page<U> page, Class<V> type){
        List<U> entity = page.getContent();
        
        // Check if we're mapping User to UserDto to handle contact field
        if (type.equals(UserDto.class) && !entity.isEmpty() && entity.get(0) instanceof User) {
            // Special handling for User to UserDto mapping
            List<V> userDtoContent = entity.stream()
                .map(object -> {
                    User user = (User) object;
                    UserDto dto = new ModelMapper().map(user, UserDto.class);
                    
                    // Ensure contact is never null in the DTO
                    if (dto.getContact() == null || dto.getContact().isEmpty()) {
                        dto.setContact(user.getEmail());
                    }
                    
                    return (V) dto;
                })
                .collect(Collectors.toList());
                
            PageableResponse<V> pageableResponse = new PageableResponse<>();
            pageableResponse.setContent(userDtoContent);
            pageableResponse.setPageNumber(page.getNumber());
            pageableResponse.setPageSize(page.getSize());
            pageableResponse.setTotalElement(page.getTotalPages());
            pageableResponse.setTotalPages(page.getTotalPages());
            pageableResponse.setLastPage(page.isLast());
            
            return pageableResponse;
        } else {
            // Default handling for other types
            List<V> dtoContent = entity.stream()
                .map(object -> new ModelMapper().map(object, type))
                .collect(Collectors.toList());
                
            PageableResponse<V> pageableResponse = new PageableResponse<>();
            pageableResponse.setContent(dtoContent);
            pageableResponse.setPageNumber(page.getNumber());
            pageableResponse.setPageSize(page.getSize());
            pageableResponse.setTotalElement(page.getTotalPages());
            pageableResponse.setTotalPages(page.getTotalPages());
            pageableResponse.setLastPage(page.isLast());
            
            return pageableResponse;
        }
    }
}
