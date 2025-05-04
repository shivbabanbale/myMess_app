package com.app.controllers;

import com.app.dto.*;
import com.app.jwt.JwtUtil;
import com.app.model.User;
import com.app.repository.UserRepository;
import com.app.service.FileService;
import com.app.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;


@RestController
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Autowired
    private FileService fileService;

    @Value("${user.profile.picture}")
    private String imagePath;


    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    /*
        ############ User Registration ############
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto) {
        try {
            ApiResponse response = userService.registerUser(registrationDto);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            ApiResponse apiResponse = new ApiResponse(false, e.getMessage());
            return ResponseEntity.badRequest().body(apiResponse);
        }
    }

    /*
        ############# Update User by Email #############
     */

    @PutMapping("/update/{email}")
    public ResponseEntity<UserDto> updateUserDetails(@PathVariable String email, @Valid @RequestBody UserDto userDto){
        System.out.println(email);
        UserDto newUserDto = userService.updateUserDetails(email, userDto);
        return new ResponseEntity<>(newUserDto, HttpStatus.OK);
    }

    /*
        ########## Get user by Email ########
     */

    @GetMapping("/byEmail/{email}")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email){
        System.out.println("The Email is: "+email);
        UserDto userByEmail = userService.getUserByEmail(email);
        return new ResponseEntity<>(userByEmail,HttpStatus.OK);
    }

    /*
        ########### Delete User by Email ##############
     */

    @DeleteMapping("/byEmail/{email}")
    public ResponseEntity deleteUserByEmail(@PathVariable String email)  {
        userService.deleteUserByEmail(email);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    /*
        ############## Get All Users #############
     */

    @GetMapping("/getAll")
    public ResponseEntity<PageableResponse<UserDto>> getAllUser(
            @RequestParam(value = "pageNumber", defaultValue = "0", required = false) int pageNumber,
            @RequestParam(value = "pageSize", defaultValue = "5", required = false) int pageSize,
            @RequestParam(value = "sortBy",defaultValue = "name", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc", required = false) String sortDir
    ){
        PageableResponse<UserDto> response = userService.getAllUsers(pageNumber, pageSize, sortBy, sortDir);
        return new ResponseEntity<>(response,HttpStatus.OK);
    }

    /*
        ############# Get User by Id #############
     */

    @GetMapping("/byId/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable  String id){
        UserDto userById = userService.getUserById(id);
        return new ResponseEntity<>(userById,HttpStatus.OK);
    }


    /*
        ################ Upload Profile Picture ##############
     */

    @PostMapping("/profile/{email}")
    public ResponseEntity<ImageUploadedResponse> uploadProfilePicture(
            @RequestParam("image") MultipartFile file,
            @PathVariable String email) throws IOException {

        String imageName=fileService.fileUpload(file,imagePath);

        UserDto userById = userService.getUserByEmail(email);

        userById.setImageName(imageName);

        UserDto userDto = userService.updateUserDetails(email, userById);

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
        try {
            UserDto userByEmail = userService.getUserByEmail(email);

            // Check if imageName is null and provide a default image
            String imageName = userByEmail.getImageName() != null ? userByEmail.getImageName() : "default-profile.jpg";

            // Fetch the image file
            InputStream inputStream = fileService.serveFile(imagePath, imageName);

            // Set content type based on the file's MIME type
            String contentType = Files.probeContentType(Paths.get(imagePath, imageName));
            response.setContentType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE);

            // Copy the image stream to the response output stream
            StreamUtils.copy(inputStream, response.getOutputStream());
        } catch (FileNotFoundException e) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Image not found");
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An error occurred while serving the image");
        }
    }



    /*
        #################### Join Mess ################
     */
    @PostMapping("/joinMess/{userEmail}/{messEmail}")
    public ResponseEntity<ApiResponse> joinMess(
            @PathVariable String userEmail,
            @PathVariable String messEmail,
            @RequestBody UserDto userDto
    ) {
        try {
            ApiResponse apiResponse = userService.joinMess(userEmail, messEmail,userDto);
            return ResponseEntity.ok(apiResponse);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return new ResponseEntity<>(new ApiResponse(false, "Not Join"), HttpStatus.NOT_FOUND);
        }
    }


    @GetMapping("/token")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract the token from the Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header.");
            }
            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Validate the token
            String contact = jwtUtil.generateToken(token);
            if (contact == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token.");
            }

            // Fetch user details using the contact
            Optional<User> user = userRepository.findByEmail(contact);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get()); // Return user details as JSON
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + e.getMessage());
        }
    }
}

