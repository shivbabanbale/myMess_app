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

interface PendingLeavesOwnerTabProps {
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

const PendingLeavesOwnerTab: React.FC<PendingLeavesOwnerTabProps> = ({ isDark, messId, messName, ownerEmail }) => {
  // State
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const pendingColor = isDark ? '#fbbf24' : '#f59e0b';
  const approveColor = isDark ? '#34d399' : '#10b981';
  const rejectColor = isDark ? '#ef4444' : '#dc2626';
  
  // Fetch pending leaves on component mount
  useEffect(() => {
    if (ownerEmail) {
      fetchPendingLeaves();
    }
  }, [ownerEmail]);
  
  // Fetch pending leaves from API
  const fetchPendingLeaves = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching pending leaves for owner:', ownerEmail);
      
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.GET_PENDING_BY_OWNER(ownerEmail));
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        // Sort leaves by application date (newest first)
        const sortedLeaves = data.sort((a, b) => 
          new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        );
        console.log('Sorted pending leaves:', sortedLeaves);
        setLeaves(sortedLeaves);
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
    fetchPendingLeaves();
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

  // Render empty state
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#4f46e5'} />
        ) : (
          <>
            <Ionicons 
              name="time-outline" 
              size={64} 
              color={subTextColor} 
            />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Pending Leaves
            </Text>
            <Text style={[styles.emptyMessage, { color: subTextColor }]}>
              There are no pending leave applications for your mess.
            </Text>
          </>
        )}
      </View>
    );
  };

  // Handle approve leave
  const handleApproveLeave = async (leaveId: string) => {
    try {
      setProcessingLeaveId(leaveId);
      console.log('Approving leave with ID:', leaveId);
      
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.APPROVE(leaveId));
      console.log('Approve API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Leave approved successfully');
        // Remove the approved leave from the list
        setLeaves(leaves.filter(leave => leave.id !== leaveId));
        Alert.alert('Success', 'Leave application approved successfully');
      } else {
        const errorData = await response.text();
        console.error('Error approving leave:', errorData);
        Alert.alert('Error', 'Failed to approve leave. Please try again.');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      Alert.alert('Error', 'An error occurred while approving the leave.');
    } finally {
      setProcessingLeaveId(null);
    }
  };
  
  // Handle reject leave
  const handleRejectLeave = async (leaveId: string) => {
    try {
      setProcessingLeaveId(leaveId);
      console.log('Rejecting leave with ID:', leaveId);
      
      const rejectionReason = "Leave rejected";
      const apiUrl = getApiUrl(API_ENDPOINTS.LEAVE.REJECT(leaveId)) + `?rejectionReason=${encodeURIComponent(rejectionReason)}`;
      console.log('Reject API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Leave rejected successfully');
        // Remove the rejected leave from the list
        setLeaves(leaves.filter(leave => leave.id !== leaveId));
        Alert.alert('Success', 'Leave application rejected successfully');
      } else {
        const errorData = await response.text();
        console.error('Error rejecting leave:', errorData);
        Alert.alert('Error', 'Failed to reject leave. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      Alert.alert('Error', 'An error occurred while rejecting the leave.');
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // Render leave item
  const LeaveItem = ({ item }: { item: Leave }) => {
    const formattedStartDate = formatDate(item.startDate);
    const formattedEndDate = formatDate(item.endDate);
    const leaveDays = calculateDays(item.startDate, item.endDate);
    const formattedApplicationDate = formatDate(item.applicationDate);
    const isProcessing = processingLeaveId === item.id;
    
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
        </View>
        
        <View style={[styles.reasonContainer, { borderColor }]}>
          <Text style={[styles.reasonLabel, { color: subTextColor }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: textColor }]}>{item.reason}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton, { borderColor: approveColor }]}
            onPress={() => handleApproveLeave(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={approveColor} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={approveColor} />
                <Text style={[styles.actionButtonText, { color: approveColor }]}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, { borderColor: rejectColor }]}
            onPress={() => handleRejectLeave(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={rejectColor} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={rejectColor} />
                <Text style={[styles.actionButtonText, { color: rejectColor }]}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={leaves}
        renderItem={({ item }) => <LeaveItem item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <Text style={[styles.headerText, { color: textColor }]}>
            Pending Leave Applications
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  approveButton: {
    marginRight: 8,
  },
  rejectButton: {
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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

export default PendingLeavesOwnerTab; 