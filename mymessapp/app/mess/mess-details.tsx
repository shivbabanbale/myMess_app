import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Animated,
  ImageBackground,
  FlatList,
  Platform,
  Share,
  Linking,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as Location from 'expo-location';
import { API_BASE_URL } from '@/app/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 300;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Sample images
const messImages = [
  require('@/assets/images/react-logo.png'),
  require('@/assets/images/react-logo.png'),
  require('@/assets/images/react-logo.png'),
  require('@/assets/images/react-logo.png'),
];

// Sample menu data
const weeklyMenu = {
  Monday: {
    breakfast: 'Poha, Tea, Boiled Eggs',
    lunch: 'Rice, Dal, Aloo Gobi, Salad',
    dinner: 'Roti, Mixed Veg, Paneer Curry, Rice'
  },
  Tuesday: {
    breakfast: 'Upma, Coffee, Fruits',
    lunch: 'Rice, Rajma, Bhindi Fry, Raita',
    dinner: 'Roti, Chicken Curry, Dal, Rice'
  },
  Wednesday: {
    breakfast: 'Idli, Sambar, Tea',
    lunch: 'Rice, Dal Tadka, Egg Curry, Salad',
    dinner: 'Roti, Palak Paneer, Rice, Kheer'
  },
  Thursday: {
    breakfast: 'Paratha, Curd, Tea',
    lunch: 'Rice, Chole, Matar Paneer, Salad',
    dinner: 'Roti, Fish Curry, Dal, Rice'
  },
  Friday: {
    breakfast: 'Bread, Butter, Jam, Coffee',
    lunch: 'Rice, Dal, Mixed Veg, Papad',
    dinner: 'Biryani, Raita, Gulab Jamun'
  },
  Saturday: {
    breakfast: 'Aloo Paratha, Tea, Pickle',
    lunch: 'Rice, Dal, Soya Chunks Curry, Salad',
    dinner: 'Roti, Mutton Curry, Dal, Rice'
  },
  Sunday: {
    breakfast: 'Poori, Bhaji, Coffee',
    lunch: 'Pulao, Raita, Pickle, Papad',
    dinner: 'Special Thali (Variety of dishes)'
  }
};

// Add interface for Feedback/Reviews
interface FeedbackItem {
  id: string;
  messEmail: string;
  userEmail: string;
  feedbackText: string;
  rating: number;
  userName?: string;
  createdAt?: string; // Date when feedback was submitted
  profilePhoto?: string | null; // URL to user profile photo
}

// Sample mess data (would normally be fetched based on ID)
const messData = {
  id: '1',
  name: 'Maharaja Mess',
  rating: 4.5,
  reviews: 128,
  price: '₹3,000/month',
  address: '123, College Road, Pune - 411041',
  contact: '+91 9876543210',
  email: 'maharaja@messfinder.com',
  description: 'Maharaja Mess offers a variety of homely and nutritious meals at affordable prices. Our specialized chefs prepare delicious food with high-quality ingredients. We provide monthly and daily meal options to suit your needs.',
  distance: '1.2 km',
  openTiming: '7:00 AM - 10:00 PM',
  images: messImages,
  features: ['WiFi', 'AC Dining', 'Home Delivery', 'Special Sunday Menu', 'Hygienic Kitchen'],
  vegetarian: false
};

// Additional sample mess data for demonstration
const messSamples = [
  {
    id: '1',
    name: 'Maharaja Mess',
    rating: 4.5,
    reviews: 128,
    price: '₹3,000/month',
    address: '123, College Road, Pune - 411041',
    contact: '+91 9876543210',
    email: 'maharaja@messfinder.com',
    description: 'Maharaja Mess offers a variety of homely and nutritious meals at affordable prices. Our specialized chefs prepare delicious food with high-quality ingredients. We provide monthly and daily meal options to suit your needs.',
    distance: '1.2 km',
    openTiming: '7:00 AM - 10:00 PM',
    images: messImages,
    features: ['WiFi', 'AC Dining', 'Home Delivery', 'Special Sunday Menu', 'Hygienic Kitchen'],
    vegetarian: false
  },
  {
    id: '2',
    name: 'Green Villa Mess',
    rating: 4.8,
    reviews: 95,
    price: '₹3,500/month',
    address: '45, Green Park, Koregaon Park, Pune - 411001',
    contact: '+91 8765432109',
    email: 'greenvilla@messfinder.com',
    description: 'Green Villa is a premium vegetarian mess offering fresh and organic food options. Our menu is crafted by expert nutritionists to ensure balanced meals every day.',
    distance: '2.4 km',
    openTiming: '6:30 AM - 9:30 PM',
    images: messImages,
    features: ['Pure Vegetarian', 'Organic Ingredients', 'Monthly Plans', 'Weekend Specials', 'Clean Dining Area'],
    vegetarian: true
  },
  {
    id: '3',
    name: 'Students\' Delight',
    rating: 4.2,
    reviews: 210,
    price: '₹2,500/month',
    address: '78, University Road, Near Campus, Pune - 411007',
    contact: '+91 7890123456',
    email: 'students@messfinder.com',
    description: 'Students\' Delight is the most budget-friendly mess near the university. We understand student needs and provide tasty and filling meals at affordable prices.',
    distance: '0.5 km',
    openTiming: '7:00 AM - 11:00 PM',
    images: messImages,
    features: ['Student Discounts', 'Late Night Dining', 'Monthly & Weekly Plans', 'Extra Portions Option', 'Common Study Area'],
    vegetarian: false
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
  },
  collapsedBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 0,
  },
  messInfoCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginHorizontal: 0,
    marginBottom: 8,
  },
  messBasicInfo: {
    marginBottom: 16,
  },
  messNameContainer: {
    marginBottom: 8,
  },
  messName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  messTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  messType: {
    fontSize: 14,
  },
  messDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messDetailText: {
    fontSize: 14,
    marginLeft: 5,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888888',
    marginHorizontal: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  contentTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  // Menu styles
  menuContainer: {
    marginBottom: 24,
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysScrollContent: {
    paddingHorizontal: 4,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  mealsContainer: {
    marginBottom: 16,
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  mealHeader: {
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealItems: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Image gallery styles
  imageGalleryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  imagesContainer: {
    paddingRight: 16,
  },
  galleryImageContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 180,
    height: 120,
    borderRadius: 12,
  },
  // Features styles
  featuresContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 6,
  },
  featureText: {
    fontSize: 14,
  },
  // Reviews styles
  reviewsContainer: {
    marginBottom: 24,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  writeReviewText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Booking button
  bookingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bookButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  bookSlotButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingButtonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  loadingGallery: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGalleryImages: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Full screen image viewer styles
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  joinActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  reviewerInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loadingReviews: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reviewError: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noReviews: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bookingButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateContainer: {
    paddingVertical: 8,
  },
  dateItem: {
    width: 80,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  slotItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginHorizontal: '1%',
    borderWidth: 1,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
});

export default function MessDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('photos');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for full-screen image viewer
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  
  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const highlightColor = isDark ? '#3b82f6' : '#4f46e5';
  
  // Use messId from params, fallback to '1'
  const messId = params.id as string || '1';
  const messEmail = params.email as string || '';
  
  // State for mess data
  const [mess, setMess] = useState<any>(messData);
  // Add state for gallery images
  const [galleryImages, setGalleryImages] = useState<Array<any>>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  
  // State for weekly menu
  const [weeklyMenuData, setWeeklyMenuData] = useState<any>({});
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  
  // State for image loading errors
  const [headerImageError, setHeaderImageError] = useState(false);
  
  // Add a state for the profile image
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  
  // Add state for reviews/feedback
  const [reviews, setReviews] = useState<FeedbackItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  
  // Add state for user location
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [distanceToMess, setDistanceToMess] = useState<string | null>(null);
  
  // Add new states for book slot
  const [showBookSlotModal, setShowBookSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isBookingSlot, setIsBookingSlot] = useState(false);
  
  // Time slots for booking
  const timeSlots = [
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '7:00 PM - 8:00 PM',
    '8:00 PM - 9:00 PM',
  ];
  
  // Add state for toast notifications
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  // Function to show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    
    // Animate toast in
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Show for 3 seconds
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };
  
  // Fetch weekly menu
  useEffect(() => {
    const fetchWeeklyMenu = async () => {
      if (!messEmail) {
        console.error("No mess email available for fetching menu");
        return;
      }
      
      try {
        setIsLoadingMenu(true);
        setMenuLoaded(false);
        
        // Try different URL formats if needed
        // First try with localhost - same origin for web
        console.log(`Trying to fetch menu for email: ${messEmail}`);
        
        const fetchOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          mode: 'cors' as RequestMode
        };
        
        // Create the URL with a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const menuUrl = `http://localhost:8080/menu/latest/${messEmail}?_=${timestamp}`;
        console.log(`Fetching menu from: ${menuUrl}`);
        
        const menuResponse = await fetch(menuUrl, fetchOptions);
        
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          console.log('Menu data received:', JSON.stringify(menuData).substring(0, 200) + '...');
          
          // Helper function to safely extract meal data from potentially different formats
          const getMealData = (dayMenu: any, mealType: string): string => {
            // Handle null or undefined dayMenu
            if (!dayMenu) {
              return 'Not specified';
            }
            
            // Case 1: If dayMenu is a Map with direct string values for meal types
            if (typeof dayMenu === 'object' && dayMenu[mealType]) {
              return dayMenu[mealType];
            }
            
            // Case 2: If dayMenu has breakfast/lunch/dinner as nested objects with a 'value' property
            if (typeof dayMenu === 'object' && 
                dayMenu[mealType] && typeof dayMenu[mealType] === 'object' && 
                dayMenu[mealType].value) {
              return dayMenu[mealType].value;
            }
            
            // Case 3: If dayMenu is a string (whole day menu as one string)
            if (typeof dayMenu === 'string') {
              return dayMenu;
            }
            
            return 'Not specified';
          };
          
          // Before creating transformed menu, check if data has the expected structure
          if (!menuData.mondayMenu && !menuData.tuesdayMenu && !menuData.wednesdayMenu) {
            console.warn('Menu data does not have expected day properties:', Object.keys(menuData));
            // Fall back to sample data
            setWeeklyMenuData(weeklyMenu);
            setMenuLoaded(true);
            return;
          }
          
          // Create a transformed menu structure to match our UI format
          const transformedMenu: any = {
            Monday: {
              breakfast: getMealData(menuData.mondayMenu, 'breakfast'),
              lunch: getMealData(menuData.mondayMenu, 'lunch'),
              dinner: getMealData(menuData.mondayMenu, 'dinner')
            },
            Tuesday: {
              breakfast: getMealData(menuData.tuesdayMenu, 'breakfast'),
              lunch: getMealData(menuData.tuesdayMenu, 'lunch'),
              dinner: getMealData(menuData.tuesdayMenu, 'dinner')
            },
            Wednesday: {
              breakfast: getMealData(menuData.wednesdayMenu, 'breakfast'),
              lunch: getMealData(menuData.wednesdayMenu, 'lunch'),
              dinner: getMealData(menuData.wednesdayMenu, 'dinner')
            },
            Thursday: {
              breakfast: getMealData(menuData.thursdayMenu, 'breakfast'),
              lunch: getMealData(menuData.thursdayMenu, 'lunch'),
              dinner: getMealData(menuData.thursdayMenu, 'dinner')
            },
            Friday: {
              breakfast: getMealData(menuData.fridayMenu, 'breakfast'),
              lunch: getMealData(menuData.fridayMenu, 'lunch'),
              dinner: getMealData(menuData.fridayMenu, 'dinner')
            },
            Saturday: {
              breakfast: getMealData(menuData.saturdayMenu, 'breakfast'),
              lunch: getMealData(menuData.saturdayMenu, 'lunch'),
              dinner: getMealData(menuData.saturdayMenu, 'dinner')
            },
            Sunday: {
              breakfast: getMealData(menuData.sundayMenu, 'breakfast'),
              lunch: getMealData(menuData.sundayMenu, 'lunch'),
              dinner: getMealData(menuData.sundayMenu, 'dinner')
            }
          };
          
          console.log('Transformed menu structure:', Object.keys(transformedMenu));
          setWeeklyMenuData(transformedMenu);
          setMenuLoaded(true);
          setActiveTab('menu'); // Automatically switch to menu tab when data is loaded
        } else {
          // Check for a 404 response specifically (menu not found for this mess)
          if (menuResponse.status === 404) {
            console.log('No menu found for this mess, using sample menu data instead');
            // Use sample data without showing an error
            setWeeklyMenuData(weeklyMenu);
            setMenuLoaded(true);
          } else {
            // For other errors, log them but still use sample data
            console.warn(`Menu endpoint returned ${menuResponse.status}:`, await menuResponse.text());
            setWeeklyMenuData(weeklyMenu);
            setMenuLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly menu:', error);
        // Keep using the default sample data on error
        setWeeklyMenuData(weeklyMenu); // Use the sample menu data from the top of the file
        setMenuLoaded(true);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    
    fetchWeeklyMenu();
  }, [messEmail]);

  // Fetch gallery images
  useEffect(() => {
    const fetchGalleryImages = async () => {
      if (!messEmail) return;
      
      try {
        setIsLoadingGallery(true);
        
        // Get actual image files from the server filesystem
        const imagesResponse = await fetch(`${API_BASE_URL}/mess/actual-images`);
        
        if (!imagesResponse.ok) {
          throw new Error(`Failed to fetch mess images: ${imagesResponse.status}`);
        }
        
        const imageUrls = await imagesResponse.json();
        
        const galleryImages = [];
        
        // First add the profile image
        galleryImages.push({
          uri: `${API_BASE_URL}/mess/profile/${messEmail}`,
          name: "Profile Image",
          isProfile: true
        });
        
        // Add gallery images with the URLs that point directly to the existing files
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
          imageUrls.forEach((imageUrl, index) => {
            // Extract filename for display
            const filename = imageUrl.split('/').pop() || '';
            
            galleryImages.push({
              uri: imageUrl,
              name: `Gallery Image ${index+1}`,
              filename: filename
            });
          });
        }
        
        setGalleryImages(galleryImages);
        
        // Set photos as the active tab
        setActiveTab('photos');
        
      } catch (error) {
        console.error('Error setting gallery images:', error);
        setGalleryImages([{
          uri: `${API_BASE_URL}/mess/profile/${messEmail}`,
          name: "Profile Image",
          isProfile: true
        }]);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    
    fetchGalleryImages();
  }, [messEmail, setActiveTab]);
  
  // Fetch profile image
  useEffect(() => {
    const getProfileImage = async () => {
      if (!messEmail) return;
      
      try {
        // Get the profile image URL directly from server response 
        const profileUrl = `${API_BASE_URL}/mess/profile/${messEmail}`;
        console.log('Using profile URL:', profileUrl);
        // Set the URL directly without HEAD check
        setProfileImageUrl(profileUrl);
      } catch (error) {
        console.error('Error setting profile image:', error);
        setProfileImageUrl(null);
      }
    };
    
    getProfileImage();
  }, [messEmail]);
  
  // Fetch mess details
  useEffect(() => {
    const fetchMessDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/mess/getById/${messId}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error('No data received from server');
        }
        
        // Process mess images
        let messImages = [];
        
        // First, add the profile image if available
        if (profileImageUrl) {
          messImages.push({ uri: profileImageUrl });
        }
        
        // For additional images, get the actual image files from the server filesystem
        try {
          const imagesResponse = await fetch(`${API_BASE_URL}/mess/actual-images`);
          if (imagesResponse.ok) {
            const imageUrls = await imagesResponse.json();
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
              // Add these images to our collection
              const additionalImages = imageUrls.map((imageUrl: string) => ({ uri: imageUrl }));
              messImages = [...messImages, ...additionalImages];
            }
          }
        } catch (imgError) {
          console.error('Error fetching mess images:', imgError);
        }
        
        // Ensure we have at least one image - use default if none from API
        if (messImages.length === 0) {
          messImages = [require('@/assets/images/react-logo.png')];
        }
        
        // Create subscription price string
        let priceString = '';
        if (data.subscriptionPlan) {
          priceString = `₹${data.subscriptionPlan}/month`;
        } else if (data.pricePerMeal) {
          priceString = `₹${data.pricePerMeal}/meal`;
        } else {
          priceString = 'Price not available';
        }
        
        // Transform API data to match our UI model
        const transformedData = {
          id: data.id || messId,
          name: data.messName || 'Unknown Mess',
          rating: parseFloat(data.averageRating || '4.5'),
          reviews: parseInt(data.feedbackCount || '0'),
          price: priceString,
          pricePerMeal: data.pricePerMeal,
          subscriptionPlan: data.subscriptionPlan,
          address: data.messAddress || 'Address not available',
          contact: data.contact || '+91 9876543210',
          email: data.email || messEmail || 'contact@messfinder.com',
          description: data.description || 'No description available',
          distance: '1.2 km', // Will be calculated using real location
          openTiming: '7:00 AM - 10:00 PM', // Fallback
          vegetarian: data.messType === 'Veg',
          images: messImages,
          features: ['WiFi', 'AC Dining', 'Home Delivery', 'Special Sunday Menu', 'Hygienic Kitchen'], // Fallback features
          capacity: data.capacity || 50,
          location: {
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
          }
        };
        
        setMess(transformedData);
      } catch (error) {
        console.error('Error fetching mess details:', error);
        setError('Failed to load mess details. Please try again.');
        // Keep the default data if the API fails
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessDetails();
  }, [messId, messEmail, profileImageUrl]);
  
  // Add a function to fetch reviews from the API
  useEffect(() => {
    const fetchReviews = async () => {
      if (!messEmail) return;
      
      try {
        setIsLoadingReviews(true);
        setReviewsError(null);
        
        const response = await fetch(`${API_BASE_URL}/feedback/${messEmail}`);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.warn('Reviews data is not an array:', data);
          setReviews([]);
          return;
        }
        
        console.log(`Original reviews count: ${data.length}`);
        
        // First deduplicate by review ID
        const reviewsByIdMap = new Map();
        data.forEach((review: FeedbackItem) => {
          reviewsByIdMap.set(review.id, review);
        });
        
        // Then deduplicate by user email (keeping only the most recent review from each user)
        const reviewsByUserMap = new Map();
        Array.from(reviewsByIdMap.values()).forEach((review: FeedbackItem) => {
          const existingReview = reviewsByUserMap.get(review.userEmail);
          
          // If we don't have a review from this user yet, or this review is newer
          // (assuming IDs are sortable by recency - higher/later ID is more recent)
          if (!existingReview || review.id > existingReview.id) {
            reviewsByUserMap.set(review.userEmail, review);
          }
        });
        
        // Get unique reviews after both deduplication steps
        const uniqueReviews = Array.from(reviewsByUserMap.values());
        
        console.log(`After deduplication by ID and email: ${uniqueReviews.length} unique reviews`);
        
        // Enhance the reviews with user names and profile photos by fetching user details
        const enhancedReviews = await Promise.all(
          uniqueReviews.map(async (review: FeedbackItem) => {
            try {
              const userResponse = await fetch(`${API_BASE_URL}/byEmail/${review.userEmail}`);
              if (!userResponse.ok) {
                return {
                  ...review,
                  userName: 'Anonymous User',
                  createdAt: new Date().toDateString(), // Fallback to current date
                  profilePhoto: null
                };
              }
              
              const userData = await userResponse.json();
              
              // Check if user has a profile photo and add it
              let profilePhoto = null;
              try {
                // Construct the profile image URL
                const photoUrl = `${API_BASE_URL}/profile/${review.userEmail}`;
                
                // Add profile photo URL
                profilePhoto = photoUrl;
                
                console.log(`Added profile photo for user: ${review.userEmail}`);
              } catch (photoError) {
                console.error(`Error adding profile photo for ${review.userEmail}:`, photoError);
              }
              
              return {
                ...review,
                userName: userData.name || 'Anonymous User',
                createdAt: new Date().toDateString(), // Fallback to current date if none provided
                profilePhoto
              };
            } catch (error) {
              console.error(`Error fetching user details for ${review.userEmail}:`, error);
              return {
                ...review,
                userName: 'Anonymous User',
                createdAt: new Date().toDateString(), // Fallback to current date
                profilePhoto: null
              };
            }
          })
        );
        
        // Sort reviews - newest first
        const sortedReviews = enhancedReviews.sort((a, b) => {
          return b.id.localeCompare(a.id);
        });
        
        console.log(`Final reviews count: ${sortedReviews.length}`);
        setReviews(sortedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviewsError('Failed to load reviews');
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    if (messEmail) {
      fetchReviews();
    }
  }, [messEmail]);
  
  // Log activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);
  
  // Functions
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${mess.name} on MyMess App! Great food at ${mess.price}.`,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleBooking = () => {
    // Navigate to join mess page with all necessary details
    console.log('Navigating to join mess with ID:', mess.id, 'and email:', mess.email);
    
    // Construct query params
    const params = new URLSearchParams();
    if (mess.id) params.append('messId', mess.id);
    if (mess.email) params.append('messEmail', mess.email);
    params.append('messName', mess.name);
    params.append('messPrice', mess.price);
    
    // Add the contact field which contains the mess owner's email
    if (mess.contact) params.append('contact', mess.contact);
    
    // For debugging in dev mode
    if (__DEV__) {
      console.log('Join mess URL:', `/screens/mess/join-mess?${params.toString()}`);
    }
    
    // Navigate with all required parameters
    router.push(`/screens/mess/join-mess?${params.toString()}`);
  };

  const handleBookSlot = () => {
    // Show the booking modal
    setSelectedDate(new Date());
    setSelectedSlot(null);
    setShowBookSlotModal(true);
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={14} color="#FFD700" />);
    }
    
    if (halfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#FFD700" />);
    }
    
    return stars;
  };
  
  const confirmSlotBooking = async () => {
    if (!selectedSlot || !selectedDate) {
      showToast('Please select both date and time slot', 'error');
      return;
    }
    
    setIsBookingSlot(true);
    
    try {
      // Get user email from AsyncStorage
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userName = await AsyncStorage.getItem('userName') || 'User';
      
      if (!userEmail) {
        showToast('You need to be logged in to book a slot', 'error');
        setIsBookingSlot(false);
        return;
      }
      
      // Format date for API - convert to YYYY-MM-DD format
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Prepare booking data based on the API requirements
      const bookingData = {
        userEmail,
        userName,
        messId: mess.id,
        messEmail: mess.email || messEmail,
        messName: mess.name,
        date: formattedDate,
        timeSlot: selectedSlot,
        status: "PENDING"
      };
      
      console.log('Booking slot with data:', bookingData);
      
      // Call API to book slot
      const response = await fetch(`${API_BASE_URL}/slot/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Slot booking response:', data);
        
        // Close modal and show success toast
        setShowBookSlotModal(false);
        showToast('Your slot has been booked successfully!', 'success');
      } else {
        const errorText = await response.text();
        console.error('Error booking slot:', errorText);
        
        // More descriptive error message
        if (response.status === 409) {
          showToast('This slot is already booked or unavailable', 'error');
        } else if (response.status === 400) {
          showToast('Invalid booking details provided', 'error');
        } else {
          showToast(`Failed to book slot (${response.status}). Please try again.`, 'error');
        }
      }
    } catch (error) {
      console.error('Error in slot booking:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsBookingSlot(false);
    }
  };
  
  const renderBookSlotModal = () => {
    return (
      <Modal
        visible={showBookSlotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookSlotModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Book a Slot</Text>
              <TouchableOpacity onPress={() => setShowBookSlotModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: subTextColor }]}>Select Date</Text>
            
            {/* Date selection */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateContainer}
            >
              {Array.from({ length: 7 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index);
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' });
                const dayName = date.toLocaleString('default', { weekday: 'short' });
                const isSelected = selectedDate && 
                  selectedDate.getDate() === date.getDate() && 
                  selectedDate.getMonth() === date.getMonth();
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.dateItem, 
                      { backgroundColor: isSelected ? highlightColor : isDark ? '#333' : '#f0f2f5' }
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={{ 
                      color: isSelected ? 'white' : textColor,
                      fontWeight: '600' 
                    }}>
                      {dayName}
                    </Text>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold',
                      color: isSelected ? 'white' : textColor
                    }}>
                      {day}
                    </Text>
                    <Text style={{ 
                      color: isSelected ? 'white' : subTextColor
                    }}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <Text style={[styles.modalSubtitle, { color: subTextColor, marginTop: 16 }]}>Select Time Slot</Text>
            
            {/* Time slot selection */}
            <View style={styles.slotsContainer}>
              {timeSlots.map((slot, index) => {
                const isSelected = selectedSlot === slot;
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.slotItem, 
                      { 
                        backgroundColor: isSelected ? highlightColor : isDark ? '#333' : '#f0f2f5',
                        borderColor: isSelected ? highlightColor : borderColor,
                      }
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={{ 
                      color: isSelected ? 'white' : textColor,
                      fontWeight: isSelected ? '600' : 'normal'
                    }}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                { 
                  backgroundColor: highlightColor,
                  opacity: (!selectedDate || !selectedSlot || isBookingSlot) ? 0.6 : 1
                }
              ]}
              disabled={!selectedDate || !selectedSlot || isBookingSlot}
              onPress={confirmSlotBooking}
            >
              {isBookingSlot ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render image gallery with improved rendering
  const renderImageGallery = () => (
    <View style={styles.imageGalleryContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Photo Gallery</Text>
      
      {isLoadingGallery ? (
        <View style={styles.loadingGallery}>
          <Text style={{ color: subTextColor }}>Loading gallery images...</Text>
        </View>
      ) : galleryImages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesContainer}
        >
          {galleryImages.map((image: any, index: number) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.galleryImageContainer, { marginBottom: 10, width: 200, height: 140, marginRight: 16 }]}
              onPress={() => {
                setFullScreenImage(image.uri);
                setIsFullScreenVisible(true);
              }}
            >
              <View style={{ width: 200, height: 140, position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                <Image 
                  source={{ uri: image.uri }}
                  style={{ width: '100%', height: '100%' }}
                  defaultSource={require('@/assets/images/react-logo.png')}
                  resizeMode="cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${image.uri}`);
                  }}
                  loadingIndicatorSource={require('@/assets/images/react-logo.png')}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noGalleryImages}>
          <Ionicons name="images-outline" size={40} color={isDark ? '#555555' : '#cccccc'} />
          <Text style={{ color: subTextColor, marginTop: 8 }}>No gallery images available</Text>
        </View>
      )}
    </View>
  );
    
  const renderFeatures = () => (
    <View style={styles.featuresContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Features</Text>
      <View style={styles.featuresList}>
        {mess.features.map((feature: string, index: number) => (
          <View key={index} style={[styles.featureItem, { backgroundColor: isDark ? '#333' : '#f0f2f5' }]}>
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={highlightColor} 
              style={styles.featureIcon} 
            />
            <Text style={[styles.featureText, { color: textColor }]}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  
  // Render weekly menu
  const renderMenu = () => {
    // Check if weeklyMenuData is empty
    const hasMenuData = weeklyMenuData && Object.keys(weeklyMenuData).length > 0;
    
    return (
    <View style={styles.menuContainer}>
      {isLoadingMenu ? (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#4f46e5'} />
          <Text style={{ color: subTextColor, marginTop: 10 }}>Loading menu...</Text>
        </View>
      ) : !hasMenuData ? (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Ionicons name="restaurant-outline" size={40} color={isDark ? '#555555' : '#cccccc'} />
          <Text style={{ color: subTextColor, marginBottom: 10, marginTop: 8 }}>No menu data available for this mess</Text>
          <Text style={{ color: subTextColor, textAlign: 'center', fontSize: 12 }}>
            The mess owner hasn't uploaded a menu yet. Check back later or contact them for details.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.daysContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContent}
            >
              {Object.keys(weeklyMenuData).map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayTab,
                    selectedDay === day && { borderBottomColor: highlightColor }
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: selectedDay === day ? highlightColor : subTextColor }
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.mealsContainer}>
            {Object.entries(weeklyMenuData).map(([day, meals]: [string, any]) => (
              selectedDay === day &&
              Object.entries(meals).map(([mealType, items]: [string, any]) => (
                <View 
                  key={`${day}-${mealType}`} 
                  style={[styles.mealCard, { backgroundColor: cardBg, borderColor }]}
                >
                  <View style={styles.mealHeader}>
                    <Text style={[styles.mealType, { color: textColor }]}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.mealItems, { color: subTextColor }]}>{items}</Text>
                </View>
              ))
            ))}
          </View>
        </>
      )}
    </View>
  )};
  
  // Render reviews
  const renderReviews = () => (
    <View style={styles.reviewsContainer}>
      <View style={styles.reviewsHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Customer Reviews</Text>
        <View style={styles.overallRating}>
          <Text style={[styles.ratingText, { color: textColor }]}>{mess.rating}</Text>
          <View style={styles.starsContainer}>{renderStars(mess.rating)}</View>
          <Text style={[styles.reviewCount, { color: subTextColor }]}>
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </Text>
        </View>
      </View>
      
      {isLoadingReviews ? (
        <View style={styles.loadingReviews}>
          <Text style={{ color: subTextColor }}>Loading reviews...</Text>
        </View>
      ) : reviewsError ? (
        <View style={styles.reviewError}>
          <Text style={{ color: subTextColor }}>{reviewsError}</Text>
        </View>
      ) : reviews.length > 0 ? (
        reviews.map((review) => (
          <View 
            key={review.id} 
            style={[styles.reviewCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.reviewHeader}>
              {review.profilePhoto ? (
                <Image 
                  source={{ uri: review.profilePhoto }}
                  style={styles.reviewerAvatar}
                  defaultSource={require('@/assets/images/react-logo.png')}
                  onError={() => console.log(`Failed to load profile image for ${review.userEmail}`)}
                />
              ) : (
                <View style={styles.reviewerAvatarContainer}>
                  <Text style={styles.reviewerInitial}>
                    {review.userName?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
              <View style={styles.reviewerInfo}>
                <Text style={[styles.reviewerName, { color: textColor }]}>
                  {review.userName || 'Anonymous User'}
                </Text>
                <View style={styles.reviewMeta}>
                  <View style={styles.starsContainer}>{renderStars(review.rating)}</View>
                  <Text style={[styles.reviewDate, { color: subTextColor }]}>
                    {review.createdAt || 'Recently'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.reviewComment, { color: subTextColor }]}>
              {review.feedbackText}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.noReviews}>
          <Ionicons name="chatbubble-ellipses-outline" size={40} color={isDark ? '#555555' : '#cccccc'} />
          <Text style={{ color: subTextColor, marginTop: 8 }}>No reviews yet</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.writeReviewButton, { backgroundColor: isDark ? '#333' : '#f0f2f5' }]}
        onPress={() => {
          router.push({
            pathname: '/screens/mess/submit-review',
            params: {
              messId: messId,
              messEmail: mess.email,
              messName: mess.name
            }
          });
        }}
      >
        <Ionicons name="create-outline" size={16} color={highlightColor} />
        <Text style={[styles.writeReviewText, { color: highlightColor }]}>Write a Review</Text>
      </TouchableOpacity>
    </View>
  );

  // Update header with profile image handling
  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header, 
        { 
          height: headerHeight,
          zIndex: 10 
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.headerBackground,
          { opacity: headerOpacity }
        ]}
      >
        <ImageBackground
          source={
            headerImageError ? 
              require('@/assets/images/react-logo.png') : 
              profileImageUrl ? 
                { uri: profileImageUrl } : 
                (mess.images && mess.images.length > 0 ? mess.images[0] : require('@/assets/images/react-logo.png'))
          }
          style={styles.headerImage}
          onError={() => {
            console.log('Header image error, falling back to default');
            setHeaderImageError(true);
          }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push('/(drawer)/(tabs)')}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-social" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
      
      {/* Collapsed Header Title */}
      <Animated.View 
        style={[
          styles.collapsedHeader,
          { 
            opacity: titleOpacity,
            backgroundColor: cardBg 
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.collapsedBackButton}
          onPress={() => router.push('/(drawer)/(tabs)')}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text 
          style={[styles.collapsedTitle, { color: textColor }]}
          numberOfLines={1}
        >
          {mess.name}
        </Text>
        <View style={{ width: 40 }} />
      </Animated.View>
    </Animated.View>
  );

  // Full screen image viewer component
  const getFullScreenImageViewer = () => {
    if (!isFullScreenVisible || !fullScreenImage) return null;
    
    return (
      <View style={styles.fullScreenContainer}>
        <TouchableOpacity 
          style={styles.fullScreenCloseButton}
          onPress={() => {
            setIsFullScreenVisible(false);
            setFullScreenImage(null);
          }}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        
        <Image 
          source={{ uri: fullScreenImage }}
          style={styles.fullScreenImage}
          defaultSource={require('@/assets/images/react-logo.png')}
          resizeMode="contain"
          onError={() => {
            console.error('Error loading full screen image');
            setIsFullScreenVisible(false);
          }}
        />
      </View>
    );
  };

  // Get user location when the screen loads
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Check location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        // Get user location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        setUserLocation(location);
        
        // Calculate distance to mess if mess location is available
        if (mess && mess.location && mess.location.latitude && mess.location.longitude) {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            mess.location.latitude,
            mess.location.longitude
          );
          
          // Format distance
          const formattedDistance = distance < 1 
            ? `${Math.round(distance * 1000)} m` 
            : `${distance.toFixed(1)} km`;
          
          setDistanceToMess(formattedDistance);
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    getUserLocation();
  }, [mess]);
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };
  
  // Convert degrees to radians
  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  // Toast notification component
  const renderToast = () => {
    if (!toastVisible) return null;
    
    const bgColor = toastType === 'success' 
      ? '#10b981' 
      : toastType === 'error' 
        ? '#ef4444' 
        : '#3b82f6';
    
    const icon = toastType === 'success' 
      ? 'checkmark-circle'
      : toastType === 'error'
        ? 'alert-circle' 
        : 'information-circle';
    
    return (
      <Animated.View 
        style={[
          styles.toastContainer, 
          { 
            opacity: toastOpacity,
            backgroundColor: bgColor
          }
        ]}
      >
        <Ionicons name={icon} size={20} color="white" />
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" />
      
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: textColor, marginBottom: 10 }}>Loading mess details...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={40} color={isDark ? '#a0a0a0' : '#666666'} />
          <Text style={{ color: textColor, marginTop: 10, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity 
            style={{ marginTop: 20, padding: 10, backgroundColor: highlightColor, borderRadius: 8 }}
            onPress={() => router.push('/(drawer)/(tabs)')}
          >
            <Text style={{ color: 'white' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {renderHeader()}
          
          {/* Content */}
          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            {/* Mess Info Card */}
            <View style={[styles.messInfoCard, { backgroundColor: cardBg, marginTop: HEADER_MAX_HEIGHT - 50 }]}>
              <View style={styles.messBasicInfo}>
                <View style={styles.messNameContainer}>
                  <Text style={[styles.messName, { color: textColor }]}>{mess.name}</Text>
                  <View style={styles.messTypeContainer}>
                    <View 
                      style={[
                        styles.messTypeIndicator, 
                        { backgroundColor: mess.vegetarian ? '#4CAF50' : '#FF5252' }
                      ]} 
                    />
                    <Text style={[styles.messType, { color: subTextColor }]}>
                      {mess.vegetarian ? 'Pure Veg' : 'Non-Veg Available'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.messDetailsRow}>
                  <View style={styles.messDetail}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.messDetailText, { color: textColor }]}>
                      {mess.rating} ({mess.reviews})
                    </Text>
                  </View>
                  <View style={styles.dotSeparator} />
                  <View style={styles.messDetail}>
                    <Ionicons name="location" size={16} color={isDark ? '#3b82f6' : '#4f46e5'} />
                    {isLoadingLocation ? (
                      <ActivityIndicator size="small" color={isDark ? '#3b82f6' : '#4f46e5'} style={{marginLeft: 5}} />
                    ) : distanceToMess ? (
                      <Text style={[styles.messDetailText, { color: textColor }]}>
                        {distanceToMess}
                      </Text>
                    ) : (
                      <Text style={[styles.messDetailText, { color: textColor }]}>
                        {mess.distance}
                      </Text>
                    )}
                  </View>
                  <View style={styles.dotSeparator} />
                  <View style={styles.messDetail}>
                    <Ionicons name="time" size={16} color={isDark ? '#f59e0b' : '#f59e0b'} />
                    <Text style={[styles.messDetailText, { color: textColor }]}>
                      Open
                    </Text>
                  </View>
                </View>
                
                <View style={styles.addressContainer}>
                  <Ionicons name="location-outline" size={16} color={subTextColor} style={styles.addressIcon} />
                  <Text style={[styles.addressText, { color: subTextColor }]}>
                    {mess.address}
                  </Text>
                </View>
                
                <Text style={[styles.description, { color: subTextColor }]}>
                  {mess.description}
                </Text>
                
                <View style={styles.priceContainer}>
                  <View>
                    <Text style={[styles.priceLabel, { color: subTextColor }]}>Monthly Subscription</Text>
                    <Text style={[styles.price, { color: textColor }]}>
                      {mess.price}
                    </Text>
                  </View>
                  {mess.pricePerMeal && (
                    <View>
                      <Text style={[styles.priceLabel, { color: subTextColor }]}>Price Per Meal</Text>
                      <Text style={[styles.price, { color: textColor }]}>
                        ₹{mess.pricePerMeal}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.contactContainer}>
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: isDark ? '#333' : '#f0f2f5' }]}
                    onPress={() => {
                      if (mess.contact) {
                        // Log the number we're trying to call for debugging
                        console.log(`Attempting to call mess owner at: ${mess.contact}`);
                        
                        // Clean up the phone number by removing non-digits
                        let phoneNumber = mess.contact.replace(/\D/g, '');
                        
                        // Check for Indian numbers - if it starts with country code, it's fine
                        // Otherwise if it's 10 digits, it's a valid Indian number without country code
                        // For full flexibility, accept numbers with at least 8 digits
                        if (phoneNumber.length >= 8) {
                          // For display purposes, format as +91 for Indian numbers if no country code
                          if (phoneNumber.length === 10 && !phoneNumber.startsWith('91')) {
                            console.log('Adding country code to 10-digit Indian number');
                            // Display formatted but call with original
                          }
                          
                          // Format properly for tel: URL scheme - use original contact
                          const telUrl = `tel:${mess.contact}`;
                          
                          // Attempt to open the phone app
                          Linking.canOpenURL(telUrl)
                            .then(supported => {
                              if (supported) {
                                return Linking.openURL(telUrl);
                              } else {
                                alert('Phone calls are not supported on this device');
                              }
                            })
                            .catch(err => {
                              console.error('Error making phone call:', err);
                              alert('Could not initiate phone call. Please try again later.');
                            });
                        } else {
                          console.log(`Invalid phone format: ${mess.contact} (cleaned to ${phoneNumber})`);
                          alert('The contact number format appears to be invalid. Please try contacting the mess through email.');
                        }
                      } else {
                        alert('No contact number available for this mess');
                      }
                    }}
                  >
                    <Ionicons name="call" size={18} color={highlightColor} />
                    <Text style={[styles.contactButtonText, { color: highlightColor }]}>Call</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: isDark ? '#333' : '#f0f2f5' }]}
                    onPress={() => {
                      if (mess.email) {
                        Linking.openURL(`mailto:${mess.email}`);
                      }
                    }}
                  >
                    <Ionicons name="mail" size={18} color={highlightColor} />
                    <Text style={[styles.contactButtonText, { color: highlightColor }]}>Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.contactButton, { backgroundColor: isDark ? '#333' : '#f0f2f5' }]}
                    onPress={() => {
                      if (mess.location && mess.location.latitude && mess.location.longitude) {
                        // Get destination coordinates
                        const { latitude, longitude } = mess.location;
                        const label = encodeURIComponent(mess.name);
                        
                        // Handle navigation based on platform
                        if (Platform.OS === 'ios') {
                          // iOS: Try Google Maps first, then Apple Maps
                          const appleMapsUrl = `maps:?q=${label}&ll=${latitude},${longitude}`;
                          
                          // Check if Google Maps is installed
                          Linking.canOpenURL('comgooglemaps://').then((supported) => {
                            if (supported) {
                              // Google Maps is installed, use it
                              const googleMapsUrl = `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=15&daddr=${latitude},${longitude}&dirflg=d`;
                              Linking.openURL(googleMapsUrl).catch(err => {
                                console.error('An error occurred opening Google Maps:', err);
                                // Fallback to Apple Maps if Google Maps fails
                                alert('Could not open Google Maps. Falling back to default maps app.');
                                Linking.openURL(appleMapsUrl).catch(mapErr => {
                                  console.error('An error occurred opening Apple Maps:', mapErr);
                                  alert('Could not open maps. Please make sure you have a maps app installed.');
                                });
                              });
                            } else {
                              // Google Maps not installed, use Apple Maps
                              Linking.openURL(appleMapsUrl).catch(err => {
                                console.error('An error occurred opening Apple Maps:', err);
                                alert('Could not open maps. Please make sure you have a maps app installed.');
                              });
                            }
                          }).catch(err => {
                            // Error checking for Google Maps, fallback to Apple Maps
                            console.error('Error checking for Google Maps:', err);
                            Linking.openURL(appleMapsUrl).catch(mapErr => {
                              console.error('An error occurred opening Apple Maps:', mapErr);
                              alert('Could not open maps. Please make sure you have a maps app installed.');
                            });
                          });
                        } else {
                          // Android: Try native navigation intent first, then web
                          const googleNavUrl = `google.navigation:q=${latitude},${longitude}`;
                          const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                          
                          Linking.canOpenURL(googleNavUrl).then(supported => {
                            if (supported) {
                              // Native Google Maps navigation is available
                              Linking.openURL(googleNavUrl).catch(err => {
                                console.error('An error occurred opening navigation:', err);
                                // Fallback to web if native fails
                                openWebMaps(webMapsUrl);
                              });
                            } else {
                              // No native support, use web URL
                              openWebMaps(webMapsUrl);
                            }
                          }).catch(err => {
                            // Error checking URL support, try web as last resort
                            console.error('An error occurred checking URL support:', err);
                            openWebMaps(webMapsUrl);
                          });
                          
                          // Helper function for opening web maps
                          function openWebMaps(url: string) {
                            Linking.openURL(url).catch(webErr => {
                              console.error('An error occurred opening web maps:', webErr);
                              alert('Could not open maps. Please make sure you have a browser installed.');
                            });
                          }
                        }
                      } else {
                        alert('Location coordinates not available for this mess');
                      }
                    }}
                  >
                    <Ionicons name="navigate" size={18} color={highlightColor} />
                    <Text style={[styles.contactButtonText, { color: highlightColor }]}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Content Tabs */}
            <View style={styles.contentTabs}>
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'menu' && { 
                    borderBottomColor: highlightColor,
                    borderBottomWidth: 2,
                  }
                ]}
                onPress={() => setActiveTab('menu')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'menu' ? highlightColor : subTextColor }
                  ]}
                >
                  Weekly Menu
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'photos' && { 
                    borderBottomColor: highlightColor,
                    borderBottomWidth: 2,
                  }
                ]}
                onPress={() => setActiveTab('photos')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'photos' ? highlightColor : subTextColor }
                  ]}
                >
                  Photos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'reviews' && { 
                    borderBottomColor: highlightColor,
                    borderBottomWidth: 2,
                  }
                ]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    { color: activeTab === 'reviews' ? highlightColor : subTextColor }
                  ]}
                >
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Tab Content */}
            <View style={styles.tabContent}>
              {activeTab === 'menu' && renderMenu()}
              {activeTab === 'photos' && renderImageGallery()}
              {activeTab === 'reviews' && renderReviews()}
            </View>
            
            {/* Features */}
            {renderFeatures()}
            
            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </Animated.ScrollView>
          
          {/* Booking Button */}
          <View style={[styles.bookingContainer, { backgroundColor: cardBg }]}>
                <View style={styles.bookingButtonsRow}>
                  <LinearGradient
                    colors={isDark ? ['#4f46e5', '#3b82f6'] : ['#3b82f6', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bookButton, { flex: 1, marginRight: 8 }]}
                  >
                    <TouchableOpacity
                      style={styles.bookButtonTouch}
                      onPress={handleBooking}
                    >
                      <Text style={styles.bookButtonText}>Join Mess</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                  </LinearGradient>
                  
                  <LinearGradient
                    colors={isDark ? ['#10b981', '#059669'] : ['#059669', '#10b981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.bookButton, { flex: 1, marginLeft: 8 }]}
                  >
                    <TouchableOpacity
                      style={styles.bookButtonTouch}
                      onPress={handleBookSlot}
                    >
                      <Text style={styles.bookButtonText}>Book Slot</Text>
                      <Ionicons name="calendar" size={20} color="white" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
          </View>
          
          {/* Full screen image viewer */}
          {getFullScreenImageViewer()}
          
          {/* Book Slot Modal */}
          {renderBookSlotModal()}
          
          {/* Toast notification */}
          {renderToast()}
        </>
      )}
    </SafeAreaView>
  );
} 