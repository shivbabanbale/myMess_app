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
import { getApiUrl, API_ENDPOINTS } from '@/app/utils/apiConfig';

interface AllLeavesTabProps {
  isDark: boolean;
  messId: string;
  messName: string;
  ownerEmail: string;
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

const AllLeavesTab: React.FC<AllLeavesTabProps> = ({ isDark, messId, messName, ownerEmail }) => {
  // State
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const pendingColor = isDark ? '#fbbf24' : '#f59e0b';
  const approvedColor = isDark ? '#34d399' : '#10b981';
  const rejectedColor = isDark ? '#ef4444' : '#dc2626';
  
  // Fetch all leaves on component mount
  useEffect(() => {
    if (ownerEmail) {
      fetchAllLeaves();
    }
  }, [ownerEmail]);
  
  // Fetch all leaves from API
  const fetchAllLeaves = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all leaves for owner:', ownerEmail);
      
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.GET_BY_OWNER_EMAIL(ownerEmail));
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        // Sort leaves by application date (newest first)
        const sortedLeaves = data.sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        console.log('Sorted leaves:', sortedLeaves);
        setLeaves(sortedLeaves);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      Alert.alert('Error', 'Failed to fetch leave applications. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllLeaves();
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
    switch (status.toUpperCase()) {
      case 'PENDING':
        return pendingColor;
      case 'APPROVED':
        return approvedColor;
      case 'REJECTED':
        return rejectedColor;
      default:
        return pendingColor;
    }
  };
  
  // Get status icon based on leave status
  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'time-outline';
      case 'APPROVED':
        return 'checkmark-circle-outline';
      case 'REJECTED':
        return 'close-circle-outline';
      default:
        return 'time-outline';
    }
  };
  
  // Format status text
  const formatStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };
  
  // Render leave item
  const renderLeaveItem = ({ item }: { item: Leave }) => {
    const formattedStartDate = formatDate(item.startDate);
    const formattedEndDate = formatDate(item.endDate);
    const leaveDays = calculateDays(item.startDate, item.endDate);
    const formattedApplicationDate = formatDate(item.applicationDate);
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const statusText = formatStatus(item.status);
    
    return (
      <View style={[styles.leaveCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.leaveHeader}>
          <View style={styles.dateRange}>
            <Text style={[styles.dateRangeText, { color: textColor }]}>
              {formattedStartDate} - {formattedEndDate}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon} size={14} color="#ffffff" />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.leaveDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>User:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{item.userEmail}</Text>
          </View>
          
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
            <Text style={[styles.detailValue, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <View style={[styles.reasonContainer, { borderColor }]}>
          <Text style={[styles.reasonLabel, { color: subTextColor }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: textColor }]}>{item.reason}</Text>
        </View>
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
              color={subTextColor} 
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Leave Applications
            </Text>
            <Text style={[styles.emptyMessage, { color: subTextColor }]}>
              There are no leave applications for your mess.
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
            All Leave Applications
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

export default AllLeavesTab; 