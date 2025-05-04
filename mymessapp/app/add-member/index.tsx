import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8080';
// const API_BASE_URL = 'http://10.0.2.2:8080'; // For Android emulator
// const API_BASE_URL = 'http://192.168.1.x:8080'; // Use your local IP for physical devices

export default function AddMemberScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors
  const backgroundColor = isDark ? '#121212' : Colors.light.background;
  const cardBg = isDark ? '#1e1e1e' : 'white';
  const textColor = isDark ? '#ffffff' : Colors.light.text;
  const borderColor = isDark ? '#333333' : Colors.light.grayLight;
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [mealType, setMealType] = useState('Veg');
  const [mealTime, setMealTime] = useState('one-time'); // one-time or two-time
  const [plan, setPlan] = useState('Basic');
  const [loading, setLoading] = useState(false);
  
  // Owner details (would be fetched from AsyncStorage in a real app)
  const [ownerDetails, setOwnerDetails] = useState({
    email: '',
    messId: '',
    messName: '',
  });
  
  useEffect(() => {
    // Load owner/mess details from AsyncStorage and API
    const loadOwnerData = async () => {
      try {
        const ownerEmail = await AsyncStorage.getItem('userEmail');
        if (!ownerEmail) {
          console.error('No owner email found');
          Alert.alert('Error', 'Please login as a mess owner first.');
          return;
        }

        // Fetch mess details from the API
        try {
          const messResponse = await axios.get(`${API_BASE_URL}/mess/getByEmail/${ownerEmail}`);
          const messDetails = messResponse.data;
          
          if (messDetails && messDetails.id) {
            setOwnerDetails({
              email: ownerEmail,
              messId: messDetails.id,
              messName: messDetails.messName || 'My Mess'
            });
          } else {
            console.error('No mess details found for this owner');
          }
        } catch (apiError) {
          console.error('Failed to fetch mess details:', apiError);
          // Fallback to default values if API fails
          setOwnerDetails({
            email: ownerEmail,
            messId: '1', // Fallback ID
            messName: 'My Mess'
          });
        }
      } catch (error) {
        console.error('Failed to load owner data:', error);
      }
    };
    
    loadOwnerData();
  }, []);

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !phone) {
      Alert.alert('Error', 'Name and Phone are required fields');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email is required to add a member');
      return;
    }

    try {
      setLoading(true);
      
      // Check if owner details are loaded
      if (!ownerDetails.email) {
        Alert.alert('Error', 'Mess owner details not available. Please try again.');
        setLoading(false);
        return;
      }
      
      // Step 1: First, create the user account if they don't exist
      try {
        // Check if user already exists
        const checkUserResponse = await axios.get(`${API_BASE_URL}/byEmail/${email}`);
        console.log('User already exists:', checkUserResponse.data);
      } catch (userError) {
        // User doesn't exist, create a new user account
        console.log('Creating new user account...');
        try {
          const registrationData = {
            name: name,
            email: email,
            password: "default123", // Default password, user can change later
            currentDate: new Date().toISOString().split('T')[0]
          };
          
          const registerResponse = await axios.post(`${API_BASE_URL}/register`, registrationData);
          console.log('User registration result:', registerResponse.data);
          
          // Update user profile with additional details
          const updateUserData = {
            name: name,
            phoneNumber: phone,
            address: address || "",
            gender: ""  // Default value
          };
          
          await axios.put(`${API_BASE_URL}/update/${email}`, updateUserData);
          console.log('Updated user profile');
          
        } catch (regError) {
          console.error('Error creating user:', regError);
          Alert.alert('Error', 'Failed to create user account. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      // Step 2: Join the user to the mess using the joinMess API
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      let subscriptionPlan;
      switch (plan) {
        case 'Basic':
          subscriptionPlan = 'Monthly';
          break;
        case 'Standard':
          subscriptionPlan = 'Monthly';
          break;
        case 'Premium':
          subscriptionPlan = 'Bimonthly';
          break;
        default:
          subscriptionPlan = 'Monthly';
      }
      
      const foodType = isVeg ? 'Veg' : 'Non-Veg';
      
      // Construct data for joinMess API
      const joinMessData = {
        joinDate: formattedDate,
        subscriptionPlan: subscriptionPlan,
        foodType: foodType
      };
      
      console.log('Joining member to mess with data:', joinMessData);
      console.log(`API call: joinMess/${email}/${ownerDetails.email}`);
      
      // Call the joinMess API
      try {
        const joinMessResponse = await fetch(`${API_BASE_URL}/joinMess/${email}/${ownerDetails.email}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(joinMessData)
        });
        
        const joinMessResult = await joinMessResponse.json();
        
        if (!joinMessResponse.ok) {
          throw new Error(joinMessResult.message || 'Failed to add member to mess');
        }
        
        console.log('Successfully added member to mess:', joinMessResult);
        
        // Step 3: Record initial payment with 0 amount (new member has full dues)
        try {
          let totalAmount = 0;
          switch (plan) {
            case 'Basic':
              totalAmount = 1800;
              break;
            case 'Standard':
              totalAmount = 2200;
              break;
            case 'Premium':
              totalAmount = 2800;
              break;
            default:
              totalAmount = 2000;
          }
          
          // Create payment record with 0 initial payment
          const initialPayment = 0;
          const remainingAmount = totalAmount;
          
          const paymentData = {
            userEmail: email,
            ownerEmail: ownerDetails.email,
            messId: ownerDetails.messId,
            amount: initialPayment,
            remainingAmount: remainingAmount
          };
          
          try {
            // Attempt to use the payment API
            const paymentResponse = await axios.post(`${API_BASE_URL}/record-payment`, paymentData);
            console.log('Payment record created:', paymentResponse.data);
          } catch (paymentApiError) {
            console.error('Payment API error, storing locally:', paymentApiError);
            
            // Store payment info in AsyncStorage as fallback
            const existingPaymentsJson = await AsyncStorage.getItem('localPayments');
            const existingPayments = existingPaymentsJson ? JSON.parse(existingPaymentsJson) : [];
            
            // Add new payment
            existingPayments.push({
              ...paymentData,
              date: new Date().toISOString(),
              id: Math.random().toString(36).substring(2, 15),
              paymentDate: new Date().toISOString()
            });
            
            // Save updated payments
            await AsyncStorage.setItem('localPayments', JSON.stringify(existingPayments));
            console.log('Payment recorded in local storage');
          }
        } catch (paymentError) {
          console.error('Error setting up payment record:', paymentError);
          // Continue with success even if payment record fails
        }
        
        // Success flow
        Alert.alert(
          'Success',
          `Member ${name} has been added successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setName('');
                setEmail('');
                setPhone('');
                setAddress('');
                setMealType('Veg');
                setPlan('Basic');
                setIsVeg(true);
                
                // Navigate to members list
                router.push('/(owner)/members');
              },
            },
          ]
        );
      } catch (joinError) {
        console.error('Error joining member to mess:', joinError);
        Alert.alert('Error', 'Failed to add member to mess. Please try again.');
      }
    } catch (error) {
      console.error('Error in add member process:', error);
      Alert.alert('Error', 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Add New Member</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formContainer}>
        {/* Personal Information */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa', borderColor, color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor={isDark ? '#666666' : '#9ca3af'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa', borderColor, color: textColor }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isDark ? '#666666' : '#9ca3af'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa', borderColor, color: textColor }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor={isDark ? '#666666' : '#9ca3af'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa', borderColor, color: textColor }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              placeholderTextColor={isDark ? '#666666' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Meal Preferences */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Meal Preferences</Text>
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: textColor }]}>Meal Type</Text>
            <View style={styles.toggleRow}>
              <Text style={[isVeg ? styles.activeText : styles.inactiveText, { color: isVeg ? Colors.light.tint : (isDark ? '#9ca3af' : Colors.light.grayDark) }]}>Veg</Text>
              <Switch
                value={!isVeg}
                onValueChange={(value) => {
                  setIsVeg(!value);
                  setMealType(value ? 'Non-Veg' : 'Veg');
                }}
                trackColor={{ false: '#4ade80', true: '#f87171' }}
                thumbColor={isVeg ? '#22c55e' : '#ef4444'}
              />
              <Text style={[!isVeg ? styles.activeText : styles.inactiveText, { color: !isVeg ? '#ef4444' : (isDark ? '#9ca3af' : Colors.light.grayDark) }]}>Non-Veg</Text>
            </View>
          </View>
          
          {/* Meal Time Option */}
          <View style={styles.mealTimeContainer}>
            <Text style={[styles.label, { color: textColor }]}>Meal Timing</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  { 
                    backgroundColor: mealTime === 'one-time' ? Colors.light.tint : (isDark ? '#2a2a2a' : '#f3f4f6'),
                    borderColor: mealTime === 'one-time' ? Colors.light.tint : borderColor 
                  }
                ]}
                onPress={() => setMealTime('one-time')}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    { color: mealTime === 'one-time' ? '#ffffff' : textColor }
                  ]}
                >
                  One Time (Lunch or Dinner)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.optionButton, 
                  { 
                    backgroundColor: mealTime === 'two-time' ? Colors.light.tint : (isDark ? '#2a2a2a' : '#f3f4f6'),
                    borderColor: mealTime === 'two-time' ? Colors.light.tint : borderColor,
                    marginTop: 8 
                  }
                ]}
                onPress={() => setMealTime('two-time')}
              >
                <Text 
                  style={[
                    styles.optionText, 
                    { color: mealTime === 'two-time' ? '#ffffff' : textColor }
                  ]}
                >
                  Two Time (Lunch and Dinner)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.planSelector}>
            <Text style={[styles.label, { color: textColor }]}>Subscription Plan *</Text>
            <View style={styles.planOptions}>
              <TouchableOpacity 
                style={[
                  styles.planOption, 
                  { 
                    backgroundColor: plan === 'Basic' ? Colors.light.tintLight : (isDark ? '#2a2a2a' : '#ffffff'),
                    borderColor: plan === 'Basic' ? Colors.light.tint : borderColor 
                  }
                ]}
                onPress={() => setPlan('Basic')}
              >
                <Text style={[plan === 'Basic' ? styles.activePlanText : styles.planText, { color: plan === 'Basic' ? Colors.light.tint : textColor }]}>Basic</Text>
                <Text style={[styles.planPrice, { color: isDark ? '#9ca3af' : Colors.light.grayDark }]}>₹1800/mo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.planOption, 
                  { 
                    backgroundColor: plan === 'Standard' ? Colors.light.tintLight : (isDark ? '#2a2a2a' : '#ffffff'),
                    borderColor: plan === 'Standard' ? Colors.light.tint : borderColor 
                  }
                ]}
                onPress={() => setPlan('Standard')}
              >
                <Text style={[plan === 'Standard' ? styles.activePlanText : styles.planText, { color: plan === 'Standard' ? Colors.light.tint : textColor }]}>Standard</Text>
                <Text style={[styles.planPrice, { color: isDark ? '#9ca3af' : Colors.light.grayDark }]}>₹2200/mo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.planOption, 
                  { 
                    backgroundColor: plan === 'Premium' ? Colors.light.tintLight : (isDark ? '#2a2a2a' : '#ffffff'),
                    borderColor: plan === 'Premium' ? Colors.light.tint : borderColor 
                  }
                ]}
                onPress={() => setPlan('Premium')}
              >
                <Text style={[plan === 'Premium' ? styles.activePlanText : styles.planText, { color: plan === 'Premium' ? Colors.light.tint : textColor }]}>Premium</Text>
                <Text style={[styles.planPrice, { color: isDark ? '#9ca3af' : Colors.light.grayDark }]}>₹2800/mo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Add Member</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  formContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  activeText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 8,
  },
  inactiveText: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  mealTimeContainer: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'column',
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  planSelector: {
    marginTop: 8,
  },
  planOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planOption: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePlan: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintLight,
  },
  planText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activePlanText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
}); 