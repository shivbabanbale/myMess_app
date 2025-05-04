package com.app.controllers;

import com.app.dto.*;
import com.app.model.MessOwner;
import com.app.repository.MessOwnerRepository;
import com.app.service.FileService;
import com.app.service.MessOwnerService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
@RestController
@RequestMapping("/mess")
public class MessOwnerController {

    @Value("${mess.profile.picture}")
    private String imagePath;

    @Autowired
    private FileService fileService;

    @Autowired
    private MessOwnerService messOwnerService;

    @Autowired
    private MessOwnerRepository messOwnerRepository;

    @PostMapping("/registerOwner")
    public ResponseEntity<ApiResponse> messOwnerRegistration(@Valid @RequestBody MessOwnerRegistrationDto messOwnerRegistrationDto){
        try {
            ApiResponse response = messOwnerService.registerMessOwner(messOwnerRegistrationDto);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            ApiResponse apiResponse = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    /*
        Update the Mess Owner Details
     */
    @PutMapping("/update/{email}")
    public ResponseEntity<MessOwnerDto> updateMessOwner(@PathVariable String email, @RequestBody MessOwnerDto messOwnerDto){
        MessOwnerDto messOwnerDto1 = messOwnerService.updateMessOwner(email, messOwnerDto);

        return new ResponseEntity<>(messOwnerDto1,HttpStatus.OK);
    }

    /*
        ################ Get User in Mess ##############
     */
    @GetMapping("/getUsers/{messId}")
    public ResponseEntity<PageableResponse<UserDto>> getUsers(
            @PathVariable String messId,
            @RequestParam(value = "pageNumber", defaultValue = "0", required = false) int pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "5", required = false) int pageSize,
            @RequestParam(value = "sortBy",defaultValue = "name", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc", required = false) String sortDir
    ){

        PageableResponse<UserDto> userDtoStream = messOwnerService.messUsers(messId,pageNumber,pageSize,sortBy,sortDir);

        return new ResponseEntity<>(userDtoStream, HttpStatus.OK);
    }


     /*
        ################ Upload Profile Picture ##############
     */

    @PostMapping("/profile/{email}")
    public ResponseEntity<ImageUploadedResponse> uploadProfilePicture(
            @RequestParam("image") MultipartFile file,
            @PathVariable String email) throws IOException {

        String imageName=fileService.fileUpload(file,imagePath);

        MessOwnerDto messOwnerByEmail = messOwnerService.getMessOwnerByEmail(email);

        messOwnerByEmail.setImageName(imageName);

        MessOwnerDto messOwnerDto = messOwnerService.updateMessOwner(email, messOwnerByEmail);

        ImageUploadedResponse imageUploadedResponse = ImageUploadedResponse.builder()
                .imageName(imageName)
                .message("Profile Picture Successfully uploaded")
                .success(true)
                .build();


        return new ResponseEntity<>(imageUploadedResponse,HttpStatus.OK);
    }


    /*
       ############### Serve the Profile Picture ################
    */
    @GetMapping("/profile/{email}")
    public void serveProfilePicture(@PathVariable String email, HttpServletResponse response) throws IOException {
        MessOwnerDto messOwnerByEmail = messOwnerService.getMessOwnerByEmail(email);

        InputStream inputStream = fileService.serveFile(imagePath, messOwnerByEmail.getImageName());
        response.setContentType(MediaType.IMAGE_JPEG_VALUE);

        StreamUtils.copy(inputStream, response.getOutputStream());
    }


    /*
        ############## Upload Multiple Mess Images ###############
     */
    @PostMapping("/images/{email}")
    public ResponseEntity<ImageUploadedResponse> uploadMessImages(
            @RequestParam("images") List<MultipartFile> files,
            @PathVariable String email) throws IOException {

        MessOwnerDto messOwner = messOwnerService.getMessOwnerByEmail(email);

        List<String> imagesNames=new ArrayList<>();

        for (MultipartFile file : files){
            String imageName = fileService.fileUpload(file, imagePath);
            imagesNames.add(imageName);
        }

        List<String> existingMessImages = messOwner.getMessImages();
        if(existingMessImages==null){
            existingMessImages=new ArrayList<>();
        }

        existingMessImages.addAll(imagesNames);
        messOwner.setMessImages(existingMessImages);

        messOwnerService.updateMessOwner(email,messOwner);
        ImageUploadedResponse build = ImageUploadedResponse.builder()
                .imagesNames(imagesNames)
                .message(imagesNames + "are Uploaded Successfully")
                .success(true)
                .build();
        return new ResponseEntity<>(build,HttpStatus.OK);
    }

    /*
        #################### Serve Multiple Mess Images ################
     */
    @GetMapping("/images/{email}")
    public ResponseEntity<List<String>> getMessImages(@PathVariable String email) {
        MessOwnerDto messOwnerByEmail = messOwnerService.getMessOwnerByEmail(email);

        if (messOwnerByEmail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        List<String> messImages = messOwnerByEmail.getMessImages();
        System.out.println(messImages);

        if (messImages == null || messImages.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body(null);
        }
        System.out.println(messImages);

        // Construct URLs for each image using the new endpoint
        List<String> imageUrls = messImages.stream()
                .map(imageName -> "http://localhost:8080/mess/image/" + imageName)
                .toList();

        return ResponseEntity.ok(imageUrls);
    }

    /*
        #################### Get Actual Image Files From Directory ################
     */
    @GetMapping("/actual-images")
    public ResponseEntity<List<String>> getActualImageFiles() {
        try {
            // Get the actual files from the mess images directory
            File messImagesDir = new File(imagePath);
            if (!messImagesDir.exists() || !messImagesDir.isDirectory()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(List.of("Directory not found: " + imagePath));
            }
            
            // Get all jpg files
            File[] imageFiles = messImagesDir.listFiles((dir, name) -> 
                    name.toLowerCase().endsWith(".jpg") || 
                    name.toLowerCase().endsWith(".jpeg") || 
                    name.toLowerCase().endsWith(".png"));
            
            if (imageFiles == null || imageFiles.length == 0) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT)
                        .body(List.of("No image files found in " + imagePath));
            }
            
            // Convert to URLs
            List<String> imageUrls = Arrays.stream(imageFiles)
                    .map(file -> "http://localhost:8080/mess/image/" + file.getName())
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(imageUrls);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("Error accessing image directory: " + e.getMessage()));
        }
    }

    /*
        #################### Serve Individual Mess Image by Filename ################
     */
    @GetMapping("/image/{imageName}")
    public void serveMessImage(@PathVariable String imageName, HttpServletResponse response) throws IOException {
        try {
            // Fetch the image file from the mess images directory
            InputStream inputStream = fileService.serveFile(imagePath, imageName);
            
            // Set content type
            response.setContentType(MediaType.IMAGE_JPEG_VALUE);
            
            // Copy the image stream to the response output stream
            StreamUtils.copy(inputStream, response.getOutputStream());
        } catch (FileNotFoundException e) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Image not found: " + imageName);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, 
                    "An error occurred while serving the image: " + e.getMessage());
        }
    }

    /*
        ############### Get All Existing Mess ##############
     */
    @GetMapping("/getAll")
    public ResponseEntity<List<MessOwnerDto>> getAllMess(){
        List<MessOwnerDto> allMess = messOwnerService.getAllMess();

        return new ResponseEntity<>(allMess,HttpStatus.OK);
    }


    /*
        ##########  Get mess by ID #########
     */
    @GetMapping("/getById/{id}")
    public ResponseEntity<MessOwnerDto> getById(@PathVariable String id){
        MessOwner byId = messOwnerRepository.findById(id).orElseThrow(()->new RuntimeException("Mess not found"));

        MessOwnerDto map = new ModelMapper().map(byId, MessOwnerDto.class);

        return new ResponseEntity<>(map,HttpStatus.OK);
    }


    /*
        ################## Get MessOwner by mail #############
     */
    @GetMapping("/getByEmail/{email}")
    public ResponseEntity<MessOwnerDto> getByEmail(@PathVariable String email){

        System.out.println(email);

        MessOwnerDto byContact = messOwnerService.getMessOwnerByEmail(email);

        MessOwnerDto map = new ModelMapper().map(byContact, MessOwnerDto.class);

        return new ResponseEntity<>(map,HttpStatus.OK);
    }

    /*
        ################## Get Nearby Messes based on location #############
     */
    @GetMapping("/getNearby")
    public ResponseEntity<List<MessOwnerDto>> getNearbyMesses(
            @RequestParam(value = "latitude") Double userLatitude,
            @RequestParam(value = "longitude") Double userLongitude,
            @RequestParam(value = "radius", defaultValue = "5.0") Double radiusInKm) {
        
        List<MessOwnerDto> allMesses = messOwnerService.getAllMess();
        List<MessOwnerDto> nearbyMesses = new ArrayList<>();
        
        for (MessOwnerDto mess : allMesses) {
            if (mess.getLatitude() != null && mess.getLongitude() != null) {
                double distance = calculateDistance(
                    userLatitude, userLongitude, 
                    mess.getLatitude(), mess.getLongitude()
                );
                
                // Add distance to the DTO for client-side sorting
                mess.setDistance(distance);
                
                // If distance is within the radius, add it to the result
                if (distance <= radiusInKm) {
                    nearbyMesses.add(mess);
                }
            }
        }
        
        // Sort by distance
        nearbyMesses.sort((a, b) -> Double.compare(a.getDistance(), b.getDistance()));
        
        return new ResponseEntity<>(nearbyMesses, HttpStatus.OK);
    }
    
    /**
     * Calculate distance between two locations using Haversine formula
     * @return distance in kilometers
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

}
