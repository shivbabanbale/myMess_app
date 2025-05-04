package com.app.dto;

import lombok.*;

import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageUploadedResponse {
    private List<String> imagesNames;
    private String imageName;
    private String message;
    private boolean success;

}
