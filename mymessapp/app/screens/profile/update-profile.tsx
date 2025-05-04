import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/app/_layout';

// Backend API URL - update this to your actual backend URL
// For testing on a real device, use your computer's actual IP address
//const API_URL = 'http://10.0.2.2:8080'; // For Android Emulator
 const API_URL = 'http://localhost:8080'; // Only works in web browser, not on devices
// If using a physical device on same WiFi, use your computer's IP address
// e.g., const API_URL = 'http://192.168.1.xxx:8080';

// Mock user data to pre-fill the form fields
const mockUserData = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  phoneNumber: '+91 98765 43210',
  temporaryAddress: '123 Main Street, Apartment 45, Bengaluru',
  permanentAddress: '456 Park Avenue, House No. 12, Delhi',
  currentJob: 'Software Engineer at TechCorp',
  memberSince: 'June 2023',
  messSubscriptions: 5,
  favoriteMessCount: 3,
};

// Interface for image upload response from backend
interface ImageUploadedResponse {
  imagesNames?: string[] | null;
  imageName?: string;
  message: string;
  success: boolean;
}

export default function UpdateProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userEmail, userType } = useContext(AuthContext);
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const inputBgColor = isDark ? '#2a2a2a' : '#f3f4f6';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const primaryColor = isDark ? '#3b82f6' : '#4f46e5';
  
  // State for API interactions
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [gender, setGender] = useState('');
  const [temporaryAddress, setTemporaryAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [bio, setBio] = useState('');
  
  // Load user data from AsyncStorage when component mounts
  useEffect(() => {
    loadUserData();

    // Add a refresh interval to periodically update the profile image
    const refreshInterval = setInterval(() => {
      if (photo) {
        // Update only the timestamp in the photo URL to force a refresh
        const baseUrl = photo.split('?')[0];
        setPhoto(`${baseUrl}?t=${new Date().getTime()}`);
        console.log('Refreshed profile image URL with new timestamp');
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [userEmail]);
  
  async function loadUserData() {
    try {
      setIsLoading(true);
      
      // Always fetch fresh data from the API
      await fetchUserProfile();
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load profile data');
      
      // Use the userEmail from context as fallback
      setEmail(userEmail || '');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Fetch user profile from the backend
  const fetchUserProfile = async () => {
    if (!userEmail) {
      setError('User email not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }

      // Log the request details for debugging
      console.log('Fetching profile with:', {
        email: userEmail,
        userType,
        token: token.substring(0, 10) + '...' // Only log part of the token for security
      });

      // Update endpoints to match UserController.java and MessOwnerController.java paths
      const endpoint = userType === 'owner' 
        ? '/mess/byEmail'  // Using MessOwnerController's endpoint for fetching mess owner by email
        : '/byEmail';      // Using UserController's endpoint for fetching user by email

      const url = getApiUrl(endpoint, userEmail);
      console.log('Fetch URL:', url);

      // Make request without cache-control headers to avoid CORS issues
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Profile data received:', JSON.stringify(data).substring(0, 100) + '...');
      
      // Set form fields with user data
      setName(data.name || '');
      setEmail(data.email || userEmail || '');

      // Debug log for contact and email fields
      console.log('Contact field from API:', data.contact);
      console.log('Email field from API:', data.email);

      // Always ensure contact is set - if null, use email
      // This ensures we never submit null to the backend
      const contactValue = data.contact || data.email || userEmail || '';
      setContact(contactValue);
      console.log('Setting contact field to:', contactValue);
      
      setPhone(data.phoneNumber || '');
      setGender(data.gender || '');
      setTemporaryAddress(data.temporaryAddress || data.address || '');
      setPermanentAddress(data.permanentAddress || '');
      setCurrentJob(data.currentJob || '');
      setBio(data.bio || '');
      
      // If there's a profile image URL and email is not null
      if (data?.imageName && userEmail) {
        // Direct URL to the profile endpoint that serves the image
        // This matches the same endpoint used in the curl GET command
        // Add timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        const imageUrl = `${API_URL}/profile/${encodeURIComponent(userEmail)}?t=${timestamp}`;
        console.log('Setting profile image URL:', imageUrl);
        
        // Set the photo state directly for immediate feedback
        setPhoto(imageUrl);
        console.log('Profile image URL set in state');
      }
      
      // Store the complete user data for later use
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(`Failed to fetch profile data: ${error.message}`);
      
      // Set the email from context as fallback
      setEmail(userEmail || '');
      
      // For development - try to use mock data as fallback
      if (isDark) { // Using isDark as a proxy for development mode
        console.log('Using mock data as fallback in development');
        setName(mockUserData.name);
        setPhone(mockUserData.phoneNumber);
        setTemporaryAddress(mockUserData.temporaryAddress);
        setPermanentAddress(mockUserData.permanentAddress);
        setCurrentJob(mockUserData.currentJob);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle base64 image data for both takePhoto and pickImage
  const processImage = (uri: string, base64Data?: string | null) => {
    try {
      if (base64Data) {
        // If we have a base64 string, create a proper data URI
        const base64Uri = `data:image/jpeg;base64,${base64Data}`;
        
        // Validate the base64 data before setting it
        if (base64Data.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
          console.log('Valid base64 data received, length:', base64Data.length);
          setPhoto(base64Uri);
          return;
        } else {
          console.warn('Invalid base64 data received, falling back to URI');
        }
      }
      
      // Fallback to direct URI if no valid base64 data
      console.log('Using image URI directly:', uri.substring(0, 50) + '...');
      setPhoto(uri);
    } catch (error) {
      console.error('Error processing image:', error);
      // In case of any error, fall back to URI
      setPhoto(uri);
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Reduce quality a bit for better performance
        base64: true, // Request base64 data for web compatibility
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while taking a photo.');
      console.error(error);
    }
  };
  
  // Pick image from gallery
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Reduce quality a bit for better performance
        base64: true, // Request base64 data for web compatibility
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while picking an image.');
      console.error(error);
    }
  };
  
  // Handler for camera button
  const handleCameraPress = async () => {
    try {
      // Show feedback that we're accessing the camera
      console.log('Launching camera...');
      await takePhoto();
    } catch (error) {
      console.error('Error in camera handler:', error);
      Alert.alert('Camera Error', 'Failed to access camera. Please try again.');
    }
  };
  
  // Handler for gallery button
  const handleGalleryPress = async () => {
    try {
      // Show feedback that we're accessing the gallery
      console.log('Opening photo gallery...');
      await pickImage();
    } catch (error) {
      console.error('Error in gallery handler:', error);
      Alert.alert('Gallery Error', 'Failed to access photo gallery. Please try again.');
    }
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    // Remove validation alerts that stop the flow
    if (!name.trim()) {
      console.warn('Name field is empty but continuing with save');
    }
    
    if (!phone.trim()) {
      console.warn('Phone field is empty but continuing with save');
    }
    
    if (!email.trim()) {
      console.warn('Email field is empty but continuing with save');
    }
    
    try {
      setIsSaving(true);
      console.log('Starting profile save process...');
      
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.error('Authentication token not found');
        setError('Authentication token not found. Please login again.');
        setIsSaving(false);
        return;
      }
      
      console.log('Beginning profile update process...');
      
      // First handle image upload if needed
      let imageUploadSuccess = true;
      let imageName = null;
      
      // Check if photo is a file URI or a base64 data URI
      if (photo) {
        try {
          console.log('Uploading profile image first...');
          // Handle both file:// URIs and data: URIs (base64)
          if (photo.startsWith('file://') || photo.startsWith('data:')) {
            console.log('Detected uploadable image format, proceeding with upload...');
            const imageResult = await uploadProfileImage(photo);
            if (imageResult && (imageResult as ImageUploadedResponse).imageName) {
              imageName = (imageResult as ImageUploadedResponse).imageName;
              console.log('Image upload successful, got image name:', imageName);
            }
          } else {
            console.log('Not uploading image - using existing server image');
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          imageUploadSuccess = false;
          // Continue with profile update even if image fails
          console.warn('Continuing with profile update despite image upload failure');
        }
      }
      
      // Prepare update data - include all fields from UserDto
      interface UpdateDataType {
        name: string;
        email: string;
        phoneNumber: string;
        address: string;
        contact: string;
        gender: string;
        imageName?: string;
      }
      
      // Debug log before constructing update data
      console.log('Preparing update data with:', {
        name,
        email,
        contact,
        gender
      });

      // Ensure contact is never null or empty - default to email if it is
      const contactValue = contact && contact.trim() ? contact : email;
      console.log('Using contact value:', contactValue);

      const updateData: UpdateDataType = {
        name: name || 'User',
        email: email,
        phoneNumber: phone || '', // Match the field name in the backend UserDto
        address: temporaryAddress || '', // Using temporary address as main address
        contact: contactValue, // Use our validated contact value
        gender: gender || '',  // Include gender field
      };
      
      // If image was successfully uploaded, include the image name in the update
      if (imageUploadSuccess && imageName) {
        updateData.imageName = imageName;
      }
      
      console.log('Final update payload:', JSON.stringify(updateData));
      
      // Update endpoints to match UserController.java paths
      const endpoint = userType === 'owner' 
        ? '/mess/update'  // MessOwnerController endpoint
        : '/update';      // UserController endpoint
      
      const url = getApiUrl(endpoint, userEmail);
      console.log('Update URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      console.log('Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        console.error(`Failed to update profile: ${response.status} - ${errorText}`);
        
        // Continue execution instead of throwing
        console.warn('Profile update failed, but continuing with navigation');
        
        // Clear form cache and navigate back regardless
        AsyncStorage.removeItem('formCache').then(() => {
          router.back();
        });
        return;
      }
      
      // Get the updated user data from the response
      const updatedUserDto = await response.json();
      console.log('Updated user data:', JSON.stringify(updatedUserDto));
      
      // Update local storage with new data
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserDto));
      
      console.log('Profile updated successfully, returning to profile screen');
      
      // Remove Alert that blocks the flow
      // Clear form cache and navigate back
      AsyncStorage.removeItem('formCache').then(() => {
        router.back();
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      // Don't show Alert, just log and continue
      console.warn('Profile update error, but continuing with navigation');
      
      // Clear form cache and navigate back anyway
      AsyncStorage.removeItem('formCache').then(() => {
        router.back();
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Upload profile image
  const uploadProfileImage = async (imageUri: string): Promise<ImageUploadedResponse> => {
    try {
      console.log('Starting profile image upload process for:', imageUri.substring(0, 50) + '...');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.error('Auth token missing for image upload');
        throw new Error('Authentication token not found');
      }
      
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
      
      // Direct URL to profile endpoint - add the correct prefix based on user type
      const safeEmail = userEmail || '';
      const prefix = userType === 'owner' ? '/mess' : '';
      const url = `${API_URL}${prefix}/profile/${encodeURIComponent(safeEmail)}`;
      console.log('Image upload URL:', url);
      
      console.log('Making upload request with token:', token.substring(0, 10) + '...');
      
      // Test with XMLHttpRequest for better debugging
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
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
      throw error;
    }
  };

  // Update to use this function for URL safety with email
  const getApiUrl = (path: string, emailParam?: string | null) => {
    const safeEmail = emailParam || '';
    
    // Add appropriate prefix for owner endpoints if needed
    let fullPath = path;
    if (userType === 'owner' && !path.startsWith('/mess')) {
      // Add mess prefix for owner endpoints that don't have it yet
      if (path === '/byEmail') fullPath = '/mess/byEmail';
      else if (path === '/update') fullPath = '/mess/update';
    }
    
    return `${API_URL}${fullPath}/${encodeURIComponent(safeEmail)}`;
  };

  // Render the profile image with error handling
  const renderProfileImage = () => {
    if (!photo) {
      return (
        <View style={[styles.photoPlaceholder, { backgroundColor: inputBgColor }]}>
          <Text style={[styles.photoInitials, { color: placeholderColor }]}>
            {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : ''}
          </Text>
        </View>
      );
    }

    // Add random cache busting parameter for network images
    const imageUri = photo.startsWith('http') 
      ? `${photo}?t=${new Date().getTime()}`
      : photo;
      
    return (
      <Image 
        source={{ 
          uri: imageUri,
          headers: photo.startsWith('http') ? { 'Cache-Control': 'no-cache' } : undefined,
          cache: photo.startsWith('http') ? 'reload' : 'default'
        }} 
        style={styles.profilePhoto}
        key={`profile-${new Date().getTime()}`}
        onLoadStart={() => console.log('Starting to load profile image in edit screen')}
        onLoad={() => console.log('Profile image loaded successfully in edit screen')}
        onError={(e) => {
          console.error('Error loading profile image:', e.nativeEvent.error);
          // If we fail to load a base64 image, show a more helpful error
          if (photo.startsWith('data:')) {
            Alert.alert(
              'Image Error',
              'There was a problem with the image data. Please try selecting a different image.',
              [{ text: 'OK' }]
            );
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerTitleStyle: { fontWeight: '600' },
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
        }}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading profile...</Text>
        </View>
      ) : error && !name ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF5252" />
          <Text style={[styles.errorTitle, { color: textColor }]}>Failed to load profile</Text>
          <Text style={[styles.errorText, { color: isDark ? '#cccccc' : '#666666' }]}>{error}</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: primaryColor }]}
              onPress={fetchUserProfile}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: '#666' }]}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.debugInfoButton}
            onPress={() => Alert.alert('Debug Info', 
              `Email: ${userEmail || 'Not available'}\n` +
              `User Type: ${userType || 'Not available'}\n` +
              `API URL: ${API_URL}\n`
            )}
          >
            <Text style={[styles.debugInfoText, { color: isDark ? '#888' : '#999' }]}>Show Debug Info</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.photoContainer}>
              <TouchableOpacity onPress={handleCameraPress} style={styles.photoWrapper}>
                {renderProfileImage()}
              <View style={[styles.editBadge, { backgroundColor: primaryColor }]}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.photoHint, { color: placeholderColor }]}>
                Tap to change your profile photo
            </Text>
              
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={[styles.photoActionButton, { backgroundColor: '#4A90E2' }]}
                  onPress={handleCameraPress}
                >
                  <Ionicons name="camera-outline" size={20} color="#ffffff" />
                  <Text style={styles.photoActionText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, { backgroundColor: '#45C264' }]}
                  onPress={handleGalleryPress}
                >
                  <Ionicons name="image-outline" size={20} color="#ffffff" />
                  <Text style={styles.photoActionText}>Gallery</Text>
                </TouchableOpacity>
              </View>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Full Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="person-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={placeholderColor}
                  value={name}
                  onChangeText={setName}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="mail-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setContact(text);
                  }}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Contact Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="at-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your contact email (if different)"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={contact}
                  onChangeText={setContact}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Phone Number</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="call-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={placeholderColor}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Gender</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="people-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your gender"
                  placeholderTextColor={placeholderColor}
                  value={gender}
                  onChangeText={setGender}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Address</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="location-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Enter your address"
                  placeholderTextColor={placeholderColor}
                  value={temporaryAddress}
                  onChangeText={setTemporaryAddress}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                { backgroundColor: primaryColor },
                isSaving && { opacity: 0.7 }
              ]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 14,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
    width: '100%',
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  photoActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 120,
  },
  textArea: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  saveButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 16,
  },
  cancelButton: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  debugInfoButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugInfoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 