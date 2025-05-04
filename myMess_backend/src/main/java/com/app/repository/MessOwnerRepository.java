package com.app.repository;

import com.app.dto.MessOwnerDto;
import com.app.model.MessOwner;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MessOwnerRepository extends MongoRepository<MessOwner,String> {
    Optional<MessOwner> findByEmail(String contact);



    Optional<MessOwner> findById(String id);
}
