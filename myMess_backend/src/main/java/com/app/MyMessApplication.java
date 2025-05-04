package com.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
public class MyMessApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyMessApplication.class, args);
	}

}
