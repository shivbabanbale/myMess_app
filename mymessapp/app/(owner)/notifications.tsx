import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessPopup from '../../components/Common/SuccessPopup';

// Fixed API endpoint that works with the existing backend
const API_BASE_URL = 'http://localhost:8080';

// Define local constants until the imports are resolved
const COLORS = {
  primary: '#0a7ea4',
  white: '#FFFFFF',
  lightWhite: '#F8F9FA',
  gray: '#687076',
  gray2: '#E6E8EB',
};

const FONTS = {
  h3: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: 'bold',
  },
  h4: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body3: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: 'normal',
  },
  body4: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: 'normal',
  },
};

const SIZES = {
  small: 8,
  medium: 16,
  large: 24,
};

// Define interfaces
interface Member {
  id: string;
  email: string;
  name: string;
  contact?: string;
  phoneNumber?: string;
}

interface MessData {
  id: string;
  name: string;
  email: string;
  joinedUsers?: string[];
}

interface NotificationResponse {
  success: boolean;
  successCount: number;
}

interface User {
  id: string;
  name: string;
  contact: string;
  messId: string;
  phoneNumber?: string;
}

const NotificationsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [messId, setMessId] = useState('');
  const [messName, setMessName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const getOwnerDetails = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        const name = await AsyncStorage.getItem('messName');
        
        if (userEmail) {
          setOwnerEmail(userEmail);
          if (name) {
            setMessName(name);
          }
          
          // Get mess ID by owner email
          await fetchMessIdByOwnerEmail(userEmail);
        }
      } catch (error) {
        console.error('Error getting owner details:', error);
        Alert.alert('Error', 'Could not retrieve owner details. Please try again.');
      }
    };

    getOwnerDetails();
  }, []);

  const fetchMessIdByOwnerEmail = async (email: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mess/getByEmail/${encodeURIComponent(email)}`);
      
      if (response.data && response.data.id) {
        const messData = response.data as MessData;
        setMessId(messData.id);
        
        if (!messName && messData.name) {
          setMessName(messData.name);
        }
        
        // Now fetch members with the mess data
        await fetchMembers(messData);
      } else {
        console.error('No mess ID found in response:', response.data);
        Alert.alert('Error', 'Could not retrieve mess information');
      }
    } catch (error) {
      console.error('Error fetching mess data:', error);
      Alert.alert('Error', 'Failed to load mess information');
    }
  };

  const fetchMembers = async (messData: MessData) => {
    setLoading(true);
    try {
      console.log(`Fetching members for mess ID: ${messData.id}`);
      
      // Check if messData has joinedUsers array
      if (!messData.joinedUsers || !Array.isArray(messData.joinedUsers) || messData.joinedUsers.length === 0) {
        console.log('No joined users found in this mess');
        setMembers([]);
        setLoading(false);
        return;
      }
      
      console.log(`Mess has ${messData.joinedUsers.length} joined users`);
      
      // Create an array to hold all member data
      const formattedMembers: Member[] = [];
      
      // Fetch user details for each joined user email
      for (const userEmail of messData.joinedUsers) {
        try {
          const userResponse = await axios.get(`${API_BASE_URL}/byEmail/${encodeURIComponent(userEmail)}`);
          
          if (userResponse.data) {
            const userData = userResponse.data;
            console.log(`Fetched user data for ${userEmail}`);
            
            // Format the user data
            const member: Member = {
              id: userData.id || userData.contact || userEmail || Math.random().toString(),
              name: userData.name || 'Unknown Member',
              email: userData.contact || userEmail,
              phoneNumber: userData.phoneNumber
            };
            
            formattedMembers.push(member);
          } else {
            console.warn(`No data returned for user ${userEmail}`);
          }
        } catch (error) {
          console.error(`Error fetching details for user ${userEmail}:`, error);
        }
      }
      
      console.log(`Successfully loaded ${formattedMembers.length} members`);
      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', 'Failed to load mess members');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (email: string) => {
    if (selectedMembers.includes(email)) {
      setSelectedMembers(selectedMembers.filter(item => item !== email));
    } else {
      setSelectedMembers([...selectedMembers, email]);
    }
  };

  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.email));
    }
    setIsSelectAll(!isSelectAll);
  };

  const sendNotification = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending notifications to:', selectedMembers);
      
      // Format data as URLSearchParams for x-www-form-urlencoded content type
      const formData = new URLSearchParams();
      
      // Different endpoint and parameter naming based on whether we're sending to one or multiple users
      let endpoint = '';
      
      if (selectedMembers.length === 1) {
        // Single user endpoint
        endpoint = `${API_BASE_URL}/api/notifications/send`;
        formData.append('recipientEmail', selectedMembers[0]);
      } else {
        // Multiple users endpoint
        endpoint = `${API_BASE_URL}/api/notifications/send-bulk`;
        formData.append('recipientEmails', selectedMembers.join(','));
      }
      
      // Common parameters for both endpoints
      formData.append('senderEmail', ownerEmail);
      formData.append('title', title);
      formData.append('message', message);
      formData.append('notificationType', 'OWNER_MESSAGE');
      formData.append('relatedEntityId', messId);
      
      console.log(`Sending to ${endpoint} with data:`, formData.toString());
      
      const response = await axios({
        method: 'POST',
        url: endpoint,
        data: formData.toString(),
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Notification response:', response.data);
      
      if (response.data && response.data.success) {
        const successCount = response.data.successCount || selectedMembers.length;
        setSuccessMessage(`Notification sent to ${successCount} ${successCount === 1 ? 'member' : 'members'}`);
        setShowSuccess(true);
        setTitle('');
        setMessage('');
        setSelectedMembers([]);
        setIsSelectAll(false);
      } else {
        Alert.alert('Error', 'Failed to send notifications');
      }
    } catch (error: unknown) {
      console.error('Error sending notifications:', error);
      
      // Type guard for AxiosError
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const responseData = axiosError.response?.data as any;
        const errorMessage = responseData?.message || axiosError.message || 'Unknown error';
        
        // Special handling for specific error codes
        if (status === 403) {
          Alert.alert(
            'Authentication Error', 
            'You do not have permission to send notifications. Please try again.'
          );
        } else if (status === 404) {
          Alert.alert(
            'API Error',
            'The notification service endpoint could not be found. Please contact support.'
          );
        } else {
          Alert.alert('Error', `Failed to send notifications: ${status} - ${errorMessage}`);
        }
      } else {
        Alert.alert('Error', 'Network error or server unreachable');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity 
      style={styles.memberItem}
      onPress={() => toggleMemberSelection(item.email)}
    >
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
      </View>
      <View style={[
        styles.checkbox, 
        selectedMembers.includes(item.email) ? styles.checkboxSelected : {}
      ]}>
        {selectedMembers.includes(item.email) && (
          <Ionicons name="checkmark" size={18} color={COLORS.white} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Send Notifications',
          headerTitleStyle: { color: COLORS.primary, ...FONTS.h3 },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Compose Message</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Enter notification message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.selectContainer}>
        <View style={styles.selectHeader}>
          <Text style={styles.sectionTitle}>Select Recipients</Text>
          <TouchableOpacity 
            style={styles.selectAllContainer}
            onPress={toggleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {isSelectAll ? 'Deselect All' : 'Select All'}
            </Text>
            <View style={[
              styles.checkbox, 
              isSelectAll ? styles.checkboxSelected : {}
            ]}>
              {isSelectAll && (
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={renderMemberItem}
            contentContainerStyle={styles.membersList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members found in this mess</Text>
            }
          />
        )}
      </View>

      <TouchableOpacity 
        style={[
          styles.sendButton,
          (loading || !title || !message || selectedMembers.length === 0) && styles.disabledButton
        ]}
        onPress={sendNotification}
        disabled={loading || !title || !message || selectedMembers.length === 0}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <MaterialIcons name="send" size={20} color={COLORS.white} style={styles.sendIcon} />
            <Text style={styles.sendButtonText}>
              Send to {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <SuccessPopup 
        visible={showSuccess} 
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    padding: SIZES.medium,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.primary,
    marginBottom: SIZES.small,
  },
  inputContainer: {
    marginBottom: SIZES.small,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: SIZES.small,
    padding: SIZES.small,
    ...FONTS.body3,
  },
  messageInput: {
    height: 100,
  },
  selectContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginRight: 8,
  },
  membersList: {
    paddingBottom: SIZES.small,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  memberEmail: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.gray2,
  },
  sendButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  sendIcon: {
    marginRight: 8,
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default NotificationsScreen; 