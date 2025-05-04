package com.app.service.impl;

import com.app.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private Logger logger= LoggerFactory.getLogger(FileServiceImpl.class);

    @Override
    public String fileUpload(MultipartFile file, String path) throws IOException {

        //Get Original File name
        String originalFilename = file.getOriginalFilename();
        logger.info("The Original File Name is: {}",originalFilename);

        //Get the Extension of File
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        logger.info("The Extension of File is: {}",extension);

        //Generate Random file name
        String randomName= UUID.randomUUID().toString();

        //Combine the random File name with the original Extension
        String finalFileName=randomName+extension;

        //Get the Full Path
        String fullPathWithFileName = path + finalFileName;

        //Create the Folder by the Given Path if the folder is not exist
        File folder=new File(path);
        if(!folder.exists()){
            folder.mkdirs();
        }

        //Save the inputStream File date to our Path
        Files.copy(file.getInputStream(), Paths.get(fullPathWithFileName));

        return finalFileName;
    }

    @Override
    public InputStream serveFile(String path, String imageName) throws FileNotFoundException {
        String fullPath=path+imageName;

        InputStream inputStream=new FileInputStream(fullPath);
        return inputStream;
    }
}
