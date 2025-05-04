package com.app.service;

import com.app.Utility.Helper;
import com.app.dto.*;
import com.app.exceptions.ResourceNotFoundException;
import com.app.model.MessOwner;
import com.app.model.User;
import com.app.repository.MessOwnerRepository;
import com.app.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;


@Service
public class MessOwnerService {

    Logger logger= LoggerFactory.getLogger(MessOwnerService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessOwnerRepository messOwnerRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public MessOwnerService(MessOwnerRepository messOwnerRepository) {
        this.messOwnerRepository=messOwnerRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }


    /*
        ############## Mess Owner Registration ###########
     */

    public ApiResponse registerMessOwner(MessOwnerRegistrationDto messOwnerRegistrationDto){
        // Check if the user already exists with the given email
        Optional<MessOwner> existingMessOwner = messOwnerRepository.findByEmail(messOwnerRegistrationDto.getEmail());
        if (existingMessOwner.isPresent()) {
            throw new IllegalStateException("Email already in use");
        }

        // Encode the password
        String encodedPassword = passwordEncoder.encode(messOwnerRegistrationDto.getPassword());

        // Create New MessOwner to Store the DTO data
        MessOwner newMessOwner = new MessOwner();
        newMessOwner.setName(messOwnerRegistrationDto.getName());
        newMessOwner.setEmail(messOwnerRegistrationDto.getEmail());
        newMessOwner.setPassword(encodedPassword);
        newMessOwner.setCurrentDate(messOwnerRegistrationDto.getCurrentDate());

        //Optional Fields with default values
        newMessOwner.setMessName(null);
        newMessOwner.setMessAddress(null);
        newMessOwner.setMessType(null);
        newMessOwner.setCapacity(null);
        newMessOwner.setPricePerMeal(null);
        newMessOwner.setSubscriptionPlan(null);



        // Save the MessOwner to the MongoDB database
        messOwnerRepository.save(newMessOwner);
        logger.info("New Mess Register Successfully");

        return new ApiResponse(true, "User Registration Successfully");
    }


    /*
        ############### Find Mess Owner by email ###############
     */
    public MessOwnerDto getMessOwnerByEmail(String email){
        MessOwner messOwner = messOwnerRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Not found !!"));

        return new ModelMapper().map(messOwner,MessOwnerDto.class);
    }


    /*
        ################### Update Mess Owner Details ##################
     */
    public MessOwnerDto updateMessOwner(String email, MessOwnerDto messOwnerDto){


        MessOwner messOwner = messOwnerRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Not Found"));

        if(messOwnerDto.getName()!=null && !messOwnerDto.getName().isBlank()){
            messOwner.setName(messOwnerDto.getName());
        }

        if(messOwnerDto.getMessAddress()!=null && !messOwnerDto.getMessName().isBlank()){
            messOwner.setMessName(messOwnerDto.getMessName());
        }

        if(messOwnerDto.getMessAddress()!=null && !messOwnerDto.getMessAddress().isBlank()){
            messOwner.setMessAddress(messOwnerDto.getMessAddress());
        }
        if(messOwnerDto.getContact()!=null && !messOwnerDto.getContact().isBlank()){
            messOwner.setContact(messOwnerDto.getContact());
        }
        if(messOwnerDto.getMessType()!=null && !messOwnerDto.getMessType().isBlank()){
            messOwner.setMessType(messOwnerDto.getMessType());
        }

        if(messOwnerDto.getCapacity()!=null){
            messOwner.setCapacity(messOwnerDto.getCapacity());
        }

        if(messOwnerDto.getPricePerMeal()!=null){
            messOwner.setPricePerMeal(messOwnerDto.getPricePerMeal());
        }

        if(messOwnerDto.getSubscriptionPlan()!=null){
            messOwner.setSubscriptionPlan(messOwnerDto.getSubscriptionPlan());
        }

        if(messOwnerDto.getImageName() != null && !messOwnerDto.getImageName().isBlank()){
            messOwner.setImageName(messOwnerDto.getImageName());
        }

        if(messOwnerDto.getMessImages() != null){
            messOwner.setMessImages(messOwnerDto.getMessImages());
        }

        if(messOwnerDto.getLongitude()!=null){
            messOwner.setLongitude(messOwnerDto.getLongitude());
        }

        if(messOwnerDto.getLatitude()!=null){
            messOwner.setLatitude(messOwnerDto.getLatitude());
        }

        // Encrypt the password if it's updated


        //Save the updated Mess Owner Details
        MessOwner updatedMessOwner = messOwnerRepository.save(messOwner);

        logger.info("The {} update his mess Information", updatedMessOwner.getName());

        return new ModelMapper().map(messOwner, MessOwnerDto.class);
    }

    /*
        ############# Fetch Users in Mess #################
     */
    public PageableResponse<UserDto> messUsers(String messEmail, int pageNumber, int pageSize, String sortBy, String sortDir){

        Sort sort = (sortDir.equalsIgnoreCase("desc"))? (Sort.by(sortBy).descending()) : (Sort.by(sortBy).ascending());

        Pageable pageable=PageRequest.of(pageNumber,pageSize,sort);

        MessOwner mess = messOwnerRepository.findByEmail(messEmail).orElseThrow(() -> new ResourceNotFoundException("Not found"));

        List<String> joinedUsersEmails = mess.getJoinedUsers();

        Page<User> users = userRepository.findByEmailIn(joinedUsersEmails,pageable);

//        List<UserDto> usersInMess = users.stream().map(user -> new ModelMapper().map(user, UserDto.class)).toList();

//        System.out.println(users);

//        logger.info("");

        return Helper.getPageableResponse(users,UserDto.class);
    }


    /*
        ############## Fetch All Existing Mess ####################
     */
    public List<MessOwnerDto> getAllMess(){
        List<MessOwner> allMess = messOwnerRepository.findAll();

        List<MessOwnerDto> allMessDto = allMess.stream().map(mess -> new ModelMapper().map(mess, MessOwnerDto.class)).toList();
        return allMessDto;
    }

}
