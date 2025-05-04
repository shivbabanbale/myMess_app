import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../../utils/apiConfig';

interface LeaveHistoryTabProps {
  isDark: boolean;
  messId: string;
  messName: string;
}

// Define leave type
interface Leave {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  applicationDate: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
  userEmail: string;
  ownerEmail: string;
  messId: string;
  messName: string;
}

const LeaveHistoryTab: React.FC<LeaveHistoryTabProps> = ({ isDark, messId, messName }) => {
  // State
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  
  // Get user email and fetch leaves on component mount
  useEffect(() => {
    const getUserEmailAndFetchLeaves = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
          fetchLeaveHistory(email);
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
  
  // Fetch leave history from API
  const fetchLeaveHistory = async (email: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching leave history for:', email);
      
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.GET_BY_USER_EMAIL(email));
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        // Sort leaves by date (newest first)
        const sortedLeaves = data.sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        console.log('Sorted leaves:', sortedLeaves);
        setLeaves(sortedLeaves);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
      Alert.alert('Error', 'Failed to fetch leave history. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaveHistory(userEmail);
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
  
  // Get status color based on leave status
  const getStatusColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'APPROVED':
        return '#10b981'; // Green
      case 'REJECTED':
        return '#ef4444'; // Red
      case 'PENDING':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };
  
  // Render leave item
  const renderLeaveItem = ({ item }: { item: Leave }) => {
    const formattedStartDate = formatDate(item.startDate);
    const formattedEndDate = formatDate(item.endDate);
    const leaveDays = calculateDays(item.startDate, item.endDate);
    const formattedApplicationDate = formatDate(item.applicationDate);
    const statusColor = getStatusColor(item.status);
    
    return (
      <View style={[styles.leaveCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.leaveHeader}>
          <View style={styles.dateRange}>
            <Text style={[styles.dateRangeText, { color: textColor }]}>
              {formattedStartDate} - {formattedEndDate}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons 
              name={
                item.status.toUpperCase() === 'APPROVED' ? 'checkmark-circle-outline' : 
                item.status.toUpperCase() === 'REJECTED' ? 'close-circle-outline' : 'time-outline'
              } 
              size={14} 
              color="#ffffff" 
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.leaveDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>Days:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{leaveDays}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>Applied on:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{formattedApplicationDate}</Text>
          </View>
          
          {item.status.toUpperCase() === 'APPROVED' && item.approvedDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>Approved on:</Text>
              <Text style={[styles.detailValue, { color: '#10b981' }]}>{formatDate(item.approvedDate)}</Text>
            </View>
          )}
          
          {item.status.toUpperCase() === 'REJECTED' && item.rejectedDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>Rejected on:</Text>
              <Text style={[styles.detailValue, { color: '#ef4444' }]}>{formatDate(item.rejectedDate)}</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.reasonContainer, { borderColor }]}>
          <Text style={[styles.reasonLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>Reason for Leave:</Text>
          <Text style={[styles.reasonText, { color: textColor }]}>{item.reason}</Text>
        </View>
        
        {item.status.toUpperCase() === 'REJECTED' && item.rejectionReason && (
          <View style={[styles.rejectionContainer, { borderColor: '#ef4444' }]}>
            <Text style={[styles.reasonLabel, { color: '#ef4444' }]}>Reason for Rejection:</Text>
            <Text style={[styles.reasonText, { color: textColor }]}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#4f46e5'} />
        ) : (
          <>
            <Ionicons 
              name="document-text-outline" 
              size={64} 
              color={isDark ? '#a0a0a0' : '#666666'} 
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Leave History
            </Text>
            <Text style={[styles.emptyMessage, { color: isDark ? '#a0a0a0' : '#666666' }]}>
              You haven't applied for any leaves yet. Your leave history will appear here once you apply for leave.
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
            Leave History
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
  rejectionContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    borderColor: '#ef4444',
  },
  reasonLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
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

export default LeaveHistoryTab;