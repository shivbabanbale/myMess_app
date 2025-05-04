package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {
    private boolean success;
    private String message;
    private Object payload;
    
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.payload = null;
    }
}

