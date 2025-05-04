import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL
const API_BASE_URL = 'http://localhost:8080'; 

// Define the notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  senderEmail: string;
  senderName?: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const accentColor = '#3b82f6';

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserEmail(email);
        await fetchNotifications(email);
        // Automatically mark all as read when screen loads
        markAllAsRead(email);
      } else {
        console.error('User email not found in AsyncStorage');
        Alert.alert('Error', 'Unable to retrieve user information. Please log in again.');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const fetchNotifications = async (email: string) => {
    setLoading(true);
    try {
      console.log(`Fetching notifications for: ${email}`);
      
      // Use the proper API endpoint for fetching user notifications
      const response = await axios.get(`${API_BASE_URL}/api/notifications/user/${email}`);
      
      if (response.data) {
        console.log('Notifications fetched:', response.data);
        
        // Format the notifications for display
        const formattedNotifications = response.data.map((notification: any) => ({
          id: notification.id || Math.random().toString(),
          title: notification.title || 'Notification',
          message: notification.message || 'No message content',
          senderEmail: notification.senderEmail || '',
          senderName: notification.senderName || 'System',
          notificationType: notification.notificationType || 'GENERAL',
          isRead: notification.isRead || false,
          createdAt: notification.createdAt || new Date().toISOString(),
          relatedEntityId: notification.relatedEntityId || ''
        }));
        
        // Debug unread count
        const unreadCount = formattedNotifications.filter((n: Notification) => !n.isRead).length;
        console.log('Unread notification count:', unreadCount);
        console.log('Unread notifications:', formattedNotifications.filter((n: Notification) => !n.isRead));
        
        // Sort notifications by creation date (newest first)
        formattedNotifications.sort((a: Notification, b: Notification) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    if (userEmail) {
      fetchNotifications(userEmail);
    } else {
      setRefreshing(false);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async (email: string) => {
    try {
      try {
        // Try to use the bulk update endpoint first
        await axios.post(`${API_BASE_URL}/api/notifications/user/${email}/read-all`);
        console.log('All notifications marked as read using bulk endpoint');
      } catch (error) {
        // If bulk update fails with 403, fall back to marking each notification individually
        console.error('Bulk mark as read failed:', error);
        
        // Only proceed with individual updates if we have notifications to update
        if (notifications.length > 0) {
          console.log('Falling back to marking notifications individually');
          
          // Get all unread notifications
          const unreadNotifications = notifications.filter(notification => !notification.isRead);
          
          // Mark each unread notification as read individually
          for (const notification of unreadNotifications) {
            try {
              await axios.post(`${API_BASE_URL}/api/notifications/${notification.id}/read`);
              console.log(`Notification ${notification.id} marked as read`);
            } catch (individualError) {
              console.error(`Failed to mark notification ${notification.id} as read:`, individualError);
            }
          }
        }
      }
      
      // Update local state to show all notifications as read, regardless of API success
      setNotifications(prevNotifications => 
        prevNotifications.map(item => ({ ...item, isRead: true }))
      );
      
      console.log('All notifications marked as read locally');
    } catch (error) {
      console.error('Error in markAllAsRead function:', error);
    }
  };
  
  // Mark a single notification as read and navigate if needed
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Skip API call if already read
      if (!notification.isRead) {
        await axios.post(`${API_BASE_URL}/api/notifications/${notification.id}/read`);
        
        // Update local state
        setNotifications(notifications.map(item => 
          item.id === notification.id ? { ...item, isRead: true } : item
        ));
      }
      
      // Navigate based on notification type
      if (notification.relatedEntityId && notification.notificationType === 'MENU_UPDATE') {
        // Navigate to menu screen using string path to avoid type errors
        router.push('/mess/' + notification.relatedEntityId + '/menu' as any);
      } else if (notification.relatedEntityId && notification.notificationType === 'PAYMENT_DUE') {
        // Navigate to payment screen using string path to avoid type errors
        router.push('/mess/pay-dues?messId=' + notification.relatedEntityId as any);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
      Alert.alert('Error', 'Failed to process notification');
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MENU_UPDATE':
        return 'restaurant-outline';
      case 'PAYMENT_DUE':
        return 'cash-outline';
      case 'OWNER_MESSAGE':
        return 'mail-outline';
      case 'ANNOUNCEMENT':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };
  
  // Get color based on notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'MENU_UPDATE':
        return '#10b981'; // green
      case 'PAYMENT_DUE':
        return '#ef4444'; // red
      case 'OWNER_MESSAGE':
        return '#3b82f6'; // blue
      case 'ANNOUNCEMENT':
        return '#f97316'; // orange
      default:
        return '#8b5cf6'; // purple
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(drawer)/(tabs)')}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Notifications</Text>
        <View style={styles.optionsButton} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[accentColor]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading notifications...
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.notificationCard, 
                    { backgroundColor: cardBg }
                  ]}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={[
                    styles.iconContainer, 
                    { backgroundColor: getNotificationColor(item.notificationType) + '20' }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(item.notificationType)} 
                      size={24} 
                      color={getNotificationColor(item.notificationType)} 
                    />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, { color: textColor }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.notificationTime, { color: subTextColor }]}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                    
                    <Text 
                      style={[styles.notificationMessage, { color: subTextColor }]}
                      numberOfLines={2}
                    >
                      {item.message}
                    </Text>
                    
                    <Text style={[styles.senderName, { color: subTextColor }]}>
                      From: {item.senderName || item.senderEmail}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color={subTextColor} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: subTextColor }]}>
                  No notifications
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 300,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  senderName: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
}); 