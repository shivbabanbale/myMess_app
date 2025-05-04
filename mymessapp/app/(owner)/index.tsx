import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '@/app/_layout';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Mock data for the dashboard - will be replaced with real data from API
const initialMessData = {
  name: "Loading...",
  email: "",
  totalMembers: 0,
  activeMembers: 0,
  pendingDues: 0,
  attendance: 0,
  rating: 0,
  todaySpecial: "Loading...",
  pendingLeaveRequests: 0,
  menuUpdatedAt: "Loading...",
  capacity: 0,  // Total capacity of the mess
  messName: "Loading...",
  messAddress: "",
  messType: "",
  imageName: null,  // Profile image name
  contact: ""  // Contact number
};

// Type for Ionicons name
type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Feature card type
interface FeatureCard {
  title: string;
  icon: IconName;
  count: string | number;
  subtitle: string;
  color: [string, string]; // Tuple type for gradient colors
  onPress: () => void;
}

// Quick action type
interface QuickAction {
  title: string;
  icon: IconName;
  badgeCount: number | null;
  lastUpdated: string | null;
  onPress: () => void;
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Use AuthContext for logout functionality
  const { logout } = React.useContext(AuthContext);
  
  // State to store mess data
  const [messData, setMessData] = useState(initialMessData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pendingBookingSlots, setPendingBookingSlots] = useState(0);

  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const accentColor = isDark ? '#3b82f6' : '#4f46e5';

  // Function to fetch active members from the /getAll endpoint
  const fetchActiveMembers = async (messId: string) => {
    try {
      // Request all users by setting a large page size to avoid pagination issues
      const usersResponse = await axios.get(`${API_BASE_URL}/getAll?pageSize=1000`);
      const usersData = usersResponse.data;
      
      if (usersData.content && Array.isArray(usersData.content)) {
        // Count users who are members of this mess (have messId matching this mess's id)
        const messMembers = usersData.content.filter((user: any) => user.messId === messId);
        const activeMembersCount = messMembers.length;
        
        console.log(`Found ${activeMembersCount} active members for this mess`);
        
        // Update both active members count and total members count 
        // but do NOT update capacity - capacity is the max available
        setMessData(prev => ({
          ...prev,
          activeMembers: activeMembersCount,
          totalMembers: activeMembersCount // Also update total members for consistency
        }));

        return activeMembersCount; // Return the count for use by the calling function
      }
      return 0; // Return 0 if no members found
    } catch (usersError) {
      console.error('Error fetching users data:', usersError);
      return null; // Return null to indicate error
    }
  };

  // Function to fetch pending dues
  const fetchPendingDues = async (messId: string) => {
    try {
      // Fetch all payments for this mess
      const paymentsResponse = await axios.get(`${API_BASE_URL}/payment/mess/${messId}`);
      let paymentsData = paymentsResponse.data || [];
      let pendingDues = 0;
      
      if (Array.isArray(paymentsData)) {
        // For calculating pending dues, we need:
        // 1. The latest payment from each user
        // 2. The remaining amount from each latest payment
        // 3. Default subscription amount for users who haven't made any payments
        
        // Get mess details to get subscription plan information
        const messDetailsResponse = await axios.get(`${API_BASE_URL}/mess/getById/${messId}`);
        const messDetails = messDetailsResponse.data;
        const pricePerMeal = messDetails.pricePerMeal || 0;
        
        // Determine subscription amount
        let subscriptionPlan = messDetails.subscriptionPlan || 30; // Default to 30 days
        let defaultSubscriptionAmount;
      
        if (subscriptionPlan > 100) {
          // If the subscriptionPlan is a large number, it's likely a total amount already
          defaultSubscriptionAmount = subscriptionPlan;
        } else {
          // Otherwise, it's likely days, so calculate the total
          defaultSubscriptionAmount = pricePerMeal * subscriptionPlan;
        }
        
        // Track latest payment for each user
        const userLatestPayments = new Map();
        
        // Process all payments to find the latest payment per user
        paymentsData.forEach((payment: any) => {
          const existingPayment = userLatestPayments.get(payment.userEmail);
          const paymentDate = new Date(payment.paymentDate).getTime();
          
          if (!existingPayment || paymentDate > new Date(existingPayment.paymentDate).getTime()) {
            userLatestPayments.set(payment.userEmail, payment);
          }
        });
        
        // Calculate pending dues based on the latest payment for each user
        userLatestPayments.forEach((payment: any) => {
          pendingDues += Number(payment.remainingDues || 0);
        });
        
        // Calculate additional dues for users who haven't made any payments
        // Get the list of joined users
        const joinedUsers = messDetails.joinedUsers || [];
        
        // Get list of users without payments and add default subscription amount to pending dues
        const usersWithPayments = new Set(Array.from(userLatestPayments.keys()));
        const usersWithoutPayments = joinedUsers.filter((email: string) => !usersWithPayments.has(email));
        const additionalPendingDues = usersWithoutPayments.length * defaultSubscriptionAmount;
        
        console.log(`Found ${usersWithoutPayments.length} users without any payment records`);
        console.log(`Additional pending dues from users without payments: ${additionalPendingDues}`);
        
        pendingDues += additionalPendingDues;
        console.log(`Total pending dues including users without payments: ${pendingDues}`);
        
        // Update just the pending dues
        setMessData(prev => ({
          ...prev,
          pendingDues: pendingDues
        }));
      }
    } catch (error) {
      console.error('Error fetching pending dues:', error);
    }
  };

  // Fetch pending booking slots count
  const fetchPendingBookingSlots = async (email: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/slot/pending/mess/${email}`);
      const slots = response.data || [];
      
      if (Array.isArray(slots)) {
        setPendingBookingSlots(slots.length);
      }
    } catch (error) {
      console.error('Error fetching pending booking slots:', error);
      // Don't show error UI for this, just log it
    }
  };

  // Function to refresh mess data
  const refreshMessData = async () => {
    if (!userEmail) return;
    
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_BASE_URL}/mess/getByEmail/${userEmail}`);
      const messDetails = response.data;
      console.log('Mess details refreshed:', messDetails);
      
      // First update basic mess data
      setMessData(prev => ({
        ...prev,
        name: messDetails.name || prev.name,
        capacity: messDetails.capacity || prev.capacity,
        messName: messDetails.messName || prev.messName,
        messAddress: messDetails.messAddress || prev.messAddress,
        messType: messDetails.messType || prev.messType,
        imageName: messDetails.imageName || prev.imageName,
        contact: messDetails.contact || prev.contact,
        rating: messDetails.averageRating || prev.rating
      }));
      
      // First fetch active members count
      const memberCount = await fetchActiveMembers(messDetails.id);
      
      // Only if we successfully got member count, then calculate pending dues
      if (memberCount !== null) {
        await fetchPendingDues(messDetails.id);
      }

      // Fetch pending booking slots
      await fetchPendingBookingSlots(userEmail);
      
    } catch (error) {
      console.error('Error refreshing mess data:', error);
      Alert.alert('Refresh Failed', 'Unable to refresh mess data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Load user email and mess data from AsyncStorage and API
  useEffect(() => {
    const loadMessData = async () => {
      try {
        setLoading(true);
        // Get user email from AsyncStorage
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) {
          setError('User email not found');
          setLoading(false);
          return;
        }
        
        setUserEmail(email);
        console.log('Loaded email from AsyncStorage:', email);
        
        // Fetch mess details from API
        try {
          const response = await axios.get(`${API_BASE_URL}/mess/getByEmail/${email}`);
          const messDetails = response.data;
          console.log('Mess details fetched:', messDetails);
          
          // Default active members count from joinedUsers array length
          let activeMembers = messDetails.joinedUsers?.length || 0;
          
          // Set initial mess data with basic details
          setMessData({
            name: messDetails.name || "Owner",
            email: email,
            totalMembers: activeMembers,
            activeMembers: activeMembers, 
            pendingDues: 0, // Will be updated by fetchPendingDues
            attendance: 0,
            rating: messDetails.averageRating || 0,
            todaySpecial: "Today's Special",
            pendingLeaveRequests: 0,
            menuUpdatedAt: "Today",
            capacity: messDetails.capacity || 0,
            messName: messDetails.messName || "Your Mess",
            messAddress: messDetails.messAddress || "",
            messType: messDetails.messType || "",
            imageName: messDetails.imageName || null,
            contact: messDetails.contact || ""
          });
          
          // First get accurate active members count
          const memberCount = await fetchActiveMembers(messDetails.id);
          
          // Only if we successfully got member count, then calculate pending dues
          if (memberCount !== null) {
            await fetchPendingDues(messDetails.id);
          }

          // Fetch pending booking slots
          await fetchPendingBookingSlots(email);
          
        } catch (apiError) {
          console.error('API error:', apiError);
          // Fall back to mock data if API fails
          setMessData({
            ...initialMessData,
            email: email,
            name: "Your Mess" // Use a fallback name
          });
        }
      } catch (err) {
        console.error('Error loading mess data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadMessData();
  }, []);

  // Feature cards data
  const featureCards: FeatureCard[] = [
    {
      title: 'Members',
      icon: 'people',
      count: messData.totalMembers,
      subtitle: `${messData.activeMembers} active`,
      color: ['#4f46e5', '#3b82f6'],
      onPress: () => router.push('/members' as any)
    },
    {
      title: 'Attendance',
      icon: 'calendar-outline',
      count: messData.activeMembers,
      subtitle: 'Take daily attendance',
      color: ['#10b981', '#0d9488'],
      onPress: () => router.push('/attendance' as any)
    },
    {
      title: 'Dues',
      icon: 'cash',
      count: `₹${Math.round(messData.pendingDues)}`,
      subtitle: 'pending collection',
      color: ['#f59e0b', '#ef4444'],
      onPress: () => router.push('/finances' as any)
    },
    {
      title: 'Capacity',
      icon: 'people-outline',
      count: Math.max(0, messData.capacity - messData.totalMembers),
      subtitle: 'available spots',
      color: ['#10b981', '#059669'],
      onPress: () => router.push({
        pathname: '/update-mess-details',
        params: { email: userEmail }
      } as any)
    },
    {
      title: 'Rating',
      icon: 'star',
      count: messData.rating.toFixed(1),
      subtitle: 'customer rating',
      color: ['#f59e0b', '#d97706'],
      onPress: () => router.push('/reviews' as any)
    }
  ];

  // Quick action buttons data
  const quickActions: QuickAction[] = [
    {
      title: 'Weekly Menu',
      icon: 'restaurant',
      badgeCount: null,
      lastUpdated: messData.menuUpdatedAt,
      onPress: () => router.push('/menu' as any)
    },
    {
      title: 'Leave Requests',
      icon: 'calendar',
      badgeCount: messData.pendingLeaveRequests,
      lastUpdated: null,
      onPress: () => router.push('/owner-screens/leaves' as any)
    },
    {
      title: 'Booking Slots',
      icon: 'time',
      badgeCount: pendingBookingSlots > 0 ? pendingBookingSlots : null,
      lastUpdated: null,
      onPress: () => router.push('/slots' as any)
    },
    {
      title: 'Add Member',
      icon: 'person-add',
      badgeCount: null,
      lastUpdated: null,
      onPress: () => router.push('/add-member' as any)
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      badgeCount: null,
      lastUpdated: null,
      onPress: () => router.push('/notifications' as any)
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading mess details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: accentColor }]}
            onPress={() => router.replace('/login' as any)}
          >
            <Text style={styles.retryButtonText}>Return to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {messData.imageName ? (
                  <Image
                    source={{ 
                      uri: `${API_BASE_URL}/mess/profile/${userEmail}?t=${new Date().getTime()}`,
                      cache: 'reload'
                    }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.profileImagePlaceholder, { backgroundColor: accentColor }]}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {messData.messName?.charAt(0)?.toUpperCase() || "M"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.welcomeText, { color: secondaryText }]}>
                  Welcome back,
                </Text>
                <Text style={[styles.messName, { color: textColor }]}>
                  {messData.messName || messData.name}
                </Text>
                <Text style={[styles.emailText, { color: secondaryText }]}>
                  {userEmail}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.settingsButton, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                onPress={refreshMessData}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={accentColor} />
                ) : (
                  <Ionicons name="refresh" size={24} color={isDark ? textColor : 'black'} />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Mess Details */}
            <View style={styles.messDetailsContainer}>
              {messData.messAddress && (
                <View style={styles.messDetailItem}>
                  <Ionicons name="location-outline" size={16} color={secondaryText} style={styles.messDetailIcon} />
                  <Text style={[styles.messDetailText, { color: textColor }]} numberOfLines={2}>
                    {messData.messAddress}
                  </Text>
                </View>
              )}
              
              {messData.messType && (
                <View style={styles.messDetailItem}>
                  <Ionicons name="restaurant-outline" size={16} color={secondaryText} style={styles.messDetailIcon} />
                  <Text style={[styles.messDetailText, { color: textColor }]}>
                    {messData.messType} Mess
                  </Text>
                </View>
              )}
              
              {messData.contact && (
                <View style={styles.messDetailItem}>
                  <Ionicons name="call-outline" size={16} color={secondaryText} style={styles.messDetailIcon} />
                  <Text style={[styles.messDetailText, { color: textColor }]}>
                    {messData.contact}
                  </Text>
                </View>
              )}
              
              {messData.capacity > 0 && (
                <View style={styles.messDetailItem}>
                  <Ionicons name="people-outline" size={16} color={secondaryText} style={styles.messDetailIcon} />
                  <View style={styles.capacityContainer}>
                    <Text style={[styles.messDetailText, { color: textColor }]}>
                      Capacity: {messData.totalMembers}/{messData.capacity}
                    </Text>
                    <View style={styles.capacityBarContainer}>
                      <View 
                        style={[
                          styles.capacityBarFill, 
                          { 
                            width: `${Math.min(100, Math.max(0, (messData.totalMembers / Math.max(1, messData.capacity)) * 100))}%`,
                            backgroundColor: messData.totalMembers >= messData.capacity ? '#ef4444' : accentColor 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.editProfileButton, { backgroundColor: accentColor }]}
                onPress={() => router.push({
                  pathname: '/update-mess-details',
                  params: { email: userEmail }
                } as any)}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                <Ionicons name="pencil" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Special */}
          <View style={[styles.specialCard, { backgroundColor: cardBg }]}>
            <View style={styles.specialContent}>
              <Text style={[styles.specialLabel, { color: secondaryText }]}>
                TODAY'S SPECIAL
              </Text>
              <Text style={[styles.specialDish, { color: textColor }]}>
                {messData.todaySpecial}
              </Text>
              <TouchableOpacity 
                style={[styles.updateButton, { borderColor }]}
                onPress={() => router.push('/menu' as any)}
              >
                <Text style={{ color: accentColor, fontWeight: '600' }}>Update Menu</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.specialImageContainer}>
              <Image
                source={require('@/assets/images/react-logo.png')}
                style={styles.specialImage}
              />
            </View>
          </View>
          
          {/* Attendance Card */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => router.push('/attendance' as any)}
          >
            <LinearGradient
              colors={['#10b981', '#0d9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.menuCardGradient}
            >
              <View style={styles.menuCardContent}>
                <View style={styles.menuCardHeader}>
                  <Ionicons name="calendar-outline" size={28} color="#ffffff" />
                  <Text style={[styles.menuCardTitle, { color: "#ffffff" }]}>
                    Attendance
                  </Text>
                </View>
                <Text style={[styles.menuCardDescription, { color: "rgba(255,255,255,0.8)" }]}>
                  Mark daily attendance for your mess members. Keep track of who's present.
                </Text>
                <View style={styles.menuCardStatus}>
                  <Text 
                    style={{ 
                      color: "#ffffff",
                      fontWeight: '500',
                      fontSize: 13,
                      opacity: 0.9
                    }}
                  >
                    {messData.activeMembers} active members
                  </Text>
                  <View style={styles.menuCardButton}>
                    <Text style={{ color: "#0d9488", fontWeight: '600', fontSize: 12 }}>
                      Mark Now
                    </Text>
                    <Ionicons 
                      name="chevron-forward" 
                      size={12} 
                      color="#0d9488" 
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Weekly Menu Management Card */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => router.push('/menu' as any)}
          >
            <LinearGradient
              colors={['#4f46e5', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.menuCardGradient}
            >
              <View style={styles.menuCardContent}>
                <View style={styles.menuCardHeader}>
                  <Ionicons name="restaurant-outline" size={28} color="#ffffff" />
                  <Text style={[styles.menuCardTitle, { color: "#ffffff" }]}>
                    Weekly Menu
                  </Text>
                </View>
                <Text style={[styles.menuCardDescription, { color: "rgba(255,255,255,0.8)" }]}>
                  Manage your weekly mess menu and update meal items for each day.
                </Text>
                <View style={styles.menuCardStatus}>
                  <Text 
                    style={{ 
                      color: "#ffffff",
                      fontWeight: '500',
                      fontSize: 13,
                      opacity: 0.9
                    }}
                  >
                    Last updated: {messData.menuUpdatedAt}
                  </Text>
                  <View style={styles.menuCardButton}>
                    <Text style={{ color: "#4f46e5", fontWeight: '600', fontSize: 12 }}>
                      Update
                    </Text>
                    <Ionicons 
                      name="chevron-forward" 
                      size={12} 
                      color="#4f46e5" 
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Booking Slots Management Card */}
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => router.push('/slots' as any)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.menuCardGradient}
            >
              <View style={styles.menuCardContent}>
                <View style={styles.menuCardHeader}>
                  <Ionicons name="time-outline" size={28} color="#ffffff" />
                  <Text style={[styles.menuCardTitle, { color: "#ffffff" }]}>
                    Booking Slots
                  </Text>
                  {pendingBookingSlots > 0 && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{pendingBookingSlots}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.menuCardDescription, { color: "rgba(255,255,255,0.8)" }]}>
                  Manage meal bookings from users. Approve or decline pending requests.
                </Text>
                <View style={styles.menuCardStatus}>
                  <Text 
                    style={{ 
                      color: "#ffffff",
                      fontWeight: '500',
                      fontSize: 13,
                      opacity: 0.9
                    }}
                  >
                    {pendingBookingSlots > 0 
                      ? `${pendingBookingSlots} pending request${pendingBookingSlots > 1 ? 's' : ''}` 
                      : 'No pending requests'}
                  </Text>
                  <View style={styles.bookingSlotsActions}>
                    <TouchableOpacity
                      style={styles.menuCardButton}
                      onPress={() => router.push('/slots' as any)}
                    >
                      <Text style={{ color: "#8b5cf6", fontWeight: '600', fontSize: 12 }}>
                        Manage
                      </Text>
                      <Ionicons 
                        name="chevron-forward" 
                        size={12} 
                        color="#8b5cf6" 
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.menuCardButton, { marginLeft: 8 }]}
                      onPress={() => router.push('/slot-settings' as any)}
                    >
                      <Text style={{ color: "#8b5cf6", fontWeight: '600', fontSize: 12 }}>
                        Settings
                      </Text>
                      <Ionicons 
                        name="settings-outline" 
                        size={12} 
                        color="#8b5cf6" 
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Feature Cards */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Stats
          </Text>
          <View style={styles.featureCardsContainer}>
            {featureCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.featureCard, { backgroundColor: cardBg }]}
                onPress={card.onPress}
              >
                <LinearGradient
                  colors={card.color as readonly [string, string]}
                  style={styles.featureCardContent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={card.icon} size={24} color="#ffffff" />
                </LinearGradient>
                <Text style={[styles.featureCardCount, { color: textColor }]}>
                  {card.count}
                </Text>
                <Text style={[styles.featureCardSubtitle, { color: secondaryText }]}>
                  {card.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: cardBg }]}
                onPress={action.onPress}
              >
                <View style={styles.quickActionHeader}>
                  <View style={[styles.quickActionIconContainer, { backgroundColor: isDark ? '#333' : '#F0F4F8' }]}>
                    <Ionicons name={action.icon} size={20} color={accentColor} />
                  </View>
                  {action.badgeCount ? (
                    <View style={[styles.quickActionBadge, { backgroundColor: '#ef4444' }]}>
                      <Text style={styles.quickActionBadgeText}>{action.badgeCount}</Text>
                    </View>
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </View>
                <Text style={[styles.quickActionTitle, { color: textColor }]}>
                  {action.title}
                </Text>
                {action.lastUpdated && (
                  <Text style={[styles.quickActionUpdatedText, { color: secondaryText }]}>
                    Last updated: {action.lastUpdated}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Mess Settings Card */}
          <TouchableOpacity 
            style={[styles.settingsCard, { backgroundColor: cardBg }]}
            onPress={() => router.push({
              pathname: '/update-mess-details',
              params: { email: userEmail }
            } as any)}
          >
            <View style={styles.actionLeftContent}>
              <View style={[styles.actionIconContainer, { backgroundColor: isDark ? '#333' : '#F0F4F8' }]}>
                <Ionicons name="business" size={20} color={accentColor} />
              </View>
              <View style={styles.settingsCardContent}>
                <Text style={[styles.settingsCardTitle, { color: textColor }]}>
                  Update Mess Details
                </Text>
                <Text style={[styles.settingsCardSubtitle, { color: secondaryText }]}>
                  Manage your mess information, location, and operating hours
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={secondaryText} />
          </TouchableOpacity>
          
          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: isDark ? '#444' : '#e0e0e0' }]}
            onPress={async () => {
              try {
                // First clear AsyncStorage directly
                await AsyncStorage.removeItem('isAuthenticated');
                await AsyncStorage.removeItem('userType');
                await AsyncStorage.removeItem('userEmail');
                
                // Then call the context logout (which handles state & navigation)
                logout();
                
                // Force navigation with a delay
                setTimeout(() => {
                  router.replace('/login' as any);
                }, 100);
              } catch (error) {
                console.error('Error during logout:', error);
              }
            }}
          >
            <Ionicons name="exit-outline" size={18} color={isDark ? '#ff6b6b' : '#e74c3c'} />
            <Text style={[styles.logoutButtonText, { color: isDark ? '#ff6b6b' : '#e74c3c' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureCardContent: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureCardSubtitle: {
    fontSize: 13,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionUpdatedText: {
    fontSize: 12,
    lineHeight: 18,
  },
  settingsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsCardContent: {
    flex: 1,
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingsCardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  menuCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  menuCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  menuCardStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  menuCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  bookingSlotsActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    padding: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  specialCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  specialContent: {
    flex: 1,
  },
  specialLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  specialDish: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  updateButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  specialImageContainer: {
    width: 80,
    height: 80,
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  specialImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  messDetailsContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  messDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messDetailIcon: {
    marginRight: 10,
    width: 20,
    alignItems: 'center',
  },
  messDetailText: {
    flex: 1,
    fontSize: 14,
  },
  capacityContainer: {
    flex: 1,
  },
  capacityBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pendingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 