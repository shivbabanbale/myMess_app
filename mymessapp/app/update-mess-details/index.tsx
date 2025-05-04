import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// API base URL - using the device's network settings to reach the backend
// Warning: 10.0.2.2 is for Android emulators to reach host machine's localhost 
// For iOS simulators, use localhost or host machine's actual local IP
// For physical devices, use the host machine's IP address or domain name
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080'         // For Android emulator
  : 'http://localhost:8080';       // For iOS simulator
  
// If accessing from physical device, use your computer's actual IP address, e.g.:
// const API_BASE_URL = 'http://192.168.1.5:8080'; 

// Define an interface for the image upload response
interface ImageUploadedResponse {
  imagesNames?: string[] | null;
  imageName?: string;
  message: string;
  success: boolean;
}

const UpdateMessDetails = () => {
  // Get email from URL params
  const { email: urlEmail } = useLocalSearchParams<{ email: string }>();
  
  // Form fields based on MessOwnerDto
  const [name, setName] = useState('John Doe');
  const [contact, setContact] = useState(''); // Empty string initially
  const [messName, setMessName] = useState('Delicious Mess');
  const [messAddress, setMessAddress] = useState('123 College Road, Pune');
  const [messType, setMessType] = useState('Veg'); // Default to 'Veg'
  const [capacity, setCapacity] = useState('50');
  const [pricePerMeal, setPricePerMeal] = useState('80');
  const [subscriptionPlan, setSubscriptionPlan] = useState('30');
  const [latitude, setLatitude] = useState('18.5204');
  const [longitude, setLongitude] = useState('73.8567');
  
  // Image states
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [messImages, setMessImages] = useState(Array(3).fill(''));
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingMessPhoto, setIsUploadingMessPhoto] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(-1);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Location states
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Add state for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    // Request permission for photo library access
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload photos.');
      }
    })();

    // Fetch user email and load mess details
    loadUserEmail();
  }, []);

  // Load user email from AsyncStorage and fetch initial mess data
  const loadUserEmail = async () => {
    try {
      // First try to get email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      
      // If not found in AsyncStorage, use the one from URL params
      const finalEmail = email || urlEmail;
      
      if (finalEmail) {
        setUserEmail(finalEmail);
        fetchMessDetails(finalEmail);
      } else {
        setError('User email not found. Please log in again.');
      }
    } catch (error) {
      console.error('Error loading user email:', error);
      setError('Failed to load user data');
    }
  };

  // Fetch mess images from the server
  const fetchMessImages = async (email: string, imageNames: string[] = []) => {
    try {
      // First try to get images from the actual-images endpoint
      const actualImagesResponse = await axios.get(`${API_BASE_URL}/mess/actual-images`);
      
      if (actualImagesResponse.status === 200 && actualImagesResponse.data && Array.isArray(actualImagesResponse.data)) {
        // We have actual images from the server's filesystem
        const imageUrls = actualImagesResponse.data;
        
        // Use the first 3 image URLs or fill remaining with empty strings
        const updatedImages = [];
        for (let i = 0; i < 3; i++) {
          if (i < imageUrls.length) {
            updatedImages.push(imageUrls[i]);
          } else {
            updatedImages.push('');
          }
        }
        
        setMessImages(updatedImages);
        return;
      }
      
      // Fallback to the old method if actual-images fails
      // Create an array to hold promises for image fetching
      const imagePromises = imageNames.map((imageName, index) => {
        if (!imageName) return Promise.resolve('');
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const imageUrl = `${API_BASE_URL}/images/mess/${imageName}?t=${timestamp}`;
        
        return axios.get(imageUrl, { responseType: 'blob' })
          .then(response => {
            if (response.status === 200 && response.data.size > 0) {
              return imageUrl;
            }
            return '';
          })
          .catch(() => {
            return '';
          });
      });
      
      // Fill with empty strings if there are less than 3 images
      while (imagePromises.length < 3) {
        imagePromises.push(Promise.resolve(''));
      }
      
      // Wait for all image checks to complete
      Promise.all(imagePromises)
        .then(imageUrls => {
          setMessImages(imageUrls.slice(0, 3));
        })
        .catch(error => {
          console.error('Error fetching mess images:', error);
          setMessImages(Array(3).fill(''));
        });
    } catch (error) {
      console.error('Error in fetchMessImages:', error);
      setMessImages(Array(3).fill(''));
    }
  };

  // Fetch mess details from the API
  const fetchMessDetails = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/mess/getByEmail/${email}`);
      
      if (response.data) {
        const messData = response.data;
        
        // Update state with fetched data
        setName(messData.name || '');
        // Set contact to the mess owner's email if it's not already set in the backend
        setContact(messData.contact || email);
        setMessName(messData.messName || '');
        setMessAddress(messData.messAddress || '');
        setMessType(messData.messType || 'Veg');
        setCapacity(messData.capacity ? messData.capacity.toString() : '');
        setPricePerMeal(messData.pricePerMeal ? messData.pricePerMeal.toString() : '');
        setSubscriptionPlan(messData.subscriptionPlan ? messData.subscriptionPlan.toString() : '');
        setLatitude(messData.latitude ? messData.latitude.toString() : '');
        setLongitude(messData.longitude ? messData.longitude.toString() : '');
        
        // Fetch profile image if available
        if (messData.imageName) {
          fetchProfileImage(email);
        }
        
        // Fetch mess images if available
        if (messData.messImages && messData.messImages.length > 0) {
          fetchMessImages(email, messData.messImages);
        } else {
          setMessImages(Array(3).fill(''));
        }
      }
    } catch (error) {
      console.error('Error fetching mess details:', error);
      setError('Failed to load mess details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile image from the server
  const fetchProfileImage = (email: string) => {
    // Force a fresh image by adding a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const imageUrl = `${API_BASE_URL}/mess/profile/${email}?t=${timestamp}`;
    
    // Check if the image exists
    axios.get(imageUrl, { responseType: 'blob' })
      .then(response => {
        if (response.status === 200 && response.data.size > 0) {
          setProfileImage(imageUrl);
        }
      })
      .catch(error => {
        console.log('No profile image found or error fetching:', error);
        // Keep the default placeholder image
      });
  };

  // Upload profile image
  const uploadProfileImage = async (imageUri: string): Promise<ImageUploadedResponse> => {
    try {
      console.log('Starting profile image upload process for:', imageUri.substring(0, 50) + '...');
      
      // Create a form data object to send the image
      const formData = new FormData();
      
      // Check if the URI is a base64 data URI
      const isBase64 = imageUri.startsWith('data:');
      
      if (isBase64) {
        console.log('Detected base64 image data, converting to file...');
        
        try {
          // For base64 images from expo-image-picker on web
          // Extract the MIME type and base64 data
          const matches = imageUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          
          if (!matches || matches.length !== 3) {
            console.error('Invalid base64 image format');
            throw new Error('Invalid base64 image data');
          }
          
          const mimeType = matches[1];
          const base64Data = matches[2];
          
          // Validate base64 data
          if (base64Data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
            console.error('Malformed base64 data');
            throw new Error('Malformed base64 data');
          }
          
          // Generate a filename with proper extension
          let extension = 'jpg';
          if (mimeType === 'image/png') {
            extension = 'png';
          } else if (mimeType === 'image/gif') {
            extension = 'gif';
          }
          
          const filename = `profile_${new Date().getTime()}.${extension}`;
          console.log('Using generated filename:', filename);
          
          // Create a blob from base64 data (for web)
          if (Platform.OS === 'web') {
            try {
              const byteCharacters = atob(base64Data);
              const byteArrays = [];
              
              for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                  byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
              }
              
              const blob = new Blob(byteArrays, { type: mimeType });
              // @ts-ignore - TypeScript doesn't recognize the blob field but it works for web
              formData.append('image', blob, filename);
              console.log('Created blob from base64 data for web upload');
            } catch (error) {
              console.error('Error creating blob from base64:', error);
              throw new Error('Failed to process image data');
            }
          } else {
            // For React Native, we can use the base64 data directly
            // @ts-ignore - TypeScript doesn't like this format but it works
            formData.append('image', {
              uri: imageUri,
              name: filename,
              type: mimeType
            });
          }
        } catch (error) {
          console.error('Error processing base64 image:', error);
          throw new Error('Failed to process image: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else {
        // Process regular file URI (non-base64)
        // Extract filename from URI
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        console.log('Using filename:', filename);
        
        // For React Native local file URIs
        let fileUriToUse = imageUri;
        if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
          fileUriToUse = imageUri.replace('file://', '');
          console.log('Adjusted iOS file URI:', fileUriToUse);
        }
        
        // Determine correct MIME type for JPG files
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        }
        console.log('Using MIME type:', mimeType);
        
        // Create file object exactly matching curl format
        const fileObject = {
          uri: fileUriToUse,
          name: filename,
          type: mimeType, // Use detected MIME type
        };
        
        console.log('File object for upload:', JSON.stringify(fileObject));
        
        // Just use "image" as the form field name to match @RequestParam("image")
        // @ts-ignore - TypeScript doesn't like the object format but it's required for React Native
        formData.append('image', fileObject);
      }
      
      // Direct URL to profile endpoint - exactly matching curl command format
      const url = `${API_BASE_URL}/mess/profile/${userEmail}`;
      console.log('Image upload URL:', url);
      
      // Test with XMLHttpRequest for better debugging
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload successful! Response:', xhr.responseText);
            try {
              const response = JSON.parse(xhr.responseText) as ImageUploadedResponse;
              resolve(response);
            } catch (e) {
              console.error('Error parsing response:', e);
              resolve({ 
                success: true,
                message: 'Upload successful but response could not be parsed'
              } as ImageUploadedResponse);
            }
          } else {
            console.error('Upload failed with status:', xhr.status, xhr.statusText);
            console.error('Response text:', xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = function() {
          console.error('XHR error during upload');
          reject(new Error('Network error during upload'));
        };
        
        xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`Upload progress: ${percentComplete}%`);
          }
        };
        
        xhr.send(formData);
        console.log('Upload request sent');
      });
    } catch (error: any) {
      console.error('Error preparing image upload:', error);
      Alert.alert('Upload Failed', `Could not upload profile image: ${error.message}`);
      throw error;
    }
  };
  
  // Upload mess image
  const uploadMessImage = async (imageUri: string, index: number): Promise<ImageUploadedResponse> => {
    try {
      // Create a form data object to send the image
      const formData = new FormData();
      
      // Check if the URI is a base64 data URI
      const isBase64 = imageUri.startsWith('data:');
      
      if (isBase64) {
        // For base64 images from expo-image-picker on web
        // Extract the MIME type and base64 data
        const matches = imageUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid base64 image data');
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Validate base64 data
        if (base64Data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
          throw new Error('Malformed base64 data');
        }
        
        // Generate a filename with proper extension
        let extension = 'jpg';
        if (mimeType === 'image/png') {
          extension = 'png';
        } else if (mimeType === 'image/gif') {
          extension = 'gif';
        }
        
        const filename = `mess_${index}_${new Date().getTime()}.${extension}`;
        
        // Create a blob from base64 data (for web)
        if (Platform.OS === 'web') {
          try {
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: mimeType });
            // @ts-ignore - TypeScript doesn't recognize the blob field but it works for web
            formData.append('images', blob, filename);
          } catch (error) {
            throw new Error('Failed to process image data');
          }
        } else {
          // For React Native, we can use the base64 data directly
          // @ts-ignore - TypeScript doesn't like this format but it works
          formData.append('images', {
            uri: imageUri,
            name: filename,
            type: mimeType
          });
        }
      } else {
        // Process regular file URI (non-base64)
        // Extract filename from URI
        const filename = imageUri.split('/').pop() || `mess_${index}.jpg`;
        
        // For React Native local file URIs
        let fileUriToUse = imageUri;
        if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
          fileUriToUse = imageUri.replace('file://', '');
        }
        
        // Determine correct MIME type for JPG files
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        }
        
        // Create file object exactly matching curl format
        const fileObject = {
          uri: fileUriToUse,
          name: filename,
          type: mimeType, // Use detected MIME type
        };
        
        // Use "images" as the form field name to match @RequestParam("images")
        // @ts-ignore - TypeScript doesn't like the object format but it's required for React Native
        formData.append('images', fileObject);
      }
      
      // Direct URL to mess images endpoint
      const url = `${API_BASE_URL}/mess/images/${userEmail}`;
      
      // Use XMLHttpRequest for better debugging and progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText) as ImageUploadedResponse;
              resolve(response);
            } catch (e) {
              resolve({ 
                success: true,
                message: 'Upload successful but response could not be parsed'
              } as ImageUploadedResponse);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error during upload'));
        };
        
        xhr.upload.onprogress = function(event) {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
          }
        };
        
        xhr.send(formData);
      });
    } catch (error: any) {
      Alert.alert('Upload Failed', `Could not upload mess image: ${error.message}`);
      throw error;
    }
  };

  // Profile photo picker
  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true, // Request base64 data for web compatibility
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setProfileImage(selectedImageUri);
        
        try {
          setIsUploadingProfile(true);
          // Upload the selected image
          const response = await uploadProfileImage(selectedImageUri);
          console.log('Upload response:', response);
          
          if (response && response.success) {
            // Update the image in the UI with a timestamp to prevent caching
            const timestamp = new Date().getTime();
            setProfileImage(`${API_BASE_URL}/mess/profile/${userEmail}?t=${timestamp}`);
            Alert.alert('Success', 'Profile photo updated successfully');
          }
        } catch (error) {
          console.error('Error in upload:', error);
          setError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsUploadingProfile(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Mess photo picker
  const pickMessImage = async (index: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true, // Request base64 data for web compatibility
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        
        // Update UI immediately to show selected image
        const newImages = [...messImages];
        newImages[index] = selectedImageUri;
        setMessImages(newImages);
        
        try {
          setIsUploadingMessPhoto(true);
          setUploadingPhotoIndex(index);
          
          // Upload the mess image
          const response = await uploadMessImage(selectedImageUri, index);
          
          if (response && response.success) {
            // Fetch the updated mess images after successful upload
            // This ensures we're showing the actual server images
            await fetchMessImages(userEmail);
            Alert.alert('Success', 'Mess photo uploaded successfully');
          }
        } catch (error) {
          console.error('Error in upload:', error);
          setError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Revert to empty image on failure
          const updatedImages = [...messImages];
          updatedImages[index] = '';
          setMessImages(updatedImages);
        } finally {
          setIsUploadingMessPhoto(false);
          setUploadingPhotoIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Update the mess details
  const handleUpdateMess = async () => {
    try {
      if (!messName || !messAddress || !messType || !capacity || !pricePerMeal || !subscriptionPlan) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }
      
      if (!userEmail) {
        Alert.alert('Error', 'User email not found. Please log in again.');
        return;
      }
      
      // Ensure contact is set to userEmail if it's empty
      if (!contact || contact.trim() === '') {
        setContact(userEmail);
      }
      
      console.log('Updating mess with email:', userEmail);
      setIsLoading(true);
      setError('');
      
      // Create payload for update API
      const updateData = {
        name,
        contact: contact || userEmail, // Always include a valid contact email
        messName,
        messAddress,
        messType,
        capacity: parseInt(capacity, 10),
        pricePerMeal: parseInt(pricePerMeal, 10),
        subscriptionPlan: parseInt(subscriptionPlan, 10),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      };
      
      console.log('Update payload:', updateData);
      
      // Call the update API
      const response = await axios.put(
        `${API_BASE_URL}/mess/update/${userEmail}`, 
        updateData
      );
      
      console.log('Update response:', response.status, response.data);
      
      if (response.status === 200) {
        // Show success popup instead of Alert
        setShowSuccessPopup(true);
        
        // Auto navigate after 2 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
          router.push('/(owner)'); // Navigate to owner home screen
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating mess details:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        setError(`Failed to update: ${error.response.status} ${error.response.statusText}`);
      } else {
        setError('Failed to update mess details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render the mess photos grid with delete option
  const renderMessPhotos = () => {
    return (
      <View style={styles.messPhotoGrid}>
        {messImages.map((image, index) => (
          <View key={index} style={styles.photoContainer}>
            <TouchableOpacity 
              style={styles.photoPlaceholder} 
              onPress={() => pickMessImage(index)}
              disabled={isUploadingMessPhoto}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.messPhoto} />
              ) : (
                <Text style={styles.addPhotoText}>+</Text>
              )}
              
              {isUploadingMessPhoto && uploadingPhotoIndex === index && (
                <View style={styles.photoLoadingOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
            
            {image && (
              <TouchableOpacity 
                style={styles.deletePhotoButton}
                onPress={() => clearMessImage(index)}
                disabled={isUploadingMessPhoto}
              >
                <Text style={styles.deletePhotoText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };
  
  // Function to clear a mess image
  const clearMessImage = (index: number) => {
    // Update the UI first
    const updatedImages = [...messImages];
    updatedImages[index] = '';
    setMessImages(updatedImages);
    
    // We don't actually delete the image from the server, just remove it from our UI
    // A proper implementation would have a backend endpoint to remove images
    Alert.alert('Image Removed', 'The image has been removed from your gallery view.');
  };

  // Get current location from device
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');
    
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Update latitude and longitude
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      
      // Show success message
      Alert.alert(
        'Location Updated',
        'Your current location has been set successfully.'
      );
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && !userEmail ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading mess details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Mess Details</Text>
            <Text style={styles.subtitle}>Update your mess information to attract more customers</Text>
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ You can now update both mess details and photos. Tap on any photo to change it.
            </Text>
          </View>
          
          <View style={styles.photoCard}>
            <View style={styles.profilePhotoContainer}>
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profilePhoto} 
              />
              {isUploadingProfile ? (
                <View style={[styles.photoOverlay, styles.photoLoadingOverlay]}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.photoLoadingText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.photoOverlay}>
                  <TouchableOpacity onPress={pickProfileImage}>
                    <Text style={styles.photoText}>Update Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.photoHelpText}>
              Upload a clear photo of your mess to help customers recognize it
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact</Text>
              <TextInput
                style={styles.input}
                value={contact}
                onChangeText={setContact}
                placeholder="Contact Number"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mess Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mess Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={messName}
                onChangeText={setMessName}
                placeholder="Mess Name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mess Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={messAddress}
                onChangeText={setMessAddress}
                placeholder="Full Mess Address"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mess Type <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={messType}
                  onValueChange={(itemValue) => setMessType(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Vegetarian" value="Veg" />
                  <Picker.Item label="Non-Vegetarian" value="Non-Veg" />
                  <Picker.Item label="Both (Veg & Non-Veg)" value="Both" />
                </Picker>
              </View>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Capacity & Pricing</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacity (no. of people) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="Maximum Capacity"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price Per Meal (₹) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={pricePerMeal}
                onChangeText={setPricePerMeal}
                placeholder="Price Per Meal"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subscription Plan (Days) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={subscriptionPlan}
                onChangeText={setSubscriptionPlan}
                placeholder="Number of Days"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Location (Optional)</Text>
            
            <View style={styles.locationHeader}>
              <Text style={styles.locationSubtitle}>Mess Coordinates</Text>
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="location" size={16} color="#ffffff" />
                    <Text style={styles.locationButtonText}>Use My Location</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
            
            <View style={styles.locationContainer}>
              <View style={styles.locationField}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="Latitude"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.locationField}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="Longitude"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <Text style={styles.helpText}>
              Coordinates help customers find your mess location on the map
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Photos</Text>
            
            {renderMessPhotos()}
            
            <Text style={styles.helpText}>
              Add photos of your mess interior, food, and environment to attract customers
            </Text>
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdateMess}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Mess Details</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Success Popup */}
          {showSuccessPopup && (
            <View style={styles.successPopupOverlay}>
              <View style={styles.successPopupContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={60} color="white" />
                </View>
                <Text style={styles.successTitle}>Success!</Text>
                <Text style={styles.successMessage}>Your mess details have been updated successfully.</Text>
                <Text style={styles.successNote}>Redirecting to home screen...</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  photoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,102,204,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  photoHelpText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#444',
  },
  required: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationField: {
    width: '48%',
  },
  messPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  addPhotoText: {
    fontSize: 30,
    color: '#999',
    fontWeight: '200',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    marginTop: 8,
  },
  updateButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  noteContainer: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  noteText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  infoText: {
    color: '#0066cc',
    fontSize: 14,
  },
  photoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  photoLoadingText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  deletePhotoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 4,
  },
  locationErrorText: {
    color: '#FF5252',
    fontSize: 14,
    marginBottom: 10,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  coordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  successPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successPopupContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIconContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  successNote: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default UpdateMessDetails;
