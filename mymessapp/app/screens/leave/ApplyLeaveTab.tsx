import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';
import { router } from 'expo-router';
import Confetti from '../../components/Confetti';

interface ApplyLeaveTabProps {
  isDark: boolean;
  messId: string;
  messName: string;
}

const ApplyLeaveTab: React.FC<ApplyLeaveTabProps> = ({ isDark, messId, messName }) => {
  // State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveDays, setLeaveDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const placeholderColor = isDark ? '#666666' : '#a0a0a0';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const accentColor = '#4f46e5';
  const buttonColor = '#4f46e5';
  const successColor = '#10b981';
  
  // Fetch user email on component mount
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };
    
    getUserEmail();
  }, []);
  
  // Calculate leave days when dates change
  const calculateLeaveDays = () => {
    if (!startDate || !endDate) return;
    console.log(`Calculating days between: Start='${startDate}', End='${endDate}'`);
    
    try {
      // IMPORTANT: Date calculation should use a simple direct approach
      // Parse dates to work with a standard format
      const parts1 = startDate.split('-');
      const parts2 = endDate.split('-');
      
      // Check if we have valid date parts
      if (parts1.length !== 3 || parts2.length !== 3) {
        console.log('Invalid date format, must be YYYY-MM-DD');
        return;
      }
      
      // Create year/month/day numbers from parts
      const startYear = parseInt(parts1[0], 10);
      const startMonth = parseInt(parts1[1], 10) - 1; // Month is 0-indexed in JavaScript
      const startDay = parseInt(parts1[2], 10);
      
      const endYear = parseInt(parts2[0], 10);
      const endMonth = parseInt(parts2[1], 10) - 1; // Month is 0-indexed in JavaScript
      const endDay = parseInt(parts2[2], 10);
      
      // Create dates with each component separately to avoid parsing issues
      const start = new Date(startYear, startMonth, startDay);
      const end = new Date(endYear, endMonth, endDay);
      
      // Debug the parsed dates
      console.log(`Parsed dates - Start: ${start.toISOString()}, End: ${end.toISOString()}`);
      
      // Check if the parsed dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log('Invalid date after parsing');
        return;
      }
      
      // Calculate the time difference in milliseconds
      const diffTime = end.getTime() - start.getTime();
      
      // Check if end date is before start date
      if (diffTime < 0) {
        console.log('End date is before start date');
        return; // Don't update if end date is before start date
      }
      
      // Calculate the number of days (add 1 to include both start and end days)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`Final calculation: ${startDate} to ${endDate} = ${diffDays} days`);
      console.log(`Diff time in ms: ${diffTime}, Diff in days: ${diffTime / (1000 * 60 * 60 * 24)}`);
      
      setLeaveDays(diffDays);
    } catch (error) {
      console.log('Date calculation error:', error);
    }
  };
  
  // Handle date changes
  const handleStartDateChange = (text: string) => {
    setStartDate(text);
    // Only calculate days if both dates are entered
    if (endDate) {
      // Try to calculate leave days after a short delay to allow for typing
      setTimeout(() => calculateLeaveDays(), 500);
    }
  };
  
  const handleEndDateChange = (text: string) => {
    setEndDate(text);
    // Only calculate days if both dates are entered
    if (startDate) {
      // Try to calculate leave days after a short delay to allow for typing
      setTimeout(() => calculateLeaveDays(), 500);
    }
  };
  
  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navigate to history screen
  const navigateToHistory = () => {
    setShowSuccessModal(false);
    // Reset form
    setStartDate('');
    setEndDate('');
    setReason('');
    setLeaveDays(0);
    // Navigate to history screen
    router.push({
      pathname: '/leave',
      params: { view: 'history' }
    });
  };

  // Animation effect when modal is shown
  useEffect(() => {
    if (showSuccessModal) {
      // Reset animation values
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      
      // Run animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [showSuccessModal]);

  // Handle submit
  const handleSubmit = async () => {
    console.log('Submit button pressed');
    
    // Validation
    if (!startDate || !endDate) {
      console.log('Validation error: Missing dates');
      Alert.alert('Error', 'Please enter both start and end dates');
      return;
    }
    
    if (!reason.trim()) {
      console.log('Validation error: Missing reason');
      Alert.alert('Error', 'Please provide a reason for your leave');
      return;
    }
    
    if (!messId) {
      console.log('Validation error: Missing messId', { messId });
      Alert.alert('Error', 'Mess details are missing. Please try again');
      return;
    }
    
    if (!userEmail) {
      console.log('Validation error: Missing userEmail', { userEmail });
      Alert.alert('Error', 'User email not found. Please log in again');
      return;
    }
    
    // Validate date formats
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('Validation error: Invalid date format', { startDate, endDate });
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format');
      return;
    }
    
    // Parse the dates in the same way as calculateLeaveDays
    try {
      // Parse dates from parts
      const startParts = startDate.split('-');
      const endParts = endDate.split('-');
      
      const startYear = parseInt(startParts[0], 10);
      const startMonth = parseInt(startParts[1], 10) - 1; // Month is 0-indexed in JavaScript
      const startDay = parseInt(startParts[2], 10);
      
      const endYear = parseInt(endParts[0], 10);
      const endMonth = parseInt(endParts[1], 10) - 1; // Month is 0-indexed in JavaScript
      const endDay = parseInt(endParts[2], 10);
      
      // Create dates with components
      const start = new Date(startYear, startMonth, startDay);
      const end = new Date(endYear, endMonth, endDay);
      
      console.log(`Submit: Parsed dates - Start: ${start.toISOString()}, End: ${end.toISOString()}`);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.log('Validation error: Invalid date after parsing');
        Alert.alert('Error', 'Please enter valid dates');
        return;
      }
      
      // Check if start date is before end date
      if (start > end) {
        console.log('Validation error: End date before start date');
        Alert.alert('Error', 'End date cannot be before start date');
        return;
      }
      
      // Recalculate leave days to ensure consistency
      const diffTime = end.getTime() - start.getTime();
      const actualLeaveDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      console.log(`Submit: Calculated ${actualLeaveDays} days of leave`);
      
      // Check for minimum leave duration (if needed)
      if (actualLeaveDays < 1) {
        console.log('Validation error: Leave duration too short');
        Alert.alert('Error', 'Leave duration must be at least 1 day');
        return;
      }
      
      // Update leave days state to ensure UI matches what we're submitting
      setLeaveDays(actualLeaveDays);
      
      // Check if start date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        console.log('Validation error: Start date in past', { 
          start: start.toISOString(), 
          today: today.toISOString() 
        });
        Alert.alert('Error', 'Start date cannot be in the past');
        return;
      }
      
      // Format dates properly for API submission
      const formattedStartDate = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const formattedEndDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
      
      setIsSubmitting(true);
      console.log('Setting isSubmitting to true');
      
      // Get owner email for the mess
      let messOwnerEmail;
      try {
        // First try to get the user's mess details to find the mess information
        const userDataResponse = await fetch(getApiUrl(`/byEmail/${userEmail}`));
        if (userDataResponse.ok) {
          const userData = await userDataResponse.json();
          console.log('User data retrieved:', userData);
          
          // Get the mess ID and name from the user's data
          if (userData && userData.messId) {
            console.log('User belongs to mess with ID:', userData.messId);
            
            // If we found a joined mess ID but it's different from the current messId prop, use the one from user data
            const actualMessId = userData.messId || messId;
            
            // Try to find the owner by querying users in this mess
            const ownerApiUrl = getApiUrl(`/getUsersByMessId/${actualMessId}`);
            console.log('Fetching mess users from:', ownerApiUrl);
            
            try {
              const usersResponse = await fetch(ownerApiUrl);
              if (usersResponse.ok) {
                const users = await usersResponse.json();
                console.log('Mess users found:', users);
                
                // Find a user with owner type
                const ownerUser = Array.isArray(users) && users.find(user => user.userType === 'owner');
                if (ownerUser) {
                  messOwnerEmail = ownerUser.email;
                  console.log('Found owner email from users:', messOwnerEmail);
                }
              }
            } catch (userError) {
              console.error('Failed to get users for this mess:', userError);
            }
            
            // If we still don't have an owner email, use the one from the messName
            if (!messOwnerEmail && userData.messName) {
              console.log('Using messName to find owner:', userData.messName);
            }
          }
        }
        
        // If we still don't have an owner email, try a different approach
        if (!messOwnerEmail) {
          // Look for this mess ID directly (may be a different endpoint in your API)
          try {
            const messResponse = await fetch(getApiUrl(`/mess/getById/${messId}`));
            if (messResponse.ok) {
              const messData = await messResponse.json();
              messOwnerEmail = messData.email || messData.ownerEmail || messData.contact;
              console.log('Retrieved mess owner email from getById:', messOwnerEmail);
            } else {
              console.error('Failed to get mess details from ID');
            }
          } catch (messError) {
            console.error('Error fetching mess details by ID:', messError);
          }
        }
      } catch (error) {
        console.error('Error fetching owner information:', error);
      }
      
      // If we still couldn't get the owner email, use a fallback approach
      if (!messOwnerEmail) {
        console.warn('Using fallback for owner email');
        // Don't use the user's email as a fallback since they're not the owner
        // Instead, use a placeholder that would trigger a server-side error/validation
        messOwnerEmail = 'messs-owner-to-be-determined@example.com';
      }
      
      // Prepare leave application data
      const leaveData = {
        userEmail: userEmail,
        ownerEmail: messOwnerEmail,
        messId,
        messName,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        reason
      };
      
      console.log('Leave application data:', JSON.stringify(leaveData, null, 2));
      
      try {
        const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.APPLY);
        console.log('Making API call to:', apiUrl);
        
        // Use XMLHttpRequest for better debugging in React Native Web
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
          console.log('API response status:', xhr.status);
          console.log('API response:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('Leave application successful:', JSON.stringify(data, null, 2));
              
              // Show success modal instead of alert
              setShowSuccessModal(true);
            } catch (parseError) {
              console.error('Error parsing success response:', parseError);
              Alert.alert('Error', 'Received invalid response from server');
            }
          } else {
            console.log('Response not OK:', xhr.status);
            let errorMessage = 'Failed to submit leave application';
            
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Leave application failed:', errorData);
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              console.error('Error parsing error response:', parseError);
            }
            
            Alert.alert('Error', errorMessage);
          }
          setIsSubmitting(false);
        };
        
        xhr.onerror = function() {
          console.error('XHR error occurred');
          Alert.alert('Error', 'Network error occurred. Please try again later.');
          setIsSubmitting(false);
        };
        
        xhr.send(JSON.stringify(leaveData));
      } catch (error) {
        console.error('API call error:', error);
        Alert.alert('Error', 'Network error occurred. Please try again later.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.log('Date validation error:', error);
      Alert.alert('Error', 'Please enter valid dates (YYYY-MM-DD format)');
      return;
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
    
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Request Leave</Text>
        
        {messName && (
          <View style={[styles.messInfoContainer, { borderColor }]}>
            <Text style={[styles.messInfoLabel, { color: placeholderColor }]}>Mess:</Text>
            <Text style={[styles.messInfoValue, { color: textColor }]}>{messName}</Text>
          </View>
        )}
        
        <View style={styles.dateSelectionContainer}>
          <View style={styles.dateField}>
            <Text style={[styles.label, { color: textColor }]}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.dateInput,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6', 
                  color: textColor,
                  borderColor 
                }
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={placeholderColor}
              value={startDate}
              onChangeText={handleStartDateChange}
            />
          </View>
          
          <View style={styles.dateField}>
            <Text style={[styles.label, { color: textColor }]}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.dateInput,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6', 
                  color: textColor,
                  borderColor 
                }
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={placeholderColor}
              value={endDate}
              onChangeText={handleEndDateChange}
            />
          </View>
        </View>
        
        {/* Move leave days indicator to a better location and only show when both dates are valid */}
        
        <View style={styles.inputField}>
          <Text style={[styles.label, { color: textColor }]}>Reason for Leave</Text>
          {leaveDays > 0 && (
            <View style={[styles.leaveDaysIndicator, { backgroundColor: isDark ? '#374151' : '#e0e7ff', borderColor }]}>
              <Ionicons name="information-circle-outline" size={18} color={accentColor} />
              <Text style={[styles.leaveDaysText, { color: accentColor }]}>
                {leaveDays} {leaveDays === 1 ? 'day' : 'days'} of leave
              </Text>
            </View>
          )}
          <TextInput
            style={[
              styles.input, 
              styles.reasonInput,
              { 
                backgroundColor: isDark ? '#2a2a2a' : '#f3f4f6', 
                color: textColor,
                borderColor 
              }
            ]}
            placeholder="Enter reason for leave"
            placeholderTextColor={placeholderColor}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: buttonColor }]}
          onPress={() => {
            console.log('Submit button pressed directly');
            handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={[styles.policyCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.policyTitle, { color: textColor }]}>Leave Policy</Text>
        <View style={styles.policyItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={accentColor} />
          <Text style={[styles.policyText, { color: textColor }]}>
            Apply for leave at least 5 days in advance
          </Text>
        </View>
        <View style={styles.policyItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={accentColor} />
          <Text style={[styles.policyText, { color: textColor }]}>
            Leave applications are subject to approval by mess management
          </Text>
        </View>
        <View style={styles.policyItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={accentColor} />
          <Text style={[styles.policyText, { color: textColor }]}>
            You will not be charged for approved leave days
          </Text>
        </View>
        <View style={styles.policyItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={accentColor} />
          <Text style={[styles.policyText, { color: textColor }]}>
            Minimum leave duration is 5 days
          </Text>
        </View>
        <View style={styles.policyItem}>
          <Ionicons name="calendar-outline" size={16} color={accentColor} />
          <Text style={[styles.policyText, { color: textColor }]}>
            Enter dates in YYYY-MM-DD format (e.g., 2024-06-15)
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <Modal
        animationType="none" // Changed to none to use our custom animation
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          {showSuccessModal && <Confetti count={80} duration={6000} />}
          <Animated.View 
            style={[
              styles.modalContent, 
              { backgroundColor: cardBg, 
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim 
              }
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color={successColor} />
            </View>
            
            <Text style={[styles.modalTitle, { color: textColor }]}>Success!</Text>
            
            <Text style={[styles.modalMessage, { color: textColor }]}>
              Your leave application has been successfully submitted for {messName}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: buttonColor }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.buttonText}>Submit Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: successColor }]}
                onPress={navigateToHistory}
              >
                <Text style={styles.buttonText}>View History</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  dateInput: {
    height: 45,
  },
  reasonInput: {
    height: 100,
  },
  leaveDaysIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 4,
    borderWidth: 1,
  },
  leaveDaysText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputField: {
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  policyCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  messInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  messInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  messInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  debugContainer: {
    margin: 16,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
    marginBottom: 0,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ApplyLeaveTab; 