import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - ensure it's properly encoded for special characters
const API_BASE_URL = 'http://localhost:8080';
// const API_BASE_URL = 'http://10.0.2.2:8080'; // For Android emulator
// const API_BASE_URL = 'http://192.168.1.x:8080'; // Use your local IP for physical devices

// Sample current mess subscription
const currentMess = {
  id: 'current1',
  name: 'Green Garden Mess',
  image: require('@/assets/images/react-logo.png'),
  address: 'Near College Campus, Pune',
  joinDate: '01 May 2023',
  subscription: 'Monthly (₹3,500)',
  mealType: 'Veg, Two Meals/day',
  duesAmount: '₹0',
  remainingDays: 12,
  rating: 4.5,
};

// Sample previous mess subscriptions
const previousMesses = [
  {
    id: 'prev1',
    name: 'Royal Dining Mess',
    image: require('@/assets/images/react-logo.png'),
    address: 'Koregaon Park, Pune',
    joinDate: '12 Jan 2023',
    leaveDate: '30 Apr 2023',
    mealType: 'Non-Veg, One Meal/day',
    reason: 'Relocated'
  },
  {
    id: 'prev2',
    name: 'Student Special Mess',
    image: require('@/assets/images/react-logo.png'),
    address: 'University Road, Pune',
    joinDate: '05 Aug 2022',
    leaveDate: '10 Jan 2023',
    mealType: 'Veg, Two Meals/day',
    reason: 'Semester break'
  }
];

// Sample order history data (existing data)
const historyData = [
  {
    id: '1',
    messName: 'Green Garden Mess',
    date: '18 June 2023',
    time: '1:30 PM',
    amount: '₹120',
    items: 'Lunch - Thali Special',
    status: 'completed',
  },
  {
    id: '2',
    messName: 'Royal Dining Mess',
    date: '16 June 2023',
    time: '8:15 PM',
    amount: '₹150',
    items: 'Dinner - North Indian',
    status: 'completed',
  },
  {
    id: '3',
    messName: 'Royal Dining Mess',
    date: '15 June 2023',
    time: '7:45 AM',
    amount: '₹80',
    items: 'Breakfast - South Indian',
    status: 'completed',
  },
  {
    id: '4',
    messName: 'Student Special Mess',
    date: '12 June 2023',
    time: '2:10 PM',
    amount: '₹100',
    items: 'Lunch - Regular Thali',
    status: 'cancelled',
  },
  {
    id: '5',
    messName: 'Student Special Mess',
    date: '10 June 2023',
    time: '8:30 PM',
    amount: '₹130',
    items: 'Dinner - Punjabi Special',
    status: 'completed',
  },
];

// Sample leave history data
const leaveHistory = [
  {
    id: 'leave1',
    messName: 'Green Garden Mess',
    startDate: '10 July 2023',
    endDate: '15 July 2023',
    days: 6,
    reason: 'Family vacation',
    status: 'approved',
  },
  {
    id: 'leave2',
    messName: 'Green Garden Mess',
    startDate: '22 June 2023',
    endDate: '24 June 2023',
    days: 3,
    reason: 'Personal work',
    status: 'approved',
  },
  {
    id: 'leave3',
    messName: 'Royal Dining Mess',
    startDate: '05 April 2023',
    endDate: '10 April 2023',
    days: 6,
    reason: 'Going home',
    status: 'approved',
  },
  {
    id: 'leave4',
    messName: 'Student Special Mess',
    startDate: '25 Dec 2022',
    endDate: '31 Dec 2022',
    days: 7,
    reason: 'Winter break',
    status: 'approved',
  },
];

// Add BookingSlot interface after LeaveHistoryItem interface
interface BookingSlot {
  id: string;
  messName: string;
  messId: string;
  date: string;
  timeSlot: string;
  status: string;
  createdAt?: string;
  paid?: boolean;
  paymentId?: string;
  confirmedAt?: string;
}

// History item component interfaces
interface HistoryItemProps {
  item: {
    id: string;
    messName: string;
    date: string;
    time: string;
    amount: string;
    items: string;
    status: string;
  };
  isDark: boolean;
}

interface CurrentMessProps {
  mess: {
    id: string;
    name: string;
    image: any;
    address: string;
    joinDate: string;
    subscription: string;
    mealType: string;
    duesAmount: string;
    remainingDays: number;
    elapsedDays: number;
    totalDays: number;
    rating: number;
    email?: string;
    subscriptionEndDate: string;
    subscriptionPlan: number;
  };
  isDark: boolean;
}

interface PreviousMessItemProps {
  mess: {
    id: string;
    name: string;
    image: any;
    address: string;
    joinDate: string;
    leaveDate: string;
    mealType: string;
    reason: string;
  };
  isDark: boolean;
}

// API-fetched mess type interfaces
interface ApiUser {
  id: string;
  name: string;
  email: string;
  contact: string;
  messId: string;
  // Add other fields as needed
}

interface ApiMess {
  id: string;
  name: string;
  messName: string;
  messAddress: string;
  messType: string;
  email: string;
  subscriptionPlan: number;
  pricePerMeal: number;
  capacity: number;
  currentDate: string;
  imageName: string;
  joinedUsers: string[];
  // Add other fields as needed
}

// Current Mess Component
const CurrentMessCard: React.FC<CurrentMessProps> = ({ mess, isDark }) => {
  const router = useRouter();
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const accentColor = '#3b82f6';
  
  const navigateToMessDetails = () => {
    router.push({
      pathname: '/mess/subscription-details',
      params: { id: mess.id }
    });
  };
  
  const navigateToPayment = () => {
    router.push({
      pathname: '/screens/mess/pay-dues',
      params: { 
        messId: mess.id,
        ownerEmail: mess.email || ''
      }
    });
  };
  
  const navigateToReview = () => {
    router.push({
      pathname: '/screens/mess/submit-review',
      params: {
        messId: mess.id,
        messEmail: mess.email || '',
        messName: mess.name
      }
    });
  };
  
  const navigateToLeave = () => {
    // Navigate to leave screen with mess details
    router.push({
      pathname: '/leave',
      params: { 
        messId: mess.id,
        messName: mess.name
      }
    });
  };
  
  // Function to determine image source
  const getImageSource = () => {
    // If the mess has an email property, use it to fetch the image
    if (mess.email) {
      return { uri: `${API_BASE_URL}/mess/profile/${mess.email}` };
    }
    // Otherwise use the provided image
    return mess.image;
  };

  return (
    <View style={[styles.currentMessCard, { backgroundColor: cardBg }]}>
      <View style={styles.currentMessHeader}>
        <Text style={[styles.sectionLabel, { color: secondaryText }]}>CURRENT SUBSCRIPTION</Text>
      </View>
      
      <View style={styles.currentMessContent}>
        <Image source={getImageSource()} style={styles.messImage} />
        
        <View style={styles.messDetails}>
          <Text style={[styles.messName, { color: textColor }]}>{mess.name}</Text>
          <Text style={[styles.messAddress, { color: secondaryText }]}>{mess.address}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: secondaryText }]}>Joined on</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{mess.joinDate}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: secondaryText }]}>Plan</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{mess.subscription}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: secondaryText }]}>Meal Type</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{mess.mealType}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: secondaryText }]}>Pending Dues</Text>
              <Text style={[styles.detailValue, { 
                color: mess.duesAmount === '₹0' || mess.duesAmount === '₹0.0' ? '#4CAF50' : '#FF5252' 
              }]}>
                {mess.duesAmount}
              </Text>
            </View>
          </View>
          
          <View style={styles.subscriptionStatus}>
            <View style={styles.subscriptionPeriod}>
              <Text style={[styles.subscriptionPeriodText, { color: secondaryText }]}>
                Subscription period ({mess.totalDays} days):
              </Text>
              <View style={styles.dateRange}>
                <Text style={[styles.dateText, { color: isDark ? '#e1f1ff' : '#333333', backgroundColor: isDark ? '#2d3748' : '#e1f1ff' }]}>
                  {mess.joinDate}
                </Text>
                <Ionicons name="arrow-forward" size={12} color="#3b82f6" style={styles.arrowIcon} />
                <Text style={[styles.dateText, { color: isDark ? '#e1f1ff' : '#333333', backgroundColor: isDark ? '#2d3748' : '#e1f1ff' }]}>
                  {mess.subscriptionEndDate}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Add subscription progress indicator */}
          <View style={styles.progressContainer}>
            {/* Debug log for progress bar values */}
            {(() => { 
              console.log(`PROGRESS BAR DEBUG - elapsedDays: ${mess.elapsedDays}, totalDays: ${mess.totalDays}, percentage: ${(mess.elapsedDays / mess.totalDays) * 100}%`);
              return null;
            })()}
            
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressLabel, { color: secondaryText }]}>
                Progress: {mess.elapsedDays} / {mess.totalDays} days
              </Text>
              <Text style={[styles.remainingDaysText, { 
                color: mess.remainingDays > 5 ? '#4CAF50' : mess.remainingDays > 2 ? '#FF9800' : '#FF5252' 
              }]}>
                {mess.remainingDays} days remaining
              </Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#333333' : '#e0e0e0' }]}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.min(100, Math.max(0, (mess.elapsedDays / mess.totalDays) * 100))}%`,
                    backgroundColor: mess.remainingDays > 5 ? '#4CAF50' : mess.remainingDays > 2 ? '#FF9800' : '#FF5252'
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: accentColor }]}
              onPress={navigateToMessDetails}
            >
              <Ionicons name="information-circle-outline" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              onPress={navigateToPayment}
            >
              <Ionicons name="card-outline" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Pay Dues</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
              onPress={navigateToLeave}
            >
              <Ionicons name="airplane-outline" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
          
          {/* Rating Card */}
          <View style={[styles.ratingCard, { backgroundColor: isDark ? '#2d3748' : '#f0f4ff', borderColor: isDark ? '#3b82f6' : '#dbeafe' }]}>
            <View style={styles.ratingHeader}>
              <Text style={[styles.ratingTitle, { color: textColor }]}>Rate Your Experience</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star}
                    name={star <= mess.rating ? "star" : "star-outline"} 
                    size={16} 
                    color="#FFD700" 
                    style={styles.ratingStar}
                  />
                ))}
                <Text style={[styles.ratingValue, { color: textColor }]}>
                  {mess.rating ? mess.rating.toFixed(1) : 'No rating'}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.ratingInfo, { color: secondaryText }]}>
              Share your feedback to help us improve
            </Text>
            
            <TouchableOpacity 
              style={[styles.rateButton, { backgroundColor: '#3b82f6' }]}
              onPress={navigateToReview}
            >
              <Ionicons name="star-outline" size={16} color="#ffffff" />
              <Text style={styles.rateButtonText}>Rate & Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Previous Mess Item Component
const PreviousMessItem: React.FC<PreviousMessItemProps> = ({ mess, isDark }) => {
  const router = useRouter();
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  
  const navigateToMessDetails = () => {
    router.push({
      pathname: '/mess/mess-details',
      params: { id: mess.id }
    });
  };
  
  return (
    <TouchableOpacity 
      style={[styles.previousMessItem, { backgroundColor: cardBg }]}
      onPress={navigateToMessDetails}
    >
      <Image source={mess.image} style={styles.prevMessImage} />
      
      <View style={styles.prevMessDetails}>
        <Text style={[styles.prevMessName, { color: textColor }]}>{mess.name}</Text>
        <Text style={[styles.prevMessAddress, { color: secondaryText }]}>{mess.address}</Text>
        
        <View style={styles.prevMessPeriod}>
          <Ionicons name="time-outline" size={14} color={secondaryText} />
          <Text style={[styles.periodText, { color: secondaryText }]}>
            {mess.joinDate} - {mess.leaveDate}
          </Text>
        </View>
        
        <Text style={[styles.mealTypeText, { color: secondaryText }]}>{mess.mealType}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={secondaryText} />
    </TouchableOpacity>
  );
};

// History item component
const HistoryItem: React.FC<HistoryItemProps> = ({ item, isDark }) => {
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const statusColor = item.status === 'completed' ? '#4CAF50' : '#FF5252';
  
  return (
    <View style={[styles.historyCard, { backgroundColor: cardBg }]}>
      <View style={styles.cardHeader}>
        <View style={styles.messInfo}>
          <Text style={[styles.messName, { color: textColor }]}>{item.messName}</Text>
          <Text style={[styles.dateTime, { color: secondaryText }]}>
            {item.date} • {item.time}
          </Text>
        </View>
        <Text style={[styles.amount, { color: textColor }]}>{item.amount}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.items, { color: textColor }]}>{item.items}</Text>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Add a new interface for leave history items
interface LeaveHistoryItemProps {
  item: {
    id: string;
    messName: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: string;
  };
  isDark: boolean;
}

// Before the HistoryItem component, add a LeaveHistoryItem component
const LeaveHistoryItem: React.FC<LeaveHistoryItemProps> = ({ item, isDark }) => {
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };
  
  return (
    <View style={[styles.historyItem, { backgroundColor: cardBg }]}>
      <View style={styles.historyItemHeader}>
        <Text style={[styles.historyItemTitle, { color: textColor }]}>{item.messName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </View>
      
      <View style={styles.historyItemDetails}>
        <View style={styles.historyDetailRow}>
          <Text style={[styles.historyDetailLabel, { color: secondaryText }]}>Period:</Text>
          <Text style={[styles.historyDetailValue, { color: textColor }]}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>
        
        <View style={styles.historyDetailRow}>
          <Text style={[styles.historyDetailLabel, { color: secondaryText }]}>Days:</Text>
          <Text style={[styles.historyDetailValue, { color: textColor }]}>{item.days}</Text>
        </View>
        
        <View style={styles.historyDetailRow}>
          <Text style={[styles.historyDetailLabel, { color: secondaryText }]}>Reason:</Text>
          <Text style={[styles.historyDetailValue, { color: textColor }]}>{item.reason}</Text>
        </View>
      </View>
    </View>
  );
};

// Add BookingSlotItem component after LeaveHistoryItem component
const BookingSlotItem: React.FC<{ item: BookingSlot; isDark: boolean; onPaymentComplete?: () => void }> = ({ item, isDark, onPaymentComplete }) => {
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const [isPaying, setIsPaying] = useState(false);
  const [isItemPaid, setIsItemPaid] = useState(item.paid || false);
  
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#3b82f6';
      case 'CONFIRMED':
        return '#10b981';
      case 'COMPLETED':
        return '#10b981';
      case 'CANCELLED':
        return '#ef4444';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };
  
  // Update the handlePayment function to update local state immediately
  const handlePayment = async () => {
    try {
      setIsPaying(true);
      
      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      
      if (!email) {
        Alert.alert('Error', 'User email not found. Please login again.');
        setIsPaying(false);
        return;
      }
      
      // Generate a payment ID
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      console.log(`Making payment API call for slot ${item.id} with paymentId ${paymentId}`);
      
      // Make API call to confirm the slot payment (correct endpoint from controller)
      const response = await fetch(`${API_BASE_URL}/slot/confirm/${item.id}?paymentId=${encodeURIComponent(paymentId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment confirmation failed:', errorText);
        Alert.alert('Payment Failed', 'Could not confirm payment. Please try again later.');
        setIsPaying(false);
        return;
      }
      
      const data = await response.json();
      console.log('Payment confirmed successfully, API response:', JSON.stringify(data));
      
      // Log specifically the payment-related fields
      console.log(`Payment status details - status: ${data.status}, paid: ${data.paid}, paymentId: ${data.paymentId}`);
      
      // Update local state immediately
      setIsItemPaid(true);
      
      // Show success message
      Alert.alert(
        'Payment Successful', 
        'Your booking slot has been confirmed with payment ID: ' + paymentId,
        [{ text: 'OK', onPress: onPaymentComplete }]
      );
      
      // Refresh booking slots
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'An error occurred during payment confirmation. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };
  
  // Update the canShowPayButton condition to check local state too
  const canShowPayButton = 
    item.status.toUpperCase() === 'APPROVED' && 
    !isItemPaid;
    
  // Modify the payment status display to use the local state
  return (
    <View style={[styles.bookingSlotItem, { backgroundColor: cardBg }]}>
      <View style={styles.bookingSlotHeader}>
        <View style={styles.bookingSlotTitleContainer}>
          <Text style={[styles.bookingSlotTitle, { color: textColor }]}>{item.messName}</Text>
          <Text style={[styles.bookingSlotDate, { color: secondaryText }]}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(isItemPaid ? 'CONFIRMED' : item.status) }]}>
          <Text style={styles.statusText}>{isItemPaid ? 'CONFIRMED' : item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.bookingSlotDetails}>
        <View style={styles.bookingDetailItem}>
          <Ionicons name="time-outline" size={14} color={secondaryText} style={{ marginRight: 4 }} />
          <Text style={[styles.bookingDetailValue, { color: textColor }]}>{item.timeSlot}</Text>
        </View>
        
        {item.createdAt && (
          <View style={styles.bookingDetailItem}>
            <Ionicons name="calendar-outline" size={14} color={secondaryText} style={{ marginRight: 4 }} />
            <Text style={[styles.bookingDetailLabel, { color: secondaryText }]}>Booked: </Text>
            <Text style={[styles.bookingDetailValue, { color: textColor }]}>{item.createdAt}</Text>
          </View>
        )}
        
        <View style={styles.bookingDetailItem}>
          <Ionicons 
            name={isItemPaid ? "checkmark-circle" : "wallet-outline"} 
            size={14} 
            color={isItemPaid ? '#10b981' : secondaryText} 
            style={{ marginRight: 4 }} 
          />
          <Text style={[
            styles.bookingDetailLabel, 
            { color: isItemPaid ? '#10b981' : secondaryText }
          ]}>
            {isItemPaid ? 'Paid' : 'Payment Status: '}
          </Text>
          {!isItemPaid && (
            <Text style={[styles.bookingDetailValue, { color: '#f59e0b' }]}>
              Pending
            </Text>
          )}
        </View>
      </View>
      
      {canShowPayButton && (
        <View style={{ 
          marginTop: 8,
          flexDirection: 'row',
          justifyContent: 'flex-end'
        }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#10b981',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              marginTop: 8,
              opacity: isPaying ? 0.7 : 1
            }}
            onPress={handlePayment}
            disabled={isPaying}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="wallet" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={{ 
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '500'
                }}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Replace the daysBetween and countDaysInclusive functions with a more precise implementation
const daysBetween = (date1: Date, date2: Date): number => {
  // Convert to UTC to avoid timezone issues
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  // Get time difference in milliseconds and convert to days
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((utc2 - utc1) / MS_PER_DAY));
};

// Count days inclusive (both start and end dates are counted)
// For example: April 30 to May 1 is 2 days
const countDaysInclusive = (startDate: Date, endDate: Date): number => {
  return daysBetween(startDate, endDate) + 1;
};

// Add these helper functions before loadLocalPayments function

// Add a proper fetchWithRetry function
const fetchWithRetry = async (url: string, options: any, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    
    throw new Error(`API error with status ${response.status}`);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Retrying API call to ${url}, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

// Add the fetchPendingDues function
const fetchPendingDues = async (email: string, messId: string, retryCount = 0) => {
  try {
    console.log(`Fetching pending dues for user ${email} in mess ${messId}`);
    const pendingDuesResponse = await fetchWithRetry(
      `${API_BASE_URL}/payment/pending/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, 
      2
    );
    
    const pendingDuesData = await pendingDuesResponse.json();
    console.log('Pending dues response:', pendingDuesData);
    
    let dues = 0;
    
    if (pendingDuesData && typeof pendingDuesData.pendingDues === 'number') {
      dues = pendingDuesData.pendingDues;
      console.log(`Updated pending dues amount: ₹${pendingDuesData.pendingDues}`);
    } else if (pendingDuesData && pendingDuesData.pendingDues) {
      // Try to parse it as a string containing a number
      const pendingAmount = parseFloat(pendingDuesData.pendingDues);
      if (!isNaN(pendingAmount)) {
        dues = pendingAmount;
        console.log(`Updated pending dues from string: ₹${pendingAmount}`);
      }
    } else if (typeof pendingDuesData === 'number') {
      // Handle if the API just returns a number directly
      dues = pendingDuesData;
      console.log(`Updated pending dues from direct number: ₹${pendingDuesData}`);
    }
    
    return dues;
    
  } catch (error) {
    console.error('Error fetching pending dues:', error);
    
    // Try again if we haven't exceeded retries
    if (retryCount < 2) {
      console.log(`Retrying pending dues fetch after error (${retryCount + 1}/2)...`);
      // Wait a short delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await fetchPendingDues(email, messId, retryCount + 1);
    }
    
    // Return fallback calculation if all retries failed
    return 0;
  }
};

export default function History() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMess, setCurrentMess] = useState<any>(null);
  const [previousMesses, setPreviousMesses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [userLeaveHistory, setUserLeaveHistory] = useState(leaveHistory);
  const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
  const [isLoadingBookingSlots, setIsLoadingBookingSlots] = useState(false);
  
  // Format date helper function - moved here so it's defined before being used
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };
  
  useEffect(() => {
    const loadData = async () => {
      await fetchUserAndMessDetails();
      await loadLocalPayments();
    };
    
    loadData();
  }, []);
  
  // Add a separate effect to load payments whenever currentMess changes
  useEffect(() => {
    if (currentMess) {
      loadLocalPayments();
    }
  }, [currentMess?.id]);
  
  useEffect(() => {
    const fetchBookingSlots = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        
        if (!email) {
          console.log('No user email found, cannot fetch booking slots');
          return;
        }
        
        setIsLoadingBookingSlots(true);
        
        // Verify the API server is running first
        try {
          console.log('Verifying API connection...');
          const pingResponse = await fetch(`${API_BASE_URL}/ping`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // Set a timeout of 5 seconds for the ping request
            signal: AbortSignal.timeout(5000)
          });
          
          if (!pingResponse.ok) {
            console.warn(`API server ping failed with status: ${pingResponse.status}`);
          } else {
            console.log('API server is running');
          }
        } catch (pingError) {
          console.error('API server may not be running:', pingError);
          // Continue anyway - the server might be running but ping endpoint unavailable
        }
        
        console.log('Fetching booking slots for user:', email);
        
        // The correct endpoint based on the backend controller is /slot/user/{userEmail}
        const url = `${API_BASE_URL}/slot/user/${encodeURIComponent(email)}`;
        console.log('Fetching from URL:', url);
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          
          if (!response.ok) {
            console.error(`Failed to fetch booking slots: ${response.status} ${response.statusText}`);
            
            // If that fails, try with a different approach - using axios instead of fetch
            try {
              console.log('Trying with axios as fallback...');
              const axios = require('axios').default;
              const axiosResponse = await axios.get(`${API_BASE_URL}/slot/user/${encodeURIComponent(email)}`);
              
              console.log('Axios response:', axiosResponse.data);
              
              if (axiosResponse.data && Array.isArray(axiosResponse.data)) {
                processSlots(axiosResponse.data);
              } else {
                console.warn('Axios response is not an array:', axiosResponse.data);
                setBookingSlots([]);
              }
            } catch (axiosError) {
              console.error('Axios fallback also failed:', axiosError);
              setBookingSlots([]);
            }
            
            setIsLoadingBookingSlots(false);
            return;
          }
          
          // Log the raw response for debugging
          const responseText = await response.text();
          console.log('Raw API response:', responseText);
          
          let data;
          try {
            // Parse the JSON response if it's valid JSON
            data = JSON.parse(responseText);
            console.log('Parsed booking slots data:', data);
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            console.log('Response was not valid JSON');
            setBookingSlots([]);
            setIsLoadingBookingSlots(false);
            return;
          }
          
          // Verify we have an array
          if (Array.isArray(data)) {
            processSlots(data);
          } else if (data && data.slots && Array.isArray(data.slots)) {
            processSlots(data.slots);
          } else {
            console.warn('Booking slots data is not in expected format:', data);
            setBookingSlots([]);
          }
        } catch (fetchError) {
          console.error('Error fetching booking slots:', fetchError);
          setBookingSlots([]);
        }
      } catch (error) {
        console.error('Error in booking slots fetch function:', error);
        setBookingSlots([]);
      } finally {
        setIsLoadingBookingSlots(false);
      }
    };
    
    fetchBookingSlots();
  }, []);
  
  const fetchUserAndMessDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      
      if (!email) {
        throw new Error('User email not found. Please login again.');
      }
      
      // Fetch user details
      const userResponse = await fetch(`${API_BASE_URL}/byEmail/${encodeURIComponent(email)}`);
      
      if (!userResponse.ok) {
        throw new Error(`User API request failed with status ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('User data:', userData);
      
      if (!userData.messId) {
        // User is not currently subscribed to any mess
        console.log('User is not subscribed to any mess');
        setCurrentMess(null);
        setLoading(false);
        return;
      }
      
      // Fetch mess details using user's messId
      const messResponse = await fetch(`${API_BASE_URL}/mess/getById/${userData.messId}`);
      
      if (!messResponse.ok) {
        throw new Error(`Mess API request failed with status ${messResponse.status}`);
      }
      
      const messData = await messResponse.json();
      console.log('Current mess data:', messData);
      
      // Format dates for display
      const formattedJoinDate = userData.joinDate ? formatDate(userData.joinDate) : 'Unknown';
      
      // Calculate subscription end date based on joinDate and subscriptionPlan
      const joinDate = new Date(userData.joinDate);
      const subscriptionPlan = messData.subscriptionPlan || 30; // Default to 30 days
      
      // If subscriptionPlan is large (e.g., 3500), it's likely a price not days
      // So use a default of 30 days in that case
      const subscriptionDays = subscriptionPlan > 100 ? 30 : subscriptionPlan;
      
      const endDate = new Date(joinDate);
      endDate.setDate(joinDate.getDate() + subscriptionDays);
      const formattedEndDate = formatDate(endDate.toISOString());
      
      // Calculate remaining days
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate day calculation
      
      // Calculate days properly
      const remainingDays = daysBetween(today, endDate);
      
      // Calculate elapsed days as (totalDays - remainingDays) to ensure consistency
      const totalDays = subscriptionDays;
      const elapsedDays = Math.max(0, totalDays - remainingDays);
      
      // Debug logging
      console.log('DAY CALCULATION DEBUG:');
      console.log(`Join date: ${joinDate.toISOString().split('T')[0]}`);
      console.log(`End date: ${endDate.toISOString().split('T')[0]}`);
      console.log(`Today: ${today.toISOString().split('T')[0]}`);
      console.log(`Total days in subscription: ${totalDays}`);
      console.log(`Remaining days: ${remainingDays}`);
      console.log(`Elapsed days: ${elapsedDays}`);
      console.log(`Progress percentage: ${Math.round((elapsedDays / totalDays) * 100)}%`);
      
      // Fetch user's rating for this mess (if any)
      let rating = 0;
      try {
        const ratingResponse = await fetch(`${API_BASE_URL}/feedback/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messData.email)}`);
        
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          
          if (Array.isArray(ratingData) && ratingData.length > 0) {
            // Use the most recent rating if multiple exist
            const mostRecentRating = ratingData.sort((a, b) => {
              // Sort by ID or date if available, assuming newer IDs are "greater"
              return b.id.localeCompare(a.id);
            })[0];
            
            rating = mostRecentRating.rating || 0;
            console.log('User rating for this mess:', rating);
          }
        }
      } catch (ratingError) {
        console.error('Error fetching user rating:', ratingError);
        // Continue without rating data if there's an error
      }
      
      // Keep the fallback calculation function
      const calculateFallbackDues = () => {
        console.log('Using fallback dues calculation');
        if (messData.pricePerMeal && messData.subscriptionPlan) {
          if (messData.subscriptionPlan > 100) {
            return messData.subscriptionPlan;
          } else {
            return messData.pricePerMeal * messData.subscriptionPlan;
          }
        }
        return 0; // Default value if we can't calculate
      };
      
      // Fetch the pending dues with the updated function
      let pendingDues = await fetchPendingDues(email, userData.messId);
      console.log(`Final pending dues amount: ₹${pendingDues}`);
      
      // If pendingDues is 0 or undefined, try the fallback calculation
      if (!pendingDues) {
        pendingDues = calculateFallbackDues();
      }
      
      // Construct the currentMess object
      const formattedMess = {
        id: messData.id,
        name: messData.messName || 'Unknown Mess',
        email: messData.email,
        address: messData.messAddress || 'Address not available',
        joinDate: formattedJoinDate,
        subscriptionEndDate: formattedEndDate,
        subscription: subscriptionPlan > 100 
          ? `₹${subscriptionPlan}/month` // It's a price
          : `${subscriptionPlan} days`, // It's days
        mealType: (messData.messType || 'Mixed') + ', Regular Meals',
        duesAmount: `₹${pendingDues.toFixed(pendingDues % 1 === 0 ? 0 : 2)}`,
        remainingDays,
        elapsedDays,
        totalDays,
        rating: messData.averageRating ? parseFloat(messData.averageRating) : rating, // Use mess average or user's rating
        subscriptionPlan
      };
      
      setCurrentMess(formattedMess);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error fetching mess details:', err);
      setError(err.message);
      setLoading(false);
      Alert.alert('Error', `Failed to fetch mess details: ${err.message}`);
    }
  };
  
  const loadLocalPayments = async () => {
    try {
      // First try to fetch real payment data from the API
      if (currentMess) {
        const email = await AsyncStorage.getItem('userEmail');
        
        if (email) {
          try {
            // Try to fetch payment history from the API using fetchWithRetry for reliability
            const paymentResponse = await fetchWithRetry(
              `${API_BASE_URL}/payment/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(currentMess.id)}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              },
              2
            );
            
            const paymentData = await paymentResponse.json();
            console.log('Payment history from API:', paymentData);
            
            if (Array.isArray(paymentData) && paymentData.length > 0) {
              // Format payment data for display
              const formattedPayments = paymentData.map(payment => ({
                id: payment.id,
                userEmail: payment.userEmail,
                messId: payment.messId,
                messName: payment.messName || currentMess.name,
                date: formatDate(payment.paymentDate),
                amount: `₹${payment.amountPaid}`,
                remainingAmount: payment.remainingDues,
                time: new Date(payment.paymentDate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }),
                status: payment.status || 'COMPLETED',
                items: payment.notes || 'Mess Subscription Payment',
              }));
              
              setPayments(formattedPayments);
              
              // Update current mess dues if we have payment data
              if (formattedPayments.length > 0) {
                // Sort by date (most recent first)
                formattedPayments.sort((a, b) => {
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
                
                // Update with the most recent payment's remaining amount
                const latestPayment = formattedPayments[0];
                console.log('Latest payment:', latestPayment);
                
                if (latestPayment && typeof latestPayment.remainingAmount === 'number') {
                  // Update the current mess with the latest remaining dues amount
                  const latestDues = latestPayment.remainingAmount;
                  console.log(`Updating dues from latest payment: ₹${latestDues}`);
                  
                  setCurrentMess((prevMess: typeof currentMess) => ({
                    ...prevMess,
                    duesAmount: `₹${latestDues.toFixed(latestDues % 1 === 0 ? 0 : 2)}`
                  }));
                  
                  // If we have already fetched pending dues from the API, don't overwrite it
                  // This ensures we show the most up-to-date information
                }
              }
              
              // Skip loading from local storage if we have API data
              return;
            } else {
              // If no payment history, refresh the pending dues to make sure it's up-to-date
              if (email && currentMess?.id) {
                try {
                  // Re-fetch latest pending dues
                  const refreshedDues = await fetchPendingDues(email, currentMess.id);
                  if (refreshedDues !== undefined) {
                    console.log(`Refreshed pending dues after no payment history: ₹${refreshedDues}`);
                    setCurrentMess((prevMess: typeof currentMess) => ({
                      ...prevMess,
                      duesAmount: `₹${refreshedDues.toFixed(refreshedDues % 1 === 0 ? 0 : 2)}`
                    }));
                  }
                } catch (refreshError) {
                  console.error('Error refreshing pending dues:', refreshError);
                }
              }
            }
          } catch (apiError) {
            console.error('Error fetching payment history from API:', apiError);
          }
        }
      }
      
      // Fall back to local storage if API fails or returns no data
      const paymentsJson = await AsyncStorage.getItem('localPayments');
      if (paymentsJson) {
        const localPayments = JSON.parse(paymentsJson);
        console.log('Loaded local payments:', localPayments);
        
        // Only set payments to state if we haven't already loaded them from API
        if (payments.length === 0) {
          console.log('Setting payments from local storage as API payments were empty');
          setPayments(localPayments);
        } else {
          console.log('Not setting local payments as we already have API payments');
        }
        
        // Update current mess dues if we have the current mess loaded and no API payments
        if (currentMess && payments.length === 0) {
          // Find the most recent payment for this mess
          const messPayments = localPayments.filter(
            (payment: any) => payment.messId === currentMess.id
          );
          
          if (messPayments.length > 0) {
            // Sort by date (most recent first)
            messPayments.sort((a: any, b: any) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            // Get the most recent payment's remaining amount
            const latestPayment = messPayments[0];
            const remainingAmount = latestPayment.remainingAmount;
            console.log('Updating current mess dues to:', remainingAmount);
            
            // Update the current mess with the remaining amount
            setCurrentMess((prevMess: typeof currentMess) => ({
              ...prevMess,
              duesAmount: `₹${remainingAmount.toFixed(remainingAmount % 1 === 0 ? 0 : 2)}`
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };
  
  // Helper function to process and format booking slots data
  const processSlots = (slotsData: any[]) => {
    console.log(`Processing ${slotsData.length} booking slots`);
    
    // Check if we have any data
    if (slotsData.length === 0) {
      console.log('No booking slots found in the data');
      setBookingSlots([]);
      return;
    }
    
    // Log a sample slot to inspect the structure
    console.log('Sample slot data structure:', JSON.stringify(slotsData[0]));
    
    // Format the booking slots
    const formattedSlots = slotsData.map(slot => {
      // Log payment-related fields for each slot
      console.log(`Slot ${slot.id} payment details - status: ${slot.status}, paid: ${slot.paid}, paymentId: ${slot.paymentId}`);
      
      // Handle date formatting safely
      let formattedDate = 'Unknown date';
      try {
        if (slot.date) {
          // Handle both date string formats
          if (slot.date.includes('T')) {
            // Full ISO date
            formattedDate = new Date(slot.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } else {
            // YYYY-MM-DD format
            const dateParts = slot.date.split('-');
            if (dateParts.length === 3) {
              const dateObj = new Date(
                parseInt(dateParts[0]), 
                parseInt(dateParts[1]) - 1, // Month is 0-indexed
                parseInt(dateParts[2])
              );
              formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          }
        }
      } catch (dateError) {
        console.error('Error formatting date:', dateError);
        formattedDate = slot.date || 'Unknown date';
      }
      
      // Handle created date formatting
      let createdDate = undefined;
      try {
        if (slot.createdAt) {
          createdDate = new Date(slot.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      } catch (createdError) {
        console.error('Error formatting created date:', createdError);
      }
      
      // Determine if the slot is paid based on multiple possible indicators
      const isPaid = 
        (slot.paid === true) || 
        (slot.status === 'CONFIRMED') || 
        (slot.paymentId !== null && slot.paymentId !== undefined) ||
        (slot.confirmedAt !== null && slot.confirmedAt !== undefined);
        
      console.log(`Slot ${slot.id} calculated paid status: ${isPaid}`);
      
      return {
        id: slot.id || `slot-${Math.random().toString(36).substring(2, 11)}`,
        messName: slot.messName || 'Unknown Mess',
        messId: slot.messId || '',
        date: formattedDate,
        timeSlot: slot.timeSlot || 'No time specified',
        status: slot.status || 'UNKNOWN',
        createdAt: createdDate,
        paid: isPaid,
        paymentId: slot.paymentId,
        confirmedAt: slot.confirmedAt
      };
    });
    
    // Sort booking slots by date (newest first)
    formattedSlots.sort((a, b) => {
      // Try to parse dates for comparison
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      // If valid dates, compare them
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // Fallback to string comparison
      return a.date.localeCompare(b.date);
    });
    
    console.log(`Processed ${formattedSlots.length} formatted booking slots`);
    setBookingSlots(formattedSlots);
  };
  
  // Add a refresh function that can be called when payment is completed
  const refreshBookingSlots = async () => {
    try {
      setIsLoadingBookingSlots(true);
      const email = await AsyncStorage.getItem('userEmail');
      
      if (!email) {
        console.log('No user email found, cannot fetch booking slots');
        setIsLoadingBookingSlots(false);
        return;
      }
      
      console.log('Refreshing booking slots after payment for user:', email);
      const url = `${API_BASE_URL}/slot/user/${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to refresh booking slots: ${response.status}`);
        setIsLoadingBookingSlots(false);
        return;
      }
      
      const data = await response.json();
      console.log('Refreshed booking slots data:', data);
      
      if (Array.isArray(data)) {
        processSlots(data);
      } else {
        console.warn('Refreshed booking slots data is not an array:', data);
      }
    } catch (error) {
      console.error('Error refreshing booking slots:', error);
    } finally {
      setIsLoadingBookingSlots(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading mess details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF5252" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserAndMessDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      
      <ScrollView style={styles.messHistory} showsVerticalScrollIndicator={false}>
        {currentMess ? (
        <CurrentMessCard mess={currentMess} isDark={isDark} />
        ) : (
          <View style={[styles.noMessContainer, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <Ionicons name="restaurant-outline" size={50} color="#a0a0a0" />
            <Text style={[styles.noMessText, { color: isDark ? '#ffffff' : '#333333' }]}>
              You haven't joined any mess yet
            </Text>
            <TouchableOpacity 
              style={styles.joinMessButton}
              onPress={() => router.push('/screens/mess/join-mess')}
            >
              <Text style={styles.joinMessButtonText}>Find a Mess</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.previousMessSection}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>
            PREVIOUS SUBSCRIPTIONS
          </Text>
          
          {previousMesses.length > 0 ? (
          <FlatList
            data={previousMesses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PreviousMessItem mess={item} isDark={isDark} />}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.prevMessList}
          />
          ) : (
            <View style={styles.noPreviousMessContainer}>
              <Text style={[styles.noPreviousMessText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                No previous subscriptions found
              </Text>
            </View>
          )}
        </View>
        
        {/* Booking Slots Section */}
        <View style={styles.bookingSlotsSection}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>
            BOOKING SLOTS
          </Text>
          
          {isLoadingBookingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={isDark ? '#3b82f6' : '#4f46e5'} />
              <Text style={{ color: isDark ? '#a0a0a0' : '#666666', marginTop: 8 }}>
                Loading booking slots...
              </Text>
            </View>
          ) : bookingSlots.length > 0 ? (
            <View style={styles.bookingSlotsContainer}>
              <FlatList
                data={bookingSlots}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <BookingSlotItem 
                    item={item} 
                    isDark={isDark} 
                    onPaymentComplete={refreshBookingSlots} 
                  />
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.bookingSlotsList}
                initialNumToRender={3}
                maxToRenderPerBatch={5}
              />
              {bookingSlots.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => {
                    // Since we don't have a dedicated bookings screen yet, show an alert
                    Alert.alert(
                      "Coming Soon",
                      "Full booking history view will be available in the next update.",
                      [{ text: "OK", style: "default" }]
                    );
                  }}
                >
                  <Text style={styles.viewAllButtonText}>View All Bookings</Text>
                  <Ionicons name="chevron-forward" size={16} color={isDark ? '#3b82f6' : '#4f46e5'} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noSlotsContainer}>
              <Text style={[styles.noSlotsText, { color: isDark ? '#a0a0a0' : '#666666', marginBottom: 12 }]}>
                No booking slots found
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  // Create a reference to the fetch function so we can call it
                  const fetchBookingSlotsRef = async () => {
                    try {
                      setIsLoadingBookingSlots(true);
                      const email = await AsyncStorage.getItem('userEmail');
                      
                      if (!email) {
                        console.log('No user email found, cannot fetch booking slots');
                        setIsLoadingBookingSlots(false);
                        return;
                      }
                      
                      console.log('Manually retrying to fetch booking slots for:', email);
                      const url = `${API_BASE_URL}/slot/user/${encodeURIComponent(email)}`;
                      
                      const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        }
                      });
                      
                      if (!response.ok) {
                        console.error(`Manual retry failed: ${response.status}`);
                        setIsLoadingBookingSlots(false);
                        return;
                      }
                      
                      const data = await response.json();
                      console.log('Manual retry response:', data);
                      
                      if (Array.isArray(data)) {
                        processSlots(data);
                      } else {
                        console.warn('Manual retry data is not an array:', data);
                        setBookingSlots([]);
                      }
                    } catch (error) {
                      console.error('Error in manual retry:', error);
                      setBookingSlots([]);
                    } finally {
                      setIsLoadingBookingSlots(false);
                    }
                  };
                  
                  // Call the fetch function
                  fetchBookingSlotsRef();
                }}
              >
                <Ionicons name="refresh" size={16} color={isDark ? '#a0a0a0' : '#666666'} style={{ marginRight: 8 }} />
                <Text style={{ color: isDark ? '#a0a0a0' : '#666666' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  messHistory: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  currentMessCard: {
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentMessHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  currentMessContent: {
    padding: 16,
    flexDirection: 'row',
  },
  messImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  messDetails: {
    flex: 1,
    marginLeft: 16,
  },
  messAddress: {
    fontSize: 13,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionStatus: {
    marginTop: 8,
  },
  subscriptionPeriod: {
    marginBottom: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionPeriodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
    marginBottom: 4,
  },
  remainingDaysText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    backgroundColor: '#e1f1ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  arrowIcon: {
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  previousMessSection: {
    flex: 1,
  },
  prevMessList: {
    paddingBottom: 100,
  },
  previousMessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  prevMessImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  prevMessDetails: {
    flex: 1,
    marginLeft: 16,
  },
  prevMessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  prevMessAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  prevMessPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  periodText: {
    fontSize: 12,
    marginLeft: 6,
  },
  mealTypeText: {
    fontSize: 12,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messInfo: {
    flex: 1,
  },
  messName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardContent: {
    marginBottom: 12,
  },
  items: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 4,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noMessContainer: {
    borderRadius: 12,
    marginBottom: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noMessText: {
    fontSize: 16,
    marginVertical: 12,
    textAlign: 'center',
  },
  joinMessButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  joinMessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noPreviousMessContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPreviousMessText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemDetails: {
    marginBottom: 12,
  },
  historyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingCard: {
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginRight: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingInfo: {
    fontSize: 12,
    marginBottom: 12,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingSlotsSection: {
    marginBottom: 20,
  },
  bookingSlotsContainer: {
    maxHeight: 350, // Limit the height
  },
  bookingSlotsList: {
    paddingBottom: 8,
  },
  bookingSlotItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bookingSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingSlotTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  bookingSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookingSlotDate: {
    fontSize: 13,
  },
  bookingSlotDetails: {
    marginTop: 4,
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingDetailLabel: {
    fontSize: 13,
    marginRight: 2,
  },
  bookingDetailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSlotsContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  payButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  bookingActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
}); 