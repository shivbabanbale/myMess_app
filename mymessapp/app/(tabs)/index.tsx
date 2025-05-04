import React, { useState, ReactElement, useRef, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  SafeAreaView,
  StatusBar,
  ColorSchemeName,
  Modal,
  TouchableWithoutFeedback,
  Switch,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Temporarily remove MapView import to fix the error
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

// Type for mess data
interface MessData {
  id: string;
  name: string;
  image: any;
  rating: number;
  reviews: number;
  price: string;
  distance: string;
  vegetarian: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  email: string;
}

// Initialize empty arrays
const nearbyMesses: MessData[] = [];
const budgetMesses: MessData[] = [];

// Mock data for nearby messes
const nearbyMessesMock = [
  {
    id: '1',
    name: 'Green Garden Mess',
    image: require('@/assets/images/react-logo.png'), // Replace with actual mess images
    rating: 4.8,
    reviews: 243,
    price: '₹3,500/month',
    distance: '0.8 km',
    vegetarian: true,
    location: {
      latitude: 12.9352,
      longitude: 77.6245
    },
    email: ''
  },
  {
    id: '2',
    name: 'Blue Star Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.5,
    reviews: 187,
    price: '₹3,200/month',
    distance: '1.2 km',
    vegetarian: false,
    location: {
      latitude: 12.9392,
      longitude: 77.6298
    },
    email: ''
  },
  {
    id: '3',
    name: 'Royal Dining Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.7,
    reviews: 321,
    price: '₹4,000/month',
    distance: '1.5 km',
    vegetarian: false,
    location: {
      latitude: 12.9316,
      longitude: 77.6310
    },
    email: ''
  },
];

// Mock data for budget-friendly messes
const budgetMessesMock = [
  {
    id: '4',
    name: 'Economy Food Hub',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.3,
    reviews: 156,
    price: '₹2,800/month',
    distance: '2.1 km',
    vegetarian: true,
    location: {
      latitude: 12.9252,
      longitude: 77.6345
    },
    email: ''
  },
  {
    id: '5',
    name: 'Student Special Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.2,
    reviews: 94,
    price: '₹2,500/month',
    distance: '1.9 km',
    vegetarian: false,
    location: {
      latitude: 12.9410,
      longitude: 77.6198
    },
    email: ''
  },
  {
    id: '6',
    name: 'Value Meals',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.0,
    reviews: 112,
    price: '₹2,700/month',
    distance: '2.5 km',
    vegetarian: true,
    location: {
      latitude: 12.9270,
      longitude: 77.6180
    },
    email: ''
  },
];

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Mess Card Component
interface MessCardProps {
  item: MessData;
  colorScheme: ColorSchemeName;
  isSearchResult?: boolean;
}

const MessCard: React.FC<MessCardProps> = ({ item, colorScheme, isSearchResult = false }) => {
  const isDark = colorScheme === 'dark';
  const cardBackground = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryTextColor = isDark ? '#a0a0a0' : '#666666';
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const handlePress = () => {
    // Navigate to mess details screen with the mess ID
    router.push({
      pathname: '/mess/mess-details',
      params: { 
        id: item.id,
        email: item.email 
      }
    });
  };
  
  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  // Extract subscription information from price
  const subscriptionPlan = item.price.includes('/month') ? item.price : ''; 
  
  return (
    <TouchableOpacity 
      style={[
        styles.messCard, 
        { backgroundColor: cardBackground },
        isSearchResult && styles.searchResultCard
      ]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        {isImageLoading && (
          <View style={styles.loadingImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color={isDark ? '#555555' : '#cccccc'} />
          </View>
        )}
        <Image 
          source={imageError ? require('@/assets/images/react-logo.png') : item.image} 
          style={styles.messImage}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </View>
      
      <View style={styles.vegBadge}>
        <View style={[styles.vegIndicator, { backgroundColor: item.vegetarian ? '#4CAF50' : '#FF5252' }]} />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.messName, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.ratingText, { color: textColor }]}>{item.rating}</Text>
          <Text style={styles.reviewText}>({item.reviews} reviews)</Text>
        </View>

        {subscriptionPlan && (
          <View style={[styles.subscriptionPlanContainer, { backgroundColor: isDark ? '#1a365d' : '#ebf5ff' }]}>
            <Ionicons name="calendar-outline" size={12} color={isDark ? '#63b3ed' : '#3b82f6'} />
            <Text style={[styles.subscriptionPlanText, { color: isDark ? '#63b3ed' : '#3b82f6' }]}>
              {subscriptionPlan}
            </Text>
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <View style={[
            styles.distanceContainer, 
            { backgroundColor: isDark ? '#1a365d' : '#f0f8ff' }
          ]}>
            <Ionicons 
              name="location" 
              size={14} 
              color={isDark ? '#63b3ed' : '#3b82f6'} 
            />
            <Text style={[
              styles.distanceText, 
              { color: isDark ? '#63b3ed' : '#3b82f6' }
            ]}>
              {item.distance}
            </Text>
          </View>
          
          <Text style={[styles.priceText, { color: secondaryTextColor }]}>
            {item.price.includes('/meal') ? item.price : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Map Placeholder Component
interface MapComponentProps {
  colorScheme: ColorSchemeName;
  messes: Array<MessData>;
}

const MapComponent: React.FC<MapComponentProps> = ({ colorScheme, messes }) => {
  const isDark = colorScheme === 'dark';
  const mapBgColor = isDark ? '#2d2d2d' : '#e0e0e0';
  
  // Create a simple map display with mess pins
  return (
    <View style={[styles.mapContainer, { backgroundColor: mapBgColor }]}>
      <View style={styles.mapContent}>
        <Ionicons name="map" size={50} color={isDark ? '#555555' : '#bbbbbb'} />
        <View style={styles.mapPinsContainer}>
          {messes.map((mess) => (
            <View key={mess.id} style={styles.mapPin}>
              <View style={[styles.pinIndicator, { backgroundColor: mess.vegetarian ? '#4CAF50' : '#FF5252' }]} />
              <Text style={{ color: isDark ? '#ffffff' : '#333333', fontSize: 12 }}>{mess.name}</Text>
            </View>
          ))}   
        </View>
      </View>
    </View>
  );
};

// Extract price value from price string
const extractPrice = (priceString: string): number => {
  // Try to match any number in the string
  const priceMatch = priceString.match(/₹(\d+(?:,\d+)*)/);
  if (priceMatch) {
    // Remove commas and convert to number
    return parseInt(priceMatch[1].replace(/,/g, ''));
  }
  
  // Fallback: try to extract any numbers as a last resort
  const anyNumberMatch = priceString.match(/\d+/);
  if (anyNumberMatch) {
    return parseInt(anyNumberMatch[0]);
  }
  
  return 3000; // Default price if no price found
};

export default function HomeScreen({ CustomMenuButton }: { CustomMenuButton?: ReactElement }) {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [priceFilters, setPriceFilters] = useState({
    under3000: false,
    under3500: false,
    under4000: false,
    above4000: false,
    vegetarianOnly: false
  });
  const [appliedFilters, setAppliedFilters] = useState(0);
  // State for newly added messes
  const [newlyAddedMesses, setNewlyAddedMesses] = useState<MessData[]>([]);
  const [isLoadingMesses, setIsLoadingMesses] = useState(true);
  const [messLoadError, setMessLoadError] = useState<string | null>(null);
  
  // Location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyMesses, setNearbyMesses] = useState<MessData[]>([]);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  
  const modalAnimation = useRef(new Animated.Value(0)).current;
  
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const inputBgColor = isDark ? '#2a2a2a' : '#f3f4f6';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const sectionBgColor = isDark ? '#1a1a1a' : '#ffffff';
  const modalBgColor = isDark ? '#1e1e1e' : '#ffffff';
  
  // Add state for unread notification count
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  
  // Request location permission
  useEffect(() => {
    const getLocationPermission = async () => {
      setIsLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status === 'granted') {
          await getLocation();
        } else {
          setLocationErrorMessage('Permission to access location was denied');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setLocationErrorMessage('Error requesting location permission');
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    getLocationPermission();
  }, []);
  
  // Get current location
  const getLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      
      // Fetch nearby messes with the location
      fetchNearbyMesses(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationErrorMessage('Unable to determine your location');
    }
  };
  
  // Fetch nearby messes from backend
  const fetchNearbyMesses = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `http://localhost:8080/mess/getNearby?latitude=${latitude}&longitude=${longitude}&radius=10.0`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nearby messes: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format for nearby messes:', data);
        return;
      }
      
      // Transform the data to match our mess card format
      const formattedData = await Promise.all(data.map(async (mess: any) => {
        // Get profile picture using email instead of imageName
        let imageUrl;
        
        if (mess.email) {
          try {
            // Fetch profile image using email endpoint
            const profileResponse = await fetch(`http://localhost:8080/mess/profile/${mess.email}`);
            if (profileResponse.ok) {
              imageUrl = `http://localhost:8080/mess/profile/${mess.email}`;
            } else {
              // Fallback to image name if available
              imageUrl = mess.imageName ? 
                `http://localhost:8080/mess/images/${mess.imageName}` : null;
            }
          } catch (error) {
            console.error(`Error fetching profile for ${mess.email}:`, error);
            // Use imageName as fallback
            imageUrl = mess.imageName ? 
              `http://localhost:8080/mess/images/${mess.imageName}` : null;
          }
        } else {
          // Fallback to imageName if no email
          imageUrl = mess.imageName ? 
            `http://localhost:8080/mess/images/${mess.imageName}` : null;
        }
        
        // Format distance nicely
        let distance = mess.distance !== undefined ? mess.distance : null;
          
        return {
          id: mess.id?.toString() || Math.random().toString(),
          name: mess.messName || 'New Mess',
          image: imageUrl ? { uri: imageUrl } : require('@/assets/images/react-logo.png'),
          rating: parseFloat(mess.averageRating || '4.0'),
          reviews: parseInt(mess.feedbackCount || '0'),
          price: mess.pricePerMeal ? `₹${mess.pricePerMeal}/meal` : `₹${mess.subscriptionPlan || 3000}/month`,
          distance: formatDistance(distance),
          vegetarian: mess.messType === 'Veg',
          location: {
            latitude: parseFloat(mess.latitude || '12.9352'),
            longitude: parseFloat(mess.longitude || '77.6245')
          },
          email: mess.email || ''
        };
      }));
      
      // Split messes into nearby and budget based on price
      // Clear existing arrays
      nearbyMesses.length = 0;
      budgetMesses.length = 0;
      
      // Fill arrays with data
      formattedData.forEach(mess => {
        // Extract numeric price value
        const price = extractPrice(mess.price);
        
        // Low price messes (under 3000) go to budget friendly
        if (price < 3000) {
          budgetMesses.push(mess);
        } else {
          nearbyMesses.push(mess);
        }
      });
      
      setNearbyMesses([...nearbyMesses]);
    } catch (error) {
      console.error('Error fetching nearby messes:', error);
    }
  };
  
  // Fetch newly added messes from backend
  useEffect(() => {
    const fetchNewlyAddedMesses = async () => {
      try {
        setIsLoadingMesses(true);
        setMessLoadError(null);
        console.log('Fetching newly added messes...');
        
        // Add a timeout to prevent infinite loading if there's network issues
        const timeoutId = setTimeout(() => {
          if (isLoadingMesses) {
            setMessLoadError('Request timed out. Please check your connection.');
            setIsLoadingMesses(false);
          }
        }, 10000);
        
        const response = await fetch('http://localhost:8080/mess/getAll');
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!Array.isArray(data)) {
          console.error('Invalid data format, expected an array:', data);
          setMessLoadError('Invalid data format received from server');
          return;
        }
        
        // Transform the data to match our mess card format
        const formattedData = await Promise.all(data.map(async (mess: any) => {
          // Get profile picture using email instead of imageName
          let imageUrl;
          
          if (mess.email) {
            try {
              // Fetch profile image using email endpoint
              const profileResponse = await fetch(`http://localhost:8080/mess/profile/${mess.email}`);
              if (profileResponse.ok) {
                imageUrl = `http://localhost:8080/mess/profile/${mess.email}`;
              } else {
                // Fallback to image name if available
                imageUrl = mess.imageName ? 
                  `http://localhost:8080/mess/images/${mess.imageName}` : null;
              }
            } catch (error) {
              console.error(`Error fetching profile for ${mess.email}:`, error);
              // Use imageName as fallback
              imageUrl = mess.imageName ? 
                `http://localhost:8080/mess/images/${mess.imageName}` : null;
            }
          } else {
            // Fallback to imageName if no email
            imageUrl = mess.imageName ? 
              `http://localhost:8080/mess/images/${mess.imageName}` : null;
          }
            
          // Calculate distance if user location is available
          let distance = null;
          if (location?.coords) {
            const messLat = parseFloat(mess.latitude) || 0;
            const messLng = parseFloat(mess.longitude) || 0;
            
            // Only calculate if mess has valid coordinates
            if (messLat !== 0 && messLng !== 0) {
              distance = calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                messLat,
                messLng
              );
            }
          }
          
          return {
            id: mess.id?.toString() || Math.random().toString(),
            name: mess.messName || 'New Mess',
            image: imageUrl ? { uri: imageUrl } : require('@/assets/images/react-logo.png'),
            rating: parseFloat(mess.averageRating || '4.0'),
            reviews: parseInt(mess.feedbackCount || '0'),
            price: mess.pricePerMeal ? `₹${mess.pricePerMeal}/meal` : `₹${mess.subscriptionPlan || 3000}/month`,
            distance: formatDistance(distance),
            vegetarian: mess.messType === 'Veg',
            location: {
              latitude: parseFloat(mess.latitude || '12.9352'),
              longitude: parseFloat(mess.longitude || '77.6245')
            },
            // Add email for easy reference
            email: mess.email || ''
          };
        }));
        
        // Sort by newest first (assuming higher IDs are more recent)
        const sortedData = formattedData.sort((a, b) => {
          const idA = a.id || '0';
          const idB = b.id || '0';
          return idB.localeCompare(idA); // For MongoDB ObjectID strings
        });
        
        // Take the first 5 items for newly added messes
        setNewlyAddedMesses(sortedData.slice(0, 5));
        
        // If nearbyMesses is empty (location not available), populate it from this data
        if (nearbyMesses.length === 0) {
          // Split remaining messes into nearby and budget based on price
          sortedData.forEach(mess => {
            // Extract numeric price value
            const price = extractPrice(mess.price);
            
            // Low price messes (under 3000) go to budget friendly
            if (price < 3000) {
              // Only add if not already in budget messes
              if (!budgetMesses.some(m => m.id === mess.id)) {
                budgetMesses.push(mess);
              }
            } else {
              // Only add if not already in nearby messes
              if (!nearbyMesses.some(m => m.id === mess.id)) {
                nearbyMesses.push(mess);
              }
            }
          });
          
          // Update state with a new array to trigger re-render
          setNearbyMesses([...nearbyMesses]);
        }
        
      } catch (error) {
        console.error('Error fetching newly added messes:', error);
        setMessLoadError('Error loading mess data. Please try again.');
        setNewlyAddedMesses([]);
      } finally {
        setIsLoadingMesses(false);
      }
    };
    
    fetchNewlyAddedMesses();
  }, []);
  
  // Combine all mess data for search
  const allMesses = [...nearbyMesses, ...budgetMesses, ...newlyAddedMesses];
  
  // Filter messes based on search query and price filters
  const filteredMesses = useMemo(() => {
    return allMesses.filter(mess => {
      // Search query filter - case insensitive
      const searchTerms = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery.length === 0 || 
        mess.name.toLowerCase().includes(searchTerms) ||
        mess.price.toLowerCase().includes(searchTerms) ||
        (mess.vegetarian ? 'veg' : 'non-veg').includes(searchTerms);
      
      // Price filters
      let matchesPrice = true;
      if (appliedFilters > 0) {
        // Extract numeric price value
        const price = extractPrice(mess.price);
        
        // Price range filters
        if (priceFilters.under3000 && price >= 3000) matchesPrice = false;
        else if (priceFilters.under3500 && price >= 3500) matchesPrice = false;
        else if (priceFilters.under4000 && price >= 4000) matchesPrice = false;
        else if (priceFilters.above4000 && price <= 4000) matchesPrice = false;
        
        // Food type filter
        if (priceFilters.vegetarianOnly && !mess.vegetarian) matchesPrice = false;
      }
      
      return matchesSearch && matchesPrice;
    });
  }, [allMesses, searchQuery, priceFilters, appliedFilters]);
  
  // Calculate filter counts for UI feedback
  const filterCounts = useMemo(() => {
    return {
      under3000: allMesses.filter(mess => extractPrice(mess.price) < 3000).length,
      under3500: allMesses.filter(mess => extractPrice(mess.price) < 3500).length,
      under4000: allMesses.filter(mess => extractPrice(mess.price) < 4000).length,
      above4000: allMesses.filter(mess => extractPrice(mess.price) > 4000).length,
      vegetarianOnly: allMesses.filter(mess => mess.vegetarian).length
    };
  }, [allMesses]);
  
  const openDrawer = () => {
    try {
      // Use router to navigate to drawer explicitly
      router.push('/(drawer)/(tabs)' as any);
    } catch (e) {
      console.log('Drawer navigation error:', e);
    }
  };
  
  const navigateToNotifications = () => {
    // Navigate to the notifications screen in the drawer directory
    try {
      router.push('/(drawer)/notifications');
    } catch (e) {
      console.log('Navigation error:', e);
    }
  };
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setIsSearchActive(text.length > 0);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };
  
  const toggleFilterModal = () => {
    if (!filterModalVisible) {
      setFilterModalVisible(true);
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setFilterModalVisible(false);
      });
    }
  };
  
  const applyFilters = () => {
    // Count applied filters
    const count = Object.values(priceFilters).filter(Boolean).length;
    setAppliedFilters(count);
    
    // If there's a search query active, ensure we stay in search mode
    if (searchQuery.length > 0) {
      setIsSearchActive(true);
    }
    
    toggleFilterModal();
  };
  
  const resetFilters = () => {
    setPriceFilters({
      under3000: false,
      under3500: false,
      under4000: false,
      above4000: false,
      vegetarianOnly: false
    });
    setAppliedFilters(0);
  };
  
  // Make filter options mutually exclusive for price ranges
  const toggleFilter = (key: keyof typeof priceFilters) => {
    setPriceFilters(prev => {
      const newFilters = { ...prev };
      
      // If this is a price range filter, clear other price filters
      if (key !== 'vegetarianOnly') {
        // These are the price range keys
        const priceRangeKeys = ['under3000', 'under3500', 'under4000', 'above4000'];
        
        // Clear all price range filters
        priceRangeKeys.forEach(k => {
          newFilters[k as keyof typeof priceFilters] = false;
        });
      }
      
      // Toggle the selected filter
      newFilters[key] = !prev[key];
      
      return newFilters;
    });
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };
  
  // Function to format distance for display
  const formatDistance = (distance: number | null): string => {
    if (distance === null || distance === undefined) return 'New';
    
    // Format distances under 1km in meters
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
      // For distances less than 10km, show one decimal place
      return `${distance.toFixed(1)}km away`;
    } else {
      // For longer distances, round to nearest km
      return `${Math.round(distance)}km away`;
    }
  };

  // Add useEffect to load user data and fetch notification count
  useEffect(() => {
    loadUserData();
  }, []);
  
  // Load user data from AsyncStorage
  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserEmail(email);
        fetchUnreadNotificationCount(email);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  // Fetch unread notification count
  const fetchUnreadNotificationCount = async (email: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/user/${email}/unread/count`);
      if (response.data !== undefined) {
        setUnreadNotificationCount(response.data);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Generate filter display names for the active filters
  const getActiveFilterNames = () => {
    const activeFilters = [];
    
    if (priceFilters.under3000) activeFilters.push('Under ₹3,000');
    if (priceFilters.under3500) activeFilters.push('Under ₹3,500');
    if (priceFilters.under4000) activeFilters.push('Under ₹4,000');
    if (priceFilters.above4000) activeFilters.push('Above ₹4,000');
    if (priceFilters.vegetarianOnly) activeFilters.push('Vegetarian');
    
    return activeFilters;
  };
  
  // Clear a specific filter by name
  const clearSpecificFilter = (filterName: string) => {
    setPriceFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterName === 'Under ₹3,000') newFilters.under3000 = false;
      if (filterName === 'Under ₹3,500') newFilters.under3500 = false;
      if (filterName === 'Under ₹4,000') newFilters.under4000 = false;
      if (filterName === 'Above ₹4,000') newFilters.above4000 = false;
      if (filterName === 'Vegetarian') newFilters.vegetarianOnly = false;
      
      // Count remaining filters
      const remainingCount = Object.values(newFilters).filter(Boolean).length;
      setAppliedFilters(remainingCount);
      
      return newFilters;
    });
  };

  // Reset search and filters
  const resetAll = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    resetFilters();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        {CustomMenuButton ? (
          CustomMenuButton
        ) : (
          <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={28} color={textColor} />
          </TouchableOpacity>
        )}
        
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={isDark 
              ? ['#4f46e5', '#3b82f6'] 
              : ['#3b82f6', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoBackground}
          >
            <Text style={styles.logoText}>myMess</Text>
          </LinearGradient>
        </View>
        
        <TouchableOpacity style={styles.iconButton} onPress={navigateToNotifications}>
          <Ionicons name="notifications-outline" size={28} color={textColor} />
          {unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{unreadNotificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: inputBgColor, borderColor }]}>
          <Ionicons name="search" size={20} color={isDark ? '#777777' : '#999999'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search for mess..."
            placeholderTextColor={isDark ? '#777777' : '#999999'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#777777' : '#999999'} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: inputBgColor },
            appliedFilters > 0 && styles.activeFilterButton
          ]}
          onPress={toggleFilterModal}
        >
          <Ionicons name="options-outline" size={22} color={appliedFilters > 0 ? "#ffffff" : textColor} />
          {appliedFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{appliedFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleFilterModal}
      >
        <TouchableWithoutFeedback onPress={toggleFilterModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.modalContent, 
                  { 
                    backgroundColor: modalBgColor,
                    transform: [{
                      translateY: modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Filter Options</Text>
                  <TouchableOpacity onPress={toggleFilterModal}>
                    <Ionicons name="close" size={24} color={textColor} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: textColor }]}>Price Range</Text>
                  
                  <TouchableOpacity 
                    style={[styles.filterOption, priceFilters.under3000 && styles.activeFilterOption]} 
                    onPress={() => toggleFilter('under3000')}
                  >
                    <View style={styles.filterOptionTextContainer}>
                      <Text style={[styles.filterOptionText, { color: textColor }]}>Under ₹3,000</Text>
                      <Text style={styles.filterCountText}>({filterCounts.under3000})</Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      priceFilters.under3000 && styles.checkboxChecked
                    ]}>
                      {priceFilters.under3000 && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.filterOption, priceFilters.under3500 && styles.activeFilterOption]} 
                    onPress={() => toggleFilter('under3500')}
                  >
                    <View style={styles.filterOptionTextContainer}>
                      <Text style={[styles.filterOptionText, { color: textColor }]}>Under ₹3,500</Text>
                      <Text style={styles.filterCountText}>({filterCounts.under3500})</Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      priceFilters.under3500 && styles.checkboxChecked
                    ]}>
                      {priceFilters.under3500 && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.filterOption, priceFilters.under4000 && styles.activeFilterOption]} 
                    onPress={() => toggleFilter('under4000')}
                  >
                    <View style={styles.filterOptionTextContainer}>
                      <Text style={[styles.filterOptionText, { color: textColor }]}>Under ₹4,000</Text>
                      <Text style={styles.filterCountText}>({filterCounts.under4000})</Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      priceFilters.under4000 && styles.checkboxChecked
                    ]}>
                      {priceFilters.under4000 && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.filterOption, priceFilters.above4000 && styles.activeFilterOption]} 
                    onPress={() => toggleFilter('above4000')}
                  >
                    <View style={styles.filterOptionTextContainer}>
                      <Text style={[styles.filterOptionText, { color: textColor }]}>Above ₹4,000</Text>
                      <Text style={styles.filterCountText}>({filterCounts.above4000})</Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      priceFilters.above4000 && styles.checkboxChecked
                    ]}>
                      {priceFilters.above4000 && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: textColor }]}>Food Type</Text>
                  
                  <TouchableOpacity 
                    style={[styles.filterOption, priceFilters.vegetarianOnly && styles.activeFilterOption]} 
                    onPress={() => toggleFilter('vegetarianOnly')}
                  >
                    <View style={styles.filterOptionTextContainer}>
                      <Text style={[styles.filterOptionText, { color: textColor }]}>Vegetarian Only</Text>
                      <Text style={styles.filterCountText}>({filterCounts.vegetarianOnly})</Text>
                    </View>
                    <View style={[
                      styles.checkbox, 
                      priceFilters.vegetarianOnly && styles.checkboxChecked
                    ]}>
                      {priceFilters.vegetarianOnly && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[styles.footerButton, styles.resetButton]} 
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.footerButton, styles.applyButton]} 
                    onPress={applyFilters}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Search results or Main content */}
      {(isSearchActive || appliedFilters > 0) ? (
        <View style={styles.searchResultsContainer}>
          <View style={styles.searchResultsHeader}>
            <Text style={[styles.searchResultsTitle, {color: textColor}]}>
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Filtered Results'}
              {filteredMesses.length > 0 && <Text style={{fontSize: 14, color: isDark ? '#a0a0a0' : '#666666'}}> ({filteredMesses.length})</Text>}
            </Text>
            
            <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={resetAll}
            >
              <Ionicons name="arrow-back" size={16} color={isDark ? '#a0a0a0' : '#666666'} />
              <Text style={[styles.backToHomeText, {color: isDark ? '#a0a0a0' : '#666666'}]}>Back</Text>
            </TouchableOpacity>
          </View>
          
          {/* Active Filters Display */}
          {appliedFilters > 0 && (
            <View style={styles.activeFiltersContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeFiltersScrollContent}
              >
                {getActiveFilterNames().map((filterName, index) => (
                  <View key={index} style={styles.activeFilterTag}>
                    <Text style={styles.activeFilterText}>{filterName}</Text>
                    <TouchableOpacity 
                      onPress={() => clearSpecificFilter(filterName)}
                      style={styles.clearFilterButton}
                    >
                      <Ionicons name="close-circle" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={styles.clearAllFiltersButton}
                  onPress={resetFilters}
                >
                  <Text style={styles.clearAllFiltersText}>Clear All</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
          
          {filteredMesses.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={50} color={isDark ? '#555555' : '#cccccc'} />
              <Text style={[styles.noResultsText, {color: textColor}]}>
                {searchQuery ? `No messes found matching "${searchQuery}"` : 'No messes match the selected filters'}
              </Text>
              {appliedFilters > 0 && (
                <TouchableOpacity 
                  style={styles.resetFiltersButton} 
                  onPress={resetFilters}
                >
                  <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.searchResultsScroll}
            >
              {filteredMesses.map((mess) => (
                <MessCard 
                  key={mess.id} 
                  item={mess} 
                  colorScheme={colorScheme} 
                  isSearchResult={true}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Location Status */}
          {locationErrorMessage && (
            <TouchableOpacity 
              style={[styles.locationMessageContainer, { backgroundColor: isDark ? '#2d2d2d' : '#ffe8e8' }]}
              onPress={getLocation}
            >
              <Ionicons name="location-outline" size={20} color={isDark ? '#ff9999' : '#ff5252'} />
              <Text style={[styles.locationErrorText, { color: isDark ? '#ff9999' : '#ff5252' }]}>
                {locationErrorMessage}. Tap to retry.
              </Text>
            </TouchableOpacity>
          )}
          
          {isLoadingLocation && (
            <View style={[styles.locationMessageContainer, { backgroundColor: isDark ? '#2d2d2d' : '#e8e8ff' }]}>
              <Ionicons name="location-outline" size={20} color={isDark ? '#9999ff' : '#5252ff'} />
              <Text style={[styles.locationStatusText, { color: isDark ? '#9999ff' : '#5252ff' }]}>
                Getting your location...
              </Text>
            </View>
          )}
          
          {/* Nearby Messes Section */}
          {nearbyMesses.length > 0 && (
            <View style={styles.messSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {color: textColor}]}>
                  Nearby Messes
                </Text>
                <TouchableOpacity onPress={() => console.log('Show all nearby')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.messCardsContainer}
              >
                {nearbyMesses.map((mess) => {
                  // Calculate distance if location is available
                  let updatedMess = {...mess};
                  if (location?.coords && mess.location) {
                    const distance = calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      mess.location.latitude,
                      mess.location.longitude
                    );
                    updatedMess.distance = formatDistance(distance);
                  }
                  return (
                    <MessCard key={mess.id} item={updatedMess} colorScheme={colorScheme} />
                  );
                })}
              </ScrollView>
            </View>
          )}
          
          {/* Newly Added Messes */}
          <View style={styles.messSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: textColor}]}>
                Newly Added Messes
              </Text>
              <TouchableOpacity onPress={() => console.log('Show all new')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {isLoadingMesses ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, {color: textColor}]}>Loading messes...</Text>
              </View>
            ) : messLoadError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, {color: textColor}]}>{messLoadError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => {/* Add retry function here */}}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              newlyAddedMesses.length === 0 ? (
                <View style={styles.noMessesContainer}>
                  <Text style={[styles.noMessesText, {color: textColor}]}>
                    No newly added messes available
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.messCardsContainer}
                >
                  {newlyAddedMesses.map((mess) => (
                    <MessCard key={mess.id} item={mess} colorScheme={colorScheme} />
                  ))}
                </ScrollView>
              )
            )}
          </View>
          
          {/* Budget-Friendly Messes */}
          {budgetMesses.length > 0 && (
            <View style={styles.messSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {color: textColor}]}>
                  Budget-Friendly
                </Text>
                <TouchableOpacity onPress={() => console.log('Show all budget-friendly')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.messCardsContainer}
              >
                {budgetMesses.map((mess) => {
                  // Calculate distance if location is available
                  let updatedMess = {...mess};
                  if (location?.coords && mess.location) {
                    const distance = calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      mess.location.latitude,
                      mess.location.longitude
                    );
                    updatedMess.distance = formatDistance(distance);
                  }
                  return (
                    <MessCard key={mess.id} item={updatedMess} colorScheme={colorScheme} />
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Extra padding at the bottom for tab bar */}
      <View style={styles.bottomPadding} />
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
    paddingVertical: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 16,
  },
  logoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalScrollContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 16,
  },
  messCard: {
    width: 230,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  loadingImagePlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  messImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    zIndex: 2,
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardContent: {
    padding: 12,
  },
  messName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 4,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888888',
    marginHorizontal: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mapContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  mapPinsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  mapPin: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 4,
  },
  pinIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  bottomPadding: {
    height: 80,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  searchResultCard: {
    width: '48%',
    marginRight: 0,
    marginBottom: 16,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  activeFilterOption: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  filterOptionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  footerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    backgroundColor: '#FF5252',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backToHomeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchResultsScroll: {
    paddingBottom: 16,
  },
  locationMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
  },
  locationErrorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  locationStatusText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  messSection: {
    marginBottom: 16,
  },
  seeAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  messCardsContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noMessesContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMessesText: {
    fontSize: 14,
  },
  subscriptionPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  subscriptionPlanText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  activeFiltersContainer: {
    marginBottom: 12,
  },
  activeFiltersScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  clearFilterButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5252',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllFiltersText: {
    color: '#ff5252',
    fontSize: 12,
    fontWeight: '600',
  },
  resetFiltersButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF5252',
  },
  resetFiltersButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
