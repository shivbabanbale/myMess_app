package com.app.service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    String fileUpload(MultipartFile file, String path) throws IOException;
    InputStream serveFile(String path, String imageName) throws FileNotFoundException;
}
