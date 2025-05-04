import React, { useContext, useEffect, useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthContext } from '@/app/_layout';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL - update this to your actual backend URL
// For testing on a real device, use your computer's actual IP address
//const API_URL = 'http://10.0.2.2:8080'; // For Android Emulator
 const API_URL = 'http://localhost:8080'; // Only works in web browser, not on devices

// User data interface
interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
  messSubscriptions: number;
  imageName?: string; // Add image name from backend
  // Add any other fields that your backend returns
}

// Option card component props interface
interface OptionCardProps {
  icon: any; // Use any for Ionicons name
  title: string;
  subtitle: string;
  showBadge?: boolean;
  isDark: boolean;
  onPress?: () => void;
}

// Option card component
const OptionCard: React.FC<OptionCardProps> = ({ icon, title, subtitle, showBadge = false, isDark, onPress }) => {
  const textColor = isDark ? '#ffffff' : '#333333';
  const subtitleColor = isDark ? '#a0a0a0' : '#666666';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  
  return (
    <TouchableOpacity 
      style={[styles.optionCard, { backgroundColor: cardBg, borderBottomColor: isDark ? '#333333' : '#e5e7eb' }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2d2d2d' : '#f3f4f6' }]}>
        <Ionicons name={icon} size={22} color={isDark ? '#3b82f6' : '#4f46e5'} />
      </View>
      
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.optionSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
        )}
      </View>
      
      {showBadge ? (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>New</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#777777' : '#999999'} />
      )}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { logout, userEmail, userType } = useContext(AuthContext);
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = colorScheme === 'dark';
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const sectionBgColor = isDark ? '#1a1a1a' : '#ffffff';
  
  useEffect(() => {
    fetchUserProfile();
    
    // Add listener to refresh profile when returning from edit screen
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Profile screen focused, refreshing data');
      // Clear any cached data first
      setUserData(null);
      // Then fetch fresh data
      fetchUserProfile();
    });
    
    // Cleanup listener on unmount
    return unsubscribe;
  }, [userEmail, navigation]);

  const fetchUserProfile = async () => {
    if (!userEmail) {
      setError('User email not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }

      // Use the correct endpoint from UserController.java - byEmail/{email}
      const endpoint = userType === 'owner' 
        ? '/mess/byEmail'  // MessOwnerController endpoint
        : '/byEmail';      // UserController endpoint

      const url = getApiUrl(endpoint, userEmail);
      console.log(`Fetching profile with: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Add cache control to avoid stale data
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Profile data received:', JSON.stringify(data));
      
      // Add detailed logging for debugging
      console.log('Subscriptions array:', data.subscriptions);
      console.log('MessId direct value:', data.messId);
      console.log('Has joined a mess?', data.messId ? 'Yes' : 'No');
      
      // Transform the data if needed to match the UserData interface
      const formattedData: UserData = {
        name: data.name || 'User',
        email: data.email || userEmail,
        phone: data.phoneNumber || data.phone || 'Not provided',
        address: data.address || 'Not provided',
        memberSince: data.currentDate || 'Recently joined',
        messSubscriptions: data.messId ? 1 : 0, // If messId exists, user has joined a mess
        imageName: data.imageName,
        // Map other fields as needed
      };
      
      console.log('Formatted mess subscriptions:', formattedData.messSubscriptions);
      
      setUserData(formattedData);
      setError(null);
      
      // Store the complete user data for edit profile page
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      
      // Log image info for debugging
      if (data.imageName) {
        console.log('Profile has image:', data.imageName);
        console.log('Image URL will be:', getProfileImageUrl());
      } else {
        console.log('No profile image found in data');
      }
      
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(`Failed to fetch profile: ${err.message}`);
      
      // For development, use mock data when API fails
      setUserData({
        name: 'User',
        email: userEmail || 'user@example.com',
        phone: 'Not available - Contact needed',
        address: 'Not available',
        memberSince: 'Recently joined',
        messSubscriptions: 0,
        imageName: 'react-logo.png',
      });
      
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleEditProfile = () => {
    router.push('/screens/profile/update-profile');
  };

  const handleRefresh = () => {
    fetchUserProfile();
  };
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUserProfile().then(() => setRefreshing(false));
  }, []);
  
  // Helper function for safely constructing API URLs
  const getApiUrl = (path: string, emailParam?: string | null) => {
    const safeEmail = emailParam || '';
    let fullPath = path;
    if (userType === 'owner' && !path.startsWith('/mess')) {
      // Add mess prefix for owner endpoints that don't have it yet
      if (path === '/profile') fullPath = '/mess/profile';
      else if (path === '/byEmail') fullPath = '/mess/byEmail';
    }
    return `${API_URL}${fullPath}/${encodeURIComponent(safeEmail)}`;
  };
  
  // Update image URL construction with proper type safety
  const getProfileImageUrl = (): string => {
    if (!userEmail) {
      console.error('No user email available for profile image');
      return ''; 
    }
    
    // Direct URL to the profile image at root Image/users directory
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const imageUrl = `${API_URL}/profile/${encodeURIComponent(userEmail)}?t=${timestamp}`;
    console.log('Profile image URL:', imageUrl);
    return imageUrl;
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#4f46e5'} />
        <Text style={[styles.loadingText, { color: textColor }]}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error && !userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={50} color={isDark ? '#FF5252' : '#FF5252'} />
        <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: sectionBgColor }]}>
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              <LinearGradient
                colors={isDark 
                  ? ['#4f46e5', '#3b82f6'] 
                  : ['#3b82f6', '#4f46e5']}
                style={styles.profileImageBorder}
              >
                {userData?.imageName ? (
                  <Image 
                    source={{ 
                      uri: `${getProfileImageUrl()}?t=${new Date().getTime()}`, 
                      headers: { 'Cache-Control': 'no-store' },
                      cache: 'reload'
                    }}
                    onLoadStart={() => console.log('Starting to load profile image')}
                    onLoad={() => console.log('Profile image loaded successfully')}
                    onError={(e) => console.error('Profile image loading error:', e.nativeEvent.error)}
                    style={styles.profileImage}
                    defaultSource={require('@/assets/images/react-logo.png')}  
                  />
                ) : (
                  <Image 
                    source={require('@/assets/images/react-logo.png')} 
                    style={styles.profileImage} 
                  />
                )}
              </LinearGradient>
            </View>
            
            <View style={styles.nameContainer}>
              <Text style={[styles.userName, { color: textColor }]}>{userData?.name || 'User'}</Text>
              
              <View style={styles.infoRow}>
                <View style={[styles.iconBackground, { backgroundColor: isDark ? '#2d2d2d' : '#f3f4f6' }]}>
                  <Ionicons name="mail-outline" size={14} color={isDark ? '#3b82f6' : '#4f46e5'} />
                </View>
                <Text style={[styles.userInfo, { color: isDark ? '#a0a0a0' : '#666666' }]} numberOfLines={1} ellipsizeMode="tail">
                  {userData?.email || userEmail || 'Not available'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={[styles.iconBackground, { backgroundColor: isDark ? '#2d2d2d' : '#f3f4f6' }]}>
                  <Ionicons name="call-outline" size={14} color={isDark ? '#3b82f6' : '#4f46e5'} />
                </View>
                <Text style={[styles.userInfo, { color: isDark ? '#a0a0a0' : '#666666' }]} numberOfLines={1} ellipsizeMode="tail">
                  <Text style={{ fontWeight: '500' }}> </Text>
                  {userData?.phone || 'Not available'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={[styles.iconBackground, { backgroundColor: isDark ? '#2d2d2d' : '#f3f4f6' }]}>
                  <Ionicons name="location-outline" size={14} color={isDark ? '#3b82f6' : '#4f46e5'} />
                </View>
                <Text style={[styles.userInfo, { color: isDark ? '#a0a0a0' : '#666666' }]} numberOfLines={1} ellipsizeMode="tail">
                  {userData?.address || 'Address not set'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={[styles.iconBackground, { backgroundColor: isDark ? '#2d2d2d' : '#f3f4f6' }]}>
                  <Ionicons name="calendar-outline" size={14} color={isDark ? '#3b82f6' : '#4f46e5'} />
                </View>
                <Text style={[styles.userInfo, { color: isDark ? '#a0a0a0' : '#666666' }]} numberOfLines={1} ellipsizeMode="tail">
                  Member since: {userData?.memberSince || 'Recently joined'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>{userData?.messSubscriptions || 0}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                {userData?.messSubscriptions ? 'Current Mess' : 'No Mess Joined'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: isDark ? '#333333' : '#e5e7eb' }]}
            onPress={handleEditProfile}
          >
            <Text style={[styles.editButtonText, { color: isDark ? '#3b82f6' : '#4f46e5' }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Account Settings</Text>
          
          <View style={[styles.optionsContainer, { backgroundColor: sectionBgColor }]}>
            <OptionCard 
              icon="location-outline" 
              title="Address" 
              subtitle={userData?.address || 'Add your address'}
              isDark={isDark}
              onPress={handleEditProfile}
            />
            <OptionCard 
              icon="notifications-outline" 
              title="Notifications" 
              subtitle="Manage notification preferences"
              showBadge={true}
              isDark={isDark}
            />
          </View>
        </View>
        
        {/* More Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>More Options</Text>
          
          <View style={[styles.optionsContainer, { backgroundColor: sectionBgColor }]}>
            <OptionCard 
              icon="information-circle-outline" 
              title="About MyMess" 
              subtitle="Version 1.0.0"
              isDark={isDark}
            />
            <OptionCard 
              icon="log-out-outline" 
              title="Logout" 
              subtitle="Sign out from current session"
              isDark={isDark}
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    padding: 20,
    borderRadius: 20,
    margin: 16,
    marginTop: 30,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImageBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  nameContainer: {
    flex: 1,
    paddingTop: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    flex: 1,
  },
  iconBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  editButton: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  optionsContainer: {
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  badgeContainer: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  retryButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinMessButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinMessIcon: {
    marginRight: 8,
  },
  joinMessText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
}); 