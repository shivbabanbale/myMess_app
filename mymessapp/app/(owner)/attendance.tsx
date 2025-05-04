import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

export default function AttendanceScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const accentColor = '#3b82f6';

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Array<any>>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [messId, setMessId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadOwnerData();
  }, []);

  useEffect(() => {
    // Fetch attendance data when the date changes
    if (ownerEmail && selectedDate) {
      fetchAttendanceForDate();
    }
  }, [selectedDate, ownerEmail]);

  // Effect for success popup animation
  useEffect(() => {
    if (showSuccessPopup) {
      // Reset opacity to 0
      fadeAnim.setValue(0);
      
      // Animate opacity to 1
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Hide the popup after 3 seconds
      const timer = setTimeout(() => {
        // Animate opacity back to 0
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccessPopup(false);
        });
      }, 2700);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup, fadeAnim]);

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      
      // Get owner email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        throw new Error('Owner email not found. Please login again.');
      }
      
      setOwnerEmail(email);
      console.log('Owner email:', email);
      
      // Fetch owner's mess data with proper URL encoding
      const messResponse = await fetch(`${API_BASE_URL}/mess/getByEmail/${encodeURIComponent(email)}`);
      
      if (!messResponse.ok) {
        throw new Error(`Failed to fetch mess details: ${messResponse.status}`);
      }
      
      const messData = await messResponse.json();
      console.log('Mess data:', messData);
      
      if (!messData.id) {
        throw new Error('No mess ID found for this owner.');
      }
      
      setMessId(messData.id);
      
      // Check if joinedUsers exists and is not empty
      if (!messData.joinedUsers || !Array.isArray(messData.joinedUsers) || messData.joinedUsers.length === 0) {
        console.log('No joined users found for this mess');
        setMembers([]);
        setLoading(false);
        return;
      }
      
      console.log('Joined users emails:', messData.joinedUsers);
      
      // Create an array to hold all member data
      const formattedMembers = [];
      
      // Fetch user details for each joined user email
      for (const userEmail of messData.joinedUsers) {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/byEmail/${encodeURIComponent(userEmail)}`);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log(`User data for ${userEmail}:`, userData);
            
            // Format the user data
            const member = {
              id: userData.id || userData.contact || userData.email || Math.random().toString(),
              name: userData.name || 'Unknown Member',
              image: userData.imageName ? { uri: `${API_BASE_URL}/profile/${encodeURIComponent(userData.contact || userData.email)}` } : null,
              email: userData.contact || userData.email,
              phoneNumber: userData.phoneNumber
            };
            
            formattedMembers.push(member);
          } else {
            console.warn(`Failed to fetch details for user ${userEmail}: ${userResponse.status}`);
          }
        } catch (e) {
          console.error(`Error processing user ${userEmail}:`, e);
        }
      }
      
      console.log('Formatted members for attendance:', formattedMembers);
      setMembers(formattedMembers);
      
      // Initialize attendance status
      const initialStatus = {};
      formattedMembers.forEach(member => {
        initialStatus[member.email] = 'Absent'; // Default to absent
      });
      
      setAttendanceStatus(initialStatus);
      
      // After setting members and initializing attendance, fetch current attendance for selected date
      if (selectedDate) {
        console.log('Fetching attendance for date:', selectedDate);
        fetchAttendanceForDate();
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setLoading(false);
      Alert.alert('Error', `Failed to load members: ${err.message}`);
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      if (!ownerEmail || !selectedDate) return;
      
      // Format date for API
      const formattedDate = formatDateForApi(selectedDate);
      
      // Fetch attendance data for this owner and date
      const response = await fetch(`${API_BASE_URL}/attendance/by-owner?ownerEmail=${ownerEmail}&date=${formattedDate}`);
      
      if (!response.ok) {
        console.log(`No attendance data found for date ${formattedDate}`);
        return;
      }
      
      const attendanceData = await response.json();
      
      if (attendanceData.success && attendanceData.payload) {
        // Create a new attendance status object
        const newStatus = {};
        
        // Initialize all members as absent
        members.forEach(member => {
          newStatus[member.email] = 'Absent';
        });
        
        // Update status for members with recorded attendance
        attendanceData.payload.forEach(record => {
          if (record.userEmail && record.status) {
            newStatus[record.userEmail] = record.status;
          }
        });
        
        setAttendanceStatus(newStatus);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      Alert.alert('Error', `Failed to fetch attendance data: ${err.message}`);
    }
  };

  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const toggleAttendance = (memberEmail) => {
    setAttendanceStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      newStatus[memberEmail] = prevStatus[memberEmail] === 'Present' ? 'Absent' : 'Present';
      return newStatus;
    });
  };

  const markAllPresent = () => {
    const newStatus = {};
    members.forEach(member => {
      newStatus[member.email] = 'Present';
    });
    setAttendanceStatus(newStatus);
  };

  const markAllAbsent = () => {
    const newStatus = {};
    members.forEach(member => {
      newStatus[member.email] = 'Absent';
    });
    setAttendanceStatus(newStatus);
  };

  const submitAttendance = async () => {
    try {
      setSubmitting(true);
      
      // Format date for API
      const formattedDate = formatDateForApi(selectedDate);
      
      // Prepare request data - only include members with emails
      const selectedMembers = {
        ownerEmail: ownerEmail,
        userEmails: members
          .filter(member => member.email && attendanceStatus[member.email] === 'Present')
          .map(member => member.email),
        date: formattedDate,
        status: 'Present'
      };
      
      console.log('Submitting attendance with data:', JSON.stringify(selectedMembers, null, 2));
      
      // Check if there are any members marked as present
      if (selectedMembers.userEmails.length === 0) {
        Alert.alert('No Members Selected', 'Please mark at least one member as present');
        setSubmitting(false);
        return;
      }
      
      // Submit attendance for selected members
      const response = await fetch(`${API_BASE_URL}/attendance/mark-selected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedMembers),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to mark attendance: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.success) {
        const message = `Attendance marked successfully for ${selectedMembers.userEmails.length} members`;
        setSuccessMessage(message);
        setShowSuccessPopup(true);
        
        // Animation will be handled by the useEffect
      } else {
        throw new Error(result.message || 'Failed to mark attendance');
      }
      
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setSubmitting(false);
      Alert.alert('Error', `Failed to mark attendance: ${err.message}`);
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.memberCard, 
        { backgroundColor: cardBg, borderColor }
      ]}
      onPress={() => toggleAttendance(item.email)}
    >
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: textColor }]}>
          {item.name}
        </Text>
        <Text style={[styles.memberEmail, { color: secondaryText }]}>
          {item.email}
        </Text>
      </View>
      
      <View style={[
        styles.attendanceStatus, 
        { 
          backgroundColor: attendanceStatus[item.email] === 'Present' 
            ? '#dcfce7' // light green
            : '#fee2e2', // light red
          borderColor: attendanceStatus[item.email] === 'Present'
            ? '#86efac' // darker green
            : '#fca5a5', // darker red
        }
      ]}>
        <Text style={[
          styles.statusText,
          { 
            color: attendanceStatus[item.email] === 'Present' 
              ? '#16a34a' // dark green
              : '#dc2626', // dark red
          }
        ]}>
          {attendanceStatus[item.email]}
        </Text>
        <Ionicons 
          name={attendanceStatus[item.email] === 'Present' ? 'checkmark-circle' : 'close-circle'} 
          size={20} 
          color={attendanceStatus[item.email] === 'Present' ? '#16a34a' : '#dc2626'} 
          style={styles.statusIcon}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Mark Attendance</Text>
      </View>
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <Animated.View style={[styles.successPopup, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <Text style={styles.successPopupText}>{successMessage}</Text>
        </Animated.View>
      )}
      
      {/* Date Selector */}
      <View style={[styles.dateSelector, { backgroundColor: cardBg, borderColor }]}>
        <Ionicons name="calendar" size={24} color={accentColor} />
        <TouchableOpacity onPress={toggleDatePicker} style={styles.dateSelectorText}>
          <Text style={[styles.dateText, { color: textColor }]}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          <Text style={[styles.dateHint, { color: secondaryText }]}>
            Tap to change date
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loaderText, { color: secondaryText }]}>
            Loading members...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}
              onPress={markAllPresent}
            >
              <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>
                All Present
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
              onPress={markAllAbsent}
            >
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                All Absent
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.membersList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color={secondaryText} />
                <Text style={[styles.emptyText, { color: textColor }]}>
                  No members found
                </Text>
                <Text style={[styles.emptySubtext, { color: secondaryText }]}>
                  Add members to your mess to mark attendance
                </Text>
              </View>
            }
          />
          
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { 
                backgroundColor: accentColor,
                opacity: submitting ? 0.7 : 1
              }
            ]}
            onPress={submitAttendance}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Attendance
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  dateSelectorText: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateHint: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  membersList: {
    paddingBottom: 90,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusIcon: {
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  successPopup: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 1000,
  },
  successPopupText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
}); 