package com.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.app.model.User;

public interface UserRepository extends MongoRepository<User,String> {
    /*
        ######## Custom Method ##########
     */


     Optional<User> findByEmail(String contact);


    Page<User> findByEmailIn(List<String> email, Pageable pageable);
}
