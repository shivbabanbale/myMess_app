import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';

interface PendingLeavesTabProps {
  isDark: boolean;
  messId: string;
  messName: string;
}

// Define the leave type
interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  applicationDate: string;
  userEmail: string;
  ownerEmail: string;
  messId: string;
  messName: string;
}

const PendingLeavesTab: React.FC<PendingLeavesTabProps> = ({ isDark, messId, messName }) => {
  // State
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const pendingColor = isDark ? '#fbbf24' : '#f59e0b';
  
  // Get user email and fetch leaves on component mount
  useEffect(() => {
    const getUserEmailAndFetchLeaves = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
          fetchPendingLeaves(email);
        } else {
          setIsLoading(false);
          Alert.alert('Error', 'Unable to find user email. Please login again.');
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
        setIsLoading(false);
        Alert.alert('Error', 'An error occurred while fetching user data.');
      }
    };
    
    getUserEmailAndFetchLeaves();
  }, []);
  
  // Fetch pending leaves from API
  const fetchPendingLeaves = async (email: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching pending leaves for:', email);
      
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.GET_BY_USER_EMAIL(email));
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        // Filter only pending leaves
        const pendingLeaves = data.filter(leave => leave.status === 'PENDING');
        console.log('Pending leaves:', pendingLeaves);
        setLeaves(pendingLeaves);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
      Alert.alert('Error', 'Failed to fetch pending leaves. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingLeaves(userEmail);
  };
  
  // Format date string (YYYY-MM-DD to DD Month YYYY)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as is if invalid date
      }
      
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  // Calculate days between two dates
  const calculateDays = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
      return diffDays;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };
  
  // Calculate days until leave starts
  const calculateDaysUntil = (dateString: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const leaveDate = new Date(dateString);
      leaveDate.setHours(0, 0, 0, 0);
      
      const diffTime = leaveDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating days until:', error);
      return 0;
    }
  };
  
  // Render leave item
  const renderLeaveItem = ({ item }: { item: Leave }) => {
    const formattedStartDate = formatDate(item.startDate);
    const formattedEndDate = formatDate(item.endDate);
    const daysUntil = calculateDaysUntil(item.startDate);
    const leaveDays = calculateDays(item.startDate, item.endDate);
    const formattedApplicationDate = formatDate(item.applicationDate);
    
    console.log('Rendering leave item:', { id: item.id, status: item.status });
    
    return (
      <View style={[styles.leaveCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.leaveHeader}>
          <View style={styles.dateRange}>
            <Text style={[styles.dateRangeText, { color: textColor }]}>
              {formattedStartDate} - {formattedEndDate}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: pendingColor }]}>
            <Ionicons name="time-outline" size={14} color="#ffffff" />
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>
        
        <View style={styles.leaveDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>Days:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{leaveDays}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>Applied on:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{formattedApplicationDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: pendingColor }]}>Awaiting approval</Text>
          </View>
          
          {daysUntil > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subTextColor }]}>Starts in:</Text>
              <Text style={[styles.detailValue, { color: isDark ? '#3b82f6' : '#4f46e5' }]}>
                {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={[styles.reasonContainer, { borderColor }]}>
          <Text style={[styles.reasonLabel, { color: subTextColor }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: textColor }]}>{item.reason}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.cancelButton, { borderColor: '#ef4444' }]}
          onPress={() => {
            console.log('Cancel button pressed for leave ID:', item.id);
            // Direct confirmation without using Alert
            confirmDeleteLeave(item.id);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancel Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Direct function to delete leave without Alert
  const confirmDeleteLeave = (leaveId: string) => {
    console.log('confirmDeleteLeave called with ID:', leaveId);
    if (!leaveId) {
      console.error('Invalid leave ID:', leaveId);
      return;
    }
    
    executeDeleteLeave(leaveId);
  };
  
  // Execute the delete operation
  const executeDeleteLeave = async (leaveId: string) => {
    console.log('executeDeleteLeave called with ID:', leaveId);
    try {
      setIsLoading(true);
      console.log('Setting isLoading to true');
      console.log('Cancelling leave with ID:', leaveId);
      
      // Display all available props of the leave for debugging
      const leaveToCancel = leaves.find(l => l.id === leaveId);
      console.log('Leave details:', JSON.stringify(leaveToCancel, null, 2));
      
      // Use correct API endpoint from our config
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.DELETE(leaveId));
      console.log('Delete API URL:', apiUrl);
      
      // Use XMLHttpRequest instead of fetch
      console.log('Using XMLHttpRequest for DELETE request');
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        console.log('XHR response received, status:', xhr.status);
        console.log('XHR response text:', xhr.responseText || '(Empty response)');
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('XHR request successful');
          // Filter out the cancelled leave
          setLeaves(leaves.filter(leave => leave.id !== leaveId));
          Alert.alert('Success', 'Leave application cancelled successfully');
          
          // Refresh the list
          setTimeout(() => {
            if (userEmail) {
              console.log('Refreshing leave list for user:', userEmail);
              fetchPendingLeaves(userEmail);
            }
          }, 1000);
        } else {
          console.error('XHR request failed with status:', xhr.status);
          Alert.alert('Error', 'Failed to cancel leave. Please try again.');
        }
        setIsLoading(false);
      };
      
      xhr.onerror = function() {
        console.error('XHR error occurred');
        Alert.alert('Error', 'Network error occurred. Please try again later.');
        setIsLoading(false);
      };
      
      console.log('Sending XHR request...');
      xhr.send();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Alert.alert('Error', 'Network error occurred. Please try again later.');
      setIsLoading(false);
    }
  };
  
  // Handle cancel leave with Alert
  const handleCancelLeave = (leaveId: string) => {
    console.log('handleCancelLeave called with ID:', leaveId);
    if (!leaveId) {
      console.error('Invalid leave ID:', leaveId);
      Alert.alert('Error', 'Cannot cancel leave: Invalid leave ID');
      return;
    }
    
    Alert.alert(
      'Cancel Leave',
      'Are you sure you want to cancel this leave application?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => console.log('Cancel operation aborted by user')
        },
        {
          text: 'Yes',
          onPress: () => {
            console.log('User confirmed cancel for leave ID:', leaveId);
            executeDeleteLeave(leaveId);
          }
        }
      ]
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={pendingColor} />
        ) : (
          <>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={64} 
              color={subTextColor} 
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Pending Leaves
            </Text>
            <Text style={[styles.emptyMessage, { color: subTextColor }]}>
              You don't have any pending leave applications. Apply for leave to see them here.
            </Text>
          </>
        )}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={leaves}
        renderItem={renderLeaveItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <Text style={[styles.headerText, { color: textColor }]}>
            Pending Applications
          </Text>
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  leaveCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  leaveDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  reasonContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PendingLeavesTab; 