import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Types
interface BookingSlot {
  id: string;
  userEmail: string;
  userName: string;
  messId: string;
  messEmail: string;
  messName: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  isPaid: boolean;
  paymentId?: string;
  amount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function SlotManagementScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [messEmail, setMessEmail] = useState('');
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const accentColor = isDark ? '#3b82f6' : '#4f46e5';
  
  // Status colors
  const statusColors = {
    PENDING: '#f59e0b',
    APPROVED: '#3b82f6',
    CONFIRMED: '#10b981',
    CANCELLED: '#ef4444',
    COMPLETED: '#8b5cf6'
  };
  
  // Fetch booking slots
  const fetchBookingSlots = async () => {
    try {
      setRefreshing(true);
      
      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'User email not found');
        setRefreshing(false);
        return;
      }
      
      setMessEmail(email);
      
      // Fetch pending booking slots
      const pendingResponse = await axios.get(`${API_BASE_URL}/slot/pending/mess/${email}`);
      const pendingSlots = pendingResponse.data || [];
      
      // Fetch confirmed booking slots
      const confirmedResponse = await axios.get(`${API_BASE_URL}/slot/confirmed/mess/${email}`);
      const confirmedSlots = confirmedResponse.data || [];
      
      // Combine and sort by date (most recent first)
      const allSlots = [...pendingSlots, ...confirmedSlots].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setSlots(allSlots);
    } catch (error) {
      console.error('Error fetching booking slots:', error);
      Alert.alert('Error', 'Failed to load booking slots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle slot approval
  const handleApproveSlot = async (slotId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/slot/approve/${slotId}`);
      
      // Update slot status in the local state
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === slotId ? { ...slot, status: 'APPROVED' } : slot
        )
      );
      
      Alert.alert('Success', 'Booking slot approved successfully');
    } catch (error) {
      console.error('Error approving slot:', error);
      Alert.alert('Error', 'Failed to approve booking slot');
    }
  };
  
  // Handle slot cancellation
  const handleCancelSlot = async (slotId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/slot/cancel/${slotId}`);
      
      // Update slot status in the local state
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === slotId ? { ...slot, status: 'CANCELLED' } : slot
        )
      );
      
      Alert.alert('Success', 'Booking slot cancelled successfully');
    } catch (error) {
      console.error('Error cancelling slot:', error);
      Alert.alert('Error', 'Failed to cancel booking slot');
    }
  };
  
  // Load data when component mounts
  useEffect(() => {
    fetchBookingSlots();
  }, []);
  
  // Render slot item
  const renderSlotItem = ({ item }: { item: BookingSlot }) => (
    <View style={[styles.slotCard, { backgroundColor: cardBg }]}>
      <View style={styles.slotHeader}>
        <View style={styles.slotUserInfo}>
          <Text style={[styles.slotUserName, { color: textColor }]}>{item.userName}</Text>
          <Text style={[styles.slotUserEmail, { color: secondaryText }]}>{item.userEmail}</Text>
        </View>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: statusColors[item.status] }
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.slotDetails}>
        <View style={styles.slotDetailItem}>
          <Ionicons name="calendar-outline" size={16} color={secondaryText} />
          <Text style={[styles.slotDetailText, { color: textColor }]}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        
        <View style={styles.slotDetailItem}>
          <Ionicons name="time-outline" size={16} color={secondaryText} />
          <Text style={[styles.slotDetailText, { color: textColor }]}>{item.timeSlot}</Text>
        </View>
        
        <View style={styles.slotDetailItem}>
          <Ionicons name="cash-outline" size={16} color={secondaryText} />
          <Text style={[styles.slotDetailText, { color: textColor }]}>
            {item.isPaid ? 'Paid' : 'Payment Pending'}
            {item.amount ? ` - ₹${item.amount}` : ''}
          </Text>
        </View>
      </View>
      
      {item.status === 'PENDING' && (
        <View style={styles.slotActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={() => handleApproveSlot(item.id)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]} 
            onPress={() => handleCancelSlot(item.id)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Booking Slots</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchBookingSlots}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/slot-settings' as any)}
          >
            <Ionicons name="settings-outline" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading booking slots...</Text>
        </View>
      ) : slots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={secondaryText} />
          <Text style={[styles.emptyText, { color: textColor }]}>No booking slots found</Text>
          <Text style={[styles.emptySubtext, { color: secondaryText }]}>
            Your booking slot requests will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          renderItem={renderSlotItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.slotList}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchBookingSlots}
          refreshing={refreshing}
        />
      )}
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  slotList: {
    padding: 16,
  },
  slotCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slotUserInfo: {
    flex: 1,
  },
  slotUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotUserEmail: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  slotDetails: {
    marginBottom: 16,
  },
  slotDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  slotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 