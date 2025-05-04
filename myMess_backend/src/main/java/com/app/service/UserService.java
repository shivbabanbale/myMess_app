package com.app.service;

import com.app.Utility.Helper;
import com.app.dto.ApiResponse;
import com.app.dto.PageableResponse;
import com.app.dto.UserDto;
import com.app.dto.UserRegistrationDto;
import com.app.exceptions.ResourceNotFoundException;
import com.app.model.MessOwner;
import com.app.model.User;
import com.app.repository.MessOwnerRepository;
import com.app.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
public class UserService {


    Logger logger= LoggerFactory.getLogger(UserService.class);

    @Value("${user.profile.picture}")
    private String imagePath;

    @Autowired
    private ModelMapper mapper;

    @Autowired
    private MessOwnerRepository messOwnerRepository;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }


    /*
        ################ new User Registration #################
     */
    public ApiResponse registerUser(UserRegistrationDto registrationDto) {
        // Check if the user already exists with the given email
        Optional<User> existingUser = userRepository.findByEmail(registrationDto.getEmail());
        if (existingUser.isPresent()) {
            throw new IllegalStateException("Email already in use");
        }

        // Encode the password
        String encodedPassword = passwordEncoder.encode(registrationDto.getPassword());

        // Create a new user from the DTO data
        User newUser = new User();
        newUser.setName(registrationDto.getName());
        newUser.setEmail(registrationDto.getEmail());
        newUser.setPassword(encodedPassword);
        newUser.setCurrentDate(registrationDto.getCurrentDate());
        // Set contact to email if it's not provided
        newUser.setContact(registrationDto.getEmail());
        //Optional Fields with default values
        newUser.setGender(null);
        newUser.setAddress(null);
        newUser.setPhoneNumber(null);

        // Save the user to the MongoDB database
        userRepository.save(newUser);
        logger.info("The User is Register Successfully:{}", registrationDto.getName());

        return new ApiResponse(true, "User Registration Successfully");
    }

    /*
        ############## Update User details ##############
     */

    public UserDto updateUserDetails(String email, UserDto userDto) {
        System.out.println(email);
        // Fetch the user by email
        User existingUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Update the fields that are not null
        if (userDto.getName() != null && !userDto.getName().isBlank()){
            existingUser.setName(userDto.getName());
        }

        if (userDto.getAddress() != null && !userDto.getAddress().isBlank()){
            existingUser.setAddress(userDto.getAddress());
        }
        if (userDto.getGender() != null && !userDto.getGender().isBlank()){
            existingUser.setGender(userDto.getGender());
        }

        if(userDto.getImageName() != null && !userDto.getImageName().isBlank()){
            existingUser.setImageName(userDto.getImageName());
        }

        if(userDto.getPhoneNumber() != null && !userDto.getPhoneNumber().isBlank()){
            existingUser.setPhoneNumber(userDto.getPhoneNumber());
        }
        
        // Ensure contact is always set, default to email if empty
        if(userDto.getContact() != null && !userDto.getContact().isBlank()){
            existingUser.setContact(userDto.getContact());
        } else {
            existingUser.setContact(existingUser.getEmail());
        }

        // Save the updated user in the database
        User updatedUser = userRepository.save(existingUser);

        logger.info("User Updated Successfully: {}",existingUser.getName());

        // Map to DTO
        return new ModelMapper().map(updatedUser, UserDto.class);
    }

    /*
        ############# Get Single User by Email ##########
     */
    public UserDto getUserByEmail(String email){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not present by this email"));
        UserDto userDto = mapper.map(user, UserDto.class);
        
        // Ensure contact is never null in the DTO
        if (userDto.getContact() == null || userDto.getContact().isEmpty()) {
            userDto.setContact(user.getEmail());
        }
        
        return userDto;
    }

    /*
        ############## Delete User by Email #############
     */
    public void deleteUserByEmail(String email) {
        User user= userRepository.findByEmail(email).orElseThrow(()-> new ResourceNotFoundException("User Not found"));

        //Delete User Profile picture
        String fullPath = imagePath + user.getImageName();

        try{
            Path path= Paths.get(fullPath);
            Files.delete(path);
        }catch (NoSuchFileException ignored){

        } catch (IOException e) {
            throw new RuntimeException(e);
        }


        //Delete User
        userRepository.delete(user);

        logger.info("{} : Deleted Successfully",user.getName());
    }

    /*
        ############ Get All Users ##############
        ############ Implements Pagination Concept ##############
     */
    public PageableResponse<UserDto> getAllUsers(int pageNumber, int pageSize, String sortBy, String sortDir) {
        

        Sort sort = (sortDir.equalsIgnoreCase("desc"))?(Sort.by(sortBy).descending()):(Sort.by(sortBy).ascending());

        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<User> page = userRepository.findAll(pageable);// Retrieve all users

        return Helper.getPageableResponse(page,UserDto.class); // Return the list of UserDto
    }

    /*
        ############ Get User by Id ############3
     */

    public UserDto getUserById(String id){
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserDto userDto = mapper.map(user, UserDto.class);
        
        // Ensure contact is never null in the DTO
        if (userDto.getContact() == null || userDto.getContact().isEmpty()) {
            userDto.setContact(user.getEmail());
        }
        
        return userDto;
    }


    /*
        ########### Join a Mess ###########
     */
    public ApiResponse joinMess(String userEmail, String messEmail, UserDto userDto) {
        // Fetch the mess by ID
        MessOwner messOwner = messOwnerRepository.findByEmail(messEmail)
                .orElseThrow(() -> new IllegalStateException("Mess not found"));

        // Fetch the user by ID
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Check if user is already in the joinedUsers list
        if (messOwner.getJoinedUsers().contains(userEmail)) {
            throw new IllegalStateException("User has already joined this mess");
        }

        // Check if mess has capacity
        if (messOwner.getCapacity() <= 0) {
            throw new IllegalStateException("Mess capacity is full");
        }

        // Add the user ID to the joinedUsers list
        messOwner.getJoinedUsers().add(userEmail);

        // Decrement the mess's capacity
        messOwner.setCapacity(messOwner.getCapacity() - 1);


        //Update User Join Details
        user.setMessName(messOwner.getMessName());
        user.setJoinDate(userDto.getJoinDate());
        user.setSubscriptionPlan(userDto.getSubscriptionPlan());
        user.setFoodType(userDto.getFoodType());


        // Save the updated messOwner to the database
        messOwnerRepository.save(messOwner);

        // Optionally update the user document with the messId
        user.setMessId(messOwner.getId());
        userRepository.save(user);

        logger.info("The {} User is Join {} Mess", user.getName(), messOwner.getMessName());

        return new ApiResponse(true, "User successfully joined the mess");
    }


}
