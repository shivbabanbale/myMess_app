import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '@/app/_layout';

// Backend API URL
const API_URL = 'http://localhost:8080';

// User data interface
interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  imageName?: string;
}

// Drawer menu item interface
interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

// Drawer menu items
const menuItems: MenuItem[] = [
  {
    label: 'Home',
    icon: 'home-outline',
    route: '/(drawer)/(tabs)'
  },
  {
    label: 'My Profile',
    icon: 'person-outline',
    route: '/(drawer)/(tabs)/profile'
  },
  {
    label: 'Favorite Messes',
    icon: 'heart-outline',
    route: '/(drawer)/favorites'
  },
  {
    label: 'Order History',
    icon: 'time-outline',
    route: '/(drawer)/(tabs)/history'
  },
  {
    label: 'My Subscription',
    icon: 'calendar-outline',
    route: '/(drawer)/subscription'
  },
  {
    label: 'Notifications',
    icon: 'notifications-outline',
    route: '/(drawer)/notifications',
    badge: '3'
  },
  {
    label: 'Payment Methods',
    icon: 'card-outline',
    route: '/(drawer)/payment'
  },
  {
    label: 'Help & Support',
    icon: 'help-circle-outline',
    route: '/(drawer)/support'
  },
  {
    label: 'Settings',
    icon: 'settings-outline',
    route: '/(drawer)/settings'
  },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userEmail, userType, logout } = useContext(AuthContext);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const itemBgColor = isDark ? '#1a1a1a' : '#ffffff';
  
  useEffect(() => {
    fetchUserData();
  }, [userEmail]);
  
  const fetchUserData = async () => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }
  
    try {
      setIsLoading(true);
      
      // First try to get cached data from AsyncStorage
      const cachedData = await AsyncStorage.getItem('userData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setUserData({
          name: parsedData.name || 'User',
          email: parsedData.email || userEmail,
          phone: parsedData.phoneNumber || parsedData.phone || 'Not provided',
          address: parsedData.address || 'Not provided',
          imageName: parsedData.imageName,
        });
      }
      
      // Then try to fetch fresh data
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // Use the correct endpoint
      const endpoint = userType === 'owner' 
        ? '/mess/byEmail' 
        : '/byEmail';
      
      const url = `${API_URL}${endpoint}/${encodeURIComponent(userEmail || '')}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error('Error fetching user data for drawer');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      // Update userData with fresh data
      setUserData({
        name: data.name || 'User',
        email: data.email || userEmail || '',
        phone: data.phoneNumber || data.phone || 'Not provided',
        address: data.address || 'Not provided',
        imageName: data.imageName,
      });
      
      // Store the complete user data
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProfileImageUrl = (): string => {
    if (!userEmail) return '';
    const timestamp = new Date().getTime();
    return `${API_URL}/profile/${encodeURIComponent(userEmail)}?t=${timestamp}`;
  };
  
  const handleNavigation = (route: string) => {
    router.push(route as any);
    props.navigation.closeDrawer();
  };
  
  const handleLogout = () => {
    logout();
    props.navigation.closeDrawer();
    router.push('/login');
  };
  
  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor }}
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Header */}
      <LinearGradient
        colors={isDark 
          ? ['#4f46e5', '#3b82f6'] 
          : ['#3b82f6', '#4f46e5']}
        style={styles.profileContainer}
      >
        <View style={styles.profileHeader}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <>
              {userData?.imageName ? (
                <Image 
                  source={{ 
                    uri: getProfileImageUrl(),
                    headers: { 'Cache-Control': 'no-store' },
                    cache: 'reload'
                  }} 
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/react-logo.png')}
                  onError={() => console.log('Error loading drawer profile image')}
                />
              ) : (
                <Image 
                  source={require('@/assets/images/react-logo.png')} 
                  style={styles.profileImage} 
                />
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: 'white' }]}>
                  {userData?.name || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                  {userData?.email || userEmail || 'No email'}
                </Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.locationText}>
                    {userData?.address || 'Address not set'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => handleNavigation('/(drawer)/(tabs)/profile')}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.menuItem, { backgroundColor: itemBgColor }]}
            onPress={() => handleNavigation(item.route)}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={item.icon as any} 
                size={22} 
                color={isDark ? '#3b82f6' : '#4f46e5'} 
              />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>
              {item.label}
            </Text>
            {item.badge && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      
      {/* Footer Options */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => handleNavigation('/(drawer)/about')}
        >
          <Ionicons name="information-circle-outline" size={18} color={subTextColor} />
          <Text style={[styles.footerText, { color: subTextColor }]}>About MyMess</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#FF5252" />
          <Text style={[styles.footerText, { color: '#FF5252' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: subTextColor }]}>
          Version 1.0.0
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    padding: 20,
    paddingBottom: 15,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    flex: 1,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  badgeContainer: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  footer: {
    padding: 15,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
  },
});

export default CustomDrawerContent; 