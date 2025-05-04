import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL - ensure it's properly encoded for special characters
const API_BASE_URL = 'http://localhost:8080';
//const API_BASE_URL = 'http://10.0.2.2:8080'; // For Android emulator
// const API_BASE_URL = 'http://192.168.1.x:8080'; // Use your local IP for physical devices

// Mock data for selected mess
const mockSelectedMess = {
  id: '1',
  name: 'Maharaja Mess',
  image: require('@/assets/images/react-logo.png'),
  price: '₹3,000/month',
};

// Interface for mess details
interface MessDetails {
  id: string;
  messName: string;
  messAddress: string;
  messType: string;
  imageName: string | null;
  capacity: number;
  email: string;
  contact: string;
  price: string;
  pricePerMeal: number;
  subscriptionPlan: number;
  menuItems: any[]; // Will hold menu items if available
  joinedUsers: string[];
  averageRating: number;
  isLoading: boolean;
}

export default function JoinMessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Extract and parse URL parameters
  const messId = params.messId as string;
  const messEmail = params.messEmail as string || '';
  const messName = params.messName as string || '';
  const messPrice = params.messPrice as string || '';
  const contactEmail = params.contact as string || '';
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const inputBgColor = isDark ? '#2a2a2a' : '#f3f4f6';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const primaryColor = isDark ? '#3b82f6' : '#4f46e5';
  const secondaryText = isDark ? '#9ca3af' : '#444444';
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // Mess details state
  const [messDetails, setMessDetails] = useState<MessDetails>({
    id: '',
    messName: '',
    messAddress: '',
    messType: '',
    imageName: null,
    capacity: 0,
    email: '',
    contact: '',
    price: '',
    pricePerMeal: 0,
    subscriptionPlan: 0,
    menuItems: [],
    joinedUsers: [],
    averageRating: 0,
    isLoading: true
  });
  
  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    photo: null as string | null,
    address: '',
    phoneNumber: '',
    gender: '',
    isComplete: false,
  });
  
  // Form state
  const [selectedMealOption, setSelectedMealOption] = useState('veg');
  const [selectedMealTime, setSelectedMealTime] = useState('one-time'); // one-time or two-time
  const [selectedDuration, setSelectedDuration] = useState('one-month'); // one-month or two-month
  
  // Add this function to check if the API endpoints are available
  const checkApiEndpoints = async () => {
    try {
      // Prioritize checking by ID if available
      if (messId) {
        const testEndpoint = `${API_BASE_URL}/mess/getById/${messId}`;
        try {
          await axios.get(testEndpoint);
          return true;
        } catch (error) {
          // Try checking getByEmail if messEmail is provided as fallback
          if (messEmail) {
            try {
              await axios.get(`${API_BASE_URL}/mess/getByEmail/${messEmail}`);
              return true;
            } catch (fallbackError) {
              return false;
            }
          }
        }
      } else if (messEmail) {
        // Try getByEmail if no messId is provided
        try {
          await axios.get(`${API_BASE_URL}/mess/getByEmail/${messEmail}`);
          return true;
        } catch (error) {
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if API endpoints are available
        await checkApiEndpoints();
        
        // Get user email from AsyncStorage
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) {
          setLoading(false);
          return;
        }
        
        // Fetch user profile
        try {
          const userResponse = await axios.get(`${API_BASE_URL}/byEmail/${email}`);
          const userData = userResponse.data;
          
          setUserProfile({
            name: userData.name || '',
            email: email,
            photo: userData.imageName ? `${API_BASE_URL}/profile/${email}` : null,
            address: userData.address || '',
            phoneNumber: userData.phoneNumber || '',
            gender: userData.gender || '',
            isComplete: !!(userData.name && userData.address && userData.phoneNumber)
          });
        } catch (userError) {
          // Silently handle user profile fetch errors
        }
        
        // Fetch mess details
        if (messId || messEmail) {
          await fetchMessDetails(messId, messEmail);
        } else {
          // If no API data, but we have parameters, use them directly
          if (messName || messPrice) {
            setMessDetails(prev => ({
              ...prev,
              messName: messName || 'Unknown Mess',
              price: messPrice || 'Price not available',
              email: messEmail,
              isLoading: false
            }));
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [messId, messEmail, messName, messPrice]);
  
  const fetchMessDetails = async (messId?: string, messEmail?: string) => {
    try {
      let endpoint = '';
      
      // Prioritize fetching by ID if available
      if (messId) {
        endpoint = `${API_BASE_URL}/mess/getById/${messId}`;
      } else if (messEmail) {
        endpoint = `${API_BASE_URL}/mess/getByEmail/${messEmail}`;
      } else {
        return;
      }
      
      const response = await axios.get(endpoint);
      const data = response.data;
      
      // If data is empty or undefined, exit
      if (!data) {
        return;
      }
      
      setMessDetails({
        id: data.id || '',
        messName: data.messName || '',
        messAddress: data.messAddress || '',
        messType: data.messType || '',
        imageName: data.imageName,
        capacity: data.capacity || 0,
        email: data.email || messEmail || '',
        contact: data.contact || contactEmail || '',
        price: data.price || '₹3,000/month', // Default price if not provided
        pricePerMeal: data.pricePerMeal || 0,
        subscriptionPlan: data.subscriptionPlan || 0,
        menuItems: data.menuItems || [],
        joinedUsers: data.joinedUsers || [],
        averageRating: data.averageRating || 0,
        isLoading: false
      });
    } catch (error) {
      setMessDetails(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const handleJoinMess = async () => {
    if (!userProfile.isComplete) {
      Alert.alert(
        'Complete Your Profile',
        'Please update your profile details before joining a mess.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update Profile', 
            onPress: () => router.push('/screens/profile/update-profile')
          },
        ]
      );
      return;
    }
    
    try {
      setJoining(true);
      
      // Get mess details from state or params
      const messEmail = messDetails.email || params.messEmail as string;
      const messId = messDetails.id || params.messId as string;
      const messContact = messDetails.contact || contactEmail || '';
      
      if (!messEmail && !messId) {
        Alert.alert('Error', 'Mess information is missing. Please try again.');
        return;
      }
      
      // Check if user is trying to join their own mess
      if (messEmail === userProfile.email) {
        Alert.alert(
          'Cannot Join',
          'You cannot join your own mess.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if user is already in joined users list
      if (messDetails.joinedUsers && messDetails.joinedUsers.includes(userProfile.email)) {
        Alert.alert(
          'Already Joined',
          'You have already joined this mess.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Prepare data for API exactly as in the working curl request
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const subscriptionPlan = selectedDuration === 'one-month' ? 'Monthly' : 'Bimonthly';
      const foodType = selectedMealOption === 'veg' ? 'Veg' : 'Non-Veg';
      
      // Construct data exactly as in the curl example
      const requestData = {
        joinDate: formattedDate,
        subscriptionPlan: subscriptionPlan,
        foodType: foodType
      };
      
      // Get the target owner email - ensure this is the correct contact to use
      const ownerEmail = messContact || messEmail;
      
      // Using the correct API endpoint pattern
      // The UserController doesn't have a class-level mapping, so no prefix is needed
      const endpoint = `${API_BASE_URL}/joinMess/${userProfile.email}/${ownerEmail}`;
      
      // Call API to join mess with exact format from curl command
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to join mess');
      }
      
      // Record initial payment after successful joining
      try {
        // Get the subscription plan directly as the total amount
        // Use the actual subscriptionPlan value if it's a large number (likely a price)
        // If it's a small number (likely days), use a default amount
        let totalSubscriptionAmount: number;
        
        if (messDetails.subscriptionPlan) {
          // If subscriptionPlan is a large number, it's likely already the price
          if (messDetails.subscriptionPlan > 100) {
            totalSubscriptionAmount = messDetails.subscriptionPlan;
          } else {
            // If it's a small number (days), use a default price of 3000
            totalSubscriptionAmount = 3000;
          }
        } else {
          // Fallback if no subscription plan is available
          totalSubscriptionAmount = 3000;
        }
        
        // Set initial payment to 500 rupees
        const initialPayment = 500;
        const remainingAmount = totalSubscriptionAmount - initialPayment;
        
        console.log(`Total subscription amount: ${totalSubscriptionAmount}, Initial payment: ${initialPayment}, Remaining: ${remainingAmount}`);
        
        // Make payment record API call
        const paymentResponse = await fetch(`${API_BASE_URL}/payment/record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            userEmail: userProfile.email,
            ownerEmail: ownerEmail,
            messId: messId,
            amountPaid: initialPayment.toString(),
            remainingDues: remainingAmount.toString()
          }).toString()
        });
        
        if (!paymentResponse.ok) {
          const paymentError = await paymentResponse.text();
          console.error('Payment recording failed:', paymentError);
          // Continue with success flow even if payment recording fails
        } else {
          const paymentResult = await paymentResponse.json();
          console.log('Payment recorded successfully:', paymentResult);
        }
      } catch (paymentError) {
        // Continue with success flow even if payment recording fails
        console.error('Payment recording failed:', paymentError);
      }
      
      // Show success modal
      setJoinSuccess(true);
      
      // Show alert after a delay and then navigate
      setTimeout(() => {
        Alert.alert(
          'Success!',
          `You have successfully joined ${messDetails.messName || 'the mess'}.`,
          [{ 
            text: 'OK', 
            onPress: () => {
              router.replace('/screens/history' as any);
            } 
          }]
        );
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to join the mess. Please try again later.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setJoining(false);
    }
  };
  
  const renderOption = (
    title: string, 
    value: string, 
    selectedValue: string, 
    onSelect: (value: string) => void
  ) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        { 
          backgroundColor: value === selectedValue ? (isDark ? '#2563eb' : '#4338ca') : inputBgColor,
          borderColor: value === selectedValue ? primaryColor : borderColor 
        }
      ]}
      onPress={() => onSelect(value)}
    >
      <Text 
        style={[
          styles.optionText, 
          { color: value === selectedValue ? '#ffffff' : textColor }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Success Modal */}
      {joinSuccess && (
        <View style={styles.successOverlay}>
          <View style={[styles.successModal, { backgroundColor: cardBg }]}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={[styles.successTitle, { color: textColor }]}>Success!</Text>
            <Text style={[styles.successMessage, { color: secondaryText }]}>
              You have successfully joined {messDetails.messName || 'the mess'}.
            </Text>
          </View>
        </View>
      )}
      
      <View style={[styles.header, { backgroundColor: cardBg }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Join Mess</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading details...</Text>
        </View>
      ) : (
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.messCard, { backgroundColor: cardBg, borderColor }]}>
            <Image 
              source={
                messDetails.imageName 
                  ? { uri: `${API_BASE_URL}/mess/profile/${messDetails.email}` } 
                  : params.messImage 
                    ? { uri: params.messImage as string } 
                    : mockSelectedMess.image
              } 
              style={styles.messImage} 
            />
          <View style={styles.messInfo}>
              <Text style={[styles.messName, { color: textColor }]}>
                {messDetails.messName || params.messName || mockSelectedMess.name}
              </Text>
              <Text style={[styles.messPrice, { color: primaryColor }]}>
                {messDetails.price || params.messPrice || mockSelectedMess.price}
              </Text>
              
              {/* Mess Details */}
              {messDetails.messAddress && (
                <Text style={[styles.messAddress, { color: secondaryText }]}>
                  <Ionicons name="location-outline" size={14} color={secondaryText} /> {messDetails.messAddress}
                </Text>
              )}
              
              {messDetails.messType && (
                <Text style={[styles.messType, { color: secondaryText }]}>
                  <Ionicons name="restaurant-outline" size={14} color={secondaryText} /> {messDetails.messType} Mess
                </Text>
              )}
              
              {messDetails.capacity > 0 && (
                <View style={styles.capacityContainer}>
                  <Text style={[styles.capacity, { color: secondaryText }]}>
                    <Ionicons name="people-outline" size={14} color={secondaryText} /> Capacity: {messDetails.joinedUsers.length}/{messDetails.capacity}
                  </Text>
                  <View style={styles.capacityBarContainer}>
                    <View 
                      style={[
                        styles.capacityBarFill, 
                        { 
                          width: `${Math.min(100, (messDetails.joinedUsers.length / Math.max(1, messDetails.capacity)) * 100)}%`,
                          backgroundColor: messDetails.joinedUsers.length >= messDetails.capacity ? '#ef4444' : primaryColor 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
              
              {messDetails.averageRating > 0 && (
                <Text style={[styles.rating, { color: secondaryText }]}>
                  <Ionicons name="star" size={14} color="#f59e0b" /> Rating: {messDetails.averageRating.toFixed(1)}/5
                </Text>
              )}
          </View>
        </View>
        
        <View style={[styles.formSection, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Meal Preferences</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Food Preference</Text>
            <View style={styles.optionsRow}>
              {renderOption('Vegetarian', 'veg', selectedMealOption, setSelectedMealOption)}
              {renderOption('Non-Vegetarian', 'non-veg', selectedMealOption, setSelectedMealOption)}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Meal Time</Text>
            <View style={styles.optionsRow}>
              {renderOption('One Time (Lunch or Dinner)', 'one-time', selectedMealTime, setSelectedMealTime)}
              {renderOption('Two Time (Lunch and Dinner)', 'two-time', selectedMealTime, setSelectedMealTime)}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Subscription Duration</Text>
            <View style={styles.optionsRow}>
              {renderOption('1 Month', 'one-month', selectedDuration, setSelectedDuration)}
              {renderOption('2 Months', 'two-month', selectedDuration, setSelectedDuration)}
            </View>
          </View>
        </View>
        
        <View style={[styles.profileSection, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.profileHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Your Profile</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/screens/profile/update-profile')}
            >
              <Text style={[styles.editButtonText, { color: primaryColor }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {userProfile.isComplete ? (
            <View style={styles.profileInfo}>
              <Image 
                source={userProfile.photo ? { uri: userProfile.photo } : require('@/assets/images/react-logo.png')} 
                style={styles.profilePhoto} 
              />
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: textColor }]}>{userProfile.name}</Text>
                  <Text style={[styles.profileDetail, { color: secondaryText }]}>
                    {userProfile.email}
                  </Text>
                  <Text style={[styles.profileDetail, { color: secondaryText }]}>
                    Phone: {userProfile.phoneNumber || 'Not set'}
                  </Text>
                <Text style={[styles.profileStatus, { color: '#4CAF50' }]}>Profile Complete</Text>
              </View>
            </View>
          ) : (
            <View style={styles.incompleteProfile}>
              <Ionicons name="alert-circle-outline" size={24} color="#FFC107" />
              <Text style={[styles.incompleteText, { color: textColor }]}>
                Please complete your profile before joining
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      )}
      
      <View style={[styles.footer, { backgroundColor: cardBg }]}>
        <LinearGradient
          colors={isDark ? ['#4f46e5', '#3b82f6'] : ['#3b82f6', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.joinButton, joining || loading ? { opacity: 0.7 } : {}]}
        >
          <TouchableOpacity
            style={styles.joinButtonTouch}
            onPress={handleJoinMess}
            disabled={joining || loading}
          >
            {joining ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
            <Text style={styles.joinButtonText}>Join Mess</Text>
            <Ionicons name="checkmark-circle" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  messCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  messImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  messInfo: {
    flex: 1,
  },
  messName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  messPrice: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  messAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  messType: {
    fontSize: 14,
    marginBottom: 4,
  },
  capacityContainer: {
    marginVertical: 4,
  },
  capacity: {
    fontSize: 14,
    marginBottom: 4,
  },
  capacityBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 2,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  rating: {
    fontSize: 14,
    marginTop: 4,
  },
  formSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    minWidth: '45%',
  },
  optionText: {
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
  },
  profileSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontWeight: '600',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
  },
  profileStatus: {
    fontSize: 14,
  },
  incompleteProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  incompleteText: {
    marginLeft: 8,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successModal: {
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
}); 