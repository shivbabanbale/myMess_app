import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for the menu data
type MealData = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

type WeeklyMenuData = {
  Monday: MealData;
  Tuesday: MealData;
  Wednesday: MealData;
  Thursday: MealData;
  Friday: MealData;
  Saturday: MealData;
  Sunday: MealData;
};

type DayKey = keyof WeeklyMenuData;
type MealKey = keyof MealData;

// Define API response types
interface ApiMenuResponse {
  id: string;
  messEmail: string;
  mondayMenu: MealData;
  tuesdayMenu: MealData;
  wednesdayMenu: MealData;
  thursdayMenu: MealData;
  fridayMenu: MealData;
  saturdayMenu: MealData;
  sundayMenu: MealData;
  lastUpdated: number;
}

// Define the API base URL - replace with your actual API URL when deploying
const API_BASE_URL = Platform.OS === 'ios' ? 'http://localhost:8080' : 'http://localhost:8080';

export default function WeeklyMenuScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const accentColor = isDark ? '#3b82f6' : '#4f46e5';
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<DayKey>('Monday');
  const [messEmail, setMessEmail] = useState('');
  const [menuData, setMenuData] = useState<WeeklyMenuData>({
    Monday: { breakfast: '', lunch: '', dinner: '' },
    Tuesday: { breakfast: '', lunch: '', dinner: '' },
    Wednesday: { breakfast: '', lunch: '', dinner: '' },
    Thursday: { breakfast: '', lunch: '', dinner: '' },
    Friday: { breakfast: '', lunch: '', dinner: '' },
    Saturday: { breakfast: '', lunch: '', dinner: '' },
    Sunday: { breakfast: '', lunch: '', dinner: '' },
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Get user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        // Set loading state
        setIsLoading(true);
        
        // Try getting userToken first
        const userToken = await AsyncStorage.getItem('userToken');
        const userEmail = await AsyncStorage.getItem('userEmail');
        const userType = await AsyncStorage.getItem('userType');
        
        console.log('User auth data:', { userEmail, userType });
        
        // Try getting messOwner data directly - this should be the primary source
        const messOwnerData = await AsyncStorage.getItem('@mess_owner_data');
        console.log('MessOwner data from AsyncStorage:', messOwnerData);
        
        if (messOwnerData) {
          const parsedMessOwnerData = JSON.parse(messOwnerData);
          console.log('Parsed mess owner data:', parsedMessOwnerData);
          
          // Looking specifically for mess owner email
          const email = parsedMessOwnerData.email || 
                       parsedMessOwnerData.messEmail ||
                       parsedMessOwnerData.contact;
          
          if (email) {
            console.log('Using mess owner email from storage:', email);
            setMessEmail(email);
            checkMenuExists(email);
            return;
          }
        }
        
        // If no mess owner data, try getting from userEmail in AsyncStorage
        if (userEmail && userType === 'owner') {
          console.log('Using email from AsyncStorage:', userEmail);
          setMessEmail(userEmail);
          checkMenuExists(userEmail);
          return;
        }
        
        // If no user email in storage, try getting from route params
        const params = (router as any).params || {};
        const routeEmail = params?.email || params?.messEmail;
        
        if (routeEmail) {
          console.log('Using email from route params:', routeEmail);
          setMessEmail(routeEmail);
          checkMenuExists(routeEmail);
          return;
        }
        
        // If we still don't have an email, show an error message
        console.error('No mess owner email found from any source');
        setIsLoading(false);
        Alert.alert(
          'Error',
          'Could not determine your email address. Please log out and log in again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        
      } catch (error) {
        console.error('Error getting mess owner data:', error);
        setIsLoading(false);
        Alert.alert(
          'Error',
          'There was a problem loading your data. Please try again later.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    };
    
    getUserData();
  }, [router]);
  
  // Check if menu exists first
  const checkMenuExists = async (email: string) => {
    try {
      setIsLoading(true);
      console.log('Checking if menu exists for:', email);
      
      // Try fetching the latest menu using the new endpoint
      try {
        console.log('Fetching latest menu from new endpoint');
        const menuResponse = await fetch(`${API_BASE_URL}/menu/latest/${email}`);
        
        if (menuResponse.ok) {
          console.log('Latest menu found successfully');
          const menuData: ApiMenuResponse = await menuResponse.json();
          processMenuData(menuData);
        } else {
          console.error('Error fetching latest menu. Status:', menuResponse.status);
          
          // If no menu or error, use empty template
          console.log('Using empty template as fallback');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching latest menu data:', error);
        console.log('Using empty template as fallback after error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking if menu exists:', error);
      setIsLoading(false);
    }
  };
  
  // Process menu data from API response
  const processMenuData = (data: ApiMenuResponse) => {
    try {
      console.log('Processing menu data:', data);
      
      // Transform API response to match our state structure
      const transformedData: WeeklyMenuData = {
        Monday: { 
          breakfast: data.mondayMenu?.breakfast || '', 
          lunch: data.mondayMenu?.lunch || '', 
          dinner: data.mondayMenu?.dinner || '' 
        },
        Tuesday: { 
          breakfast: data.tuesdayMenu?.breakfast || '', 
          lunch: data.tuesdayMenu?.lunch || '', 
          dinner: data.tuesdayMenu?.dinner || '' 
        },
        Wednesday: { 
          breakfast: data.wednesdayMenu?.breakfast || '', 
          lunch: data.wednesdayMenu?.lunch || '', 
          dinner: data.wednesdayMenu?.dinner || '' 
        },
        Thursday: { 
          breakfast: data.thursdayMenu?.breakfast || '', 
          lunch: data.thursdayMenu?.lunch || '', 
          dinner: data.thursdayMenu?.dinner || '' 
        },
        Friday: { 
          breakfast: data.fridayMenu?.breakfast || '', 
          lunch: data.fridayMenu?.lunch || '', 
          dinner: data.fridayMenu?.dinner || '' 
        },
        Saturday: { 
          breakfast: data.saturdayMenu?.breakfast || '', 
          lunch: data.saturdayMenu?.lunch || '', 
          dinner: data.saturdayMenu?.dinner || '' 
        },
        Sunday: { 
          breakfast: data.sundayMenu?.breakfast || '', 
          lunch: data.sundayMenu?.lunch || '', 
          dinner: data.sundayMenu?.dinner || '' 
        }
      };
      
      setMenuData(transformedData);
    } catch (error) {
      console.error('Error processing menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save menu data to API
  const saveMenuData = async () => {
    console.log('saveMenuData function called');
    
    if (!messEmail) {
      console.error('Error: Mess owner email not found');
      
      Alert.alert(
        'Error',
        'Your email address is not available. Please log out and log in again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsSaving(true);
      console.log('Setting isSaving to true');
      console.log('Saving menu for:', messEmail);
      
      // Transform our state structure to match API model
      const apiData = {
        messEmail,
        mondayMenu: menuData.Monday,
        tuesdayMenu: menuData.Tuesday,
        wednesdayMenu: menuData.Wednesday,
        thursdayMenu: menuData.Thursday,
        fridayMenu: menuData.Friday,
        saturdayMenu: menuData.Saturday,
        sundayMenu: menuData.Sunday,
        lastUpdated: Date.now()
      };
      
      console.log('Menu data to save:', JSON.stringify(apiData));
      
      // Debugging the API URL
      console.log('API URL:', `${API_BASE_URL}/menu/save`);
      
      // Making the API call
      console.log('Making API call...');
      const response = await fetch(`${API_BASE_URL}/menu/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        try {
          const responseText = await response.text();
          console.log('Raw response:', responseText);
          
          let savedData;
          try {
            savedData = JSON.parse(responseText);
            console.log('Menu saved successfully:', savedData);
            
            // Store the menu ID if needed for future updates
            if (savedData.id) {
              await AsyncStorage.setItem('@menu_id', savedData.id);
              console.log('Menu ID stored:', savedData.id);
            }
          } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
          }
          
          // Show success message and navigate
          setShowSuccess(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          
          // Auto-dismiss after 1.5 seconds and navigate to home
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShowSuccess(false);
              console.log('Navigating to owner home screen');
              router.replace('/(owner)');
            });
          }, 1500);
          
        } catch (parseError) {
          console.error('Error handling response:', parseError);
          
          // Still show success and navigate if response was OK
          setShowSuccess(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          
          // Auto-dismiss after 1.5 seconds and navigate to home
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShowSuccess(false);
              console.log('Navigating to owner home screen');
              router.replace('/(owner)');
            });
          }, 1500);
        }
      } else {
        console.error('Error saving menu. Status:', response.status);
        // Try to get error details if available
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          Alert.alert('Error', `Failed to update menu: ${errorText}`);
        } catch (textError) {
          console.error('Error getting response text:', textError);
          Alert.alert('Error', 'Failed to update menu');
        }
      }
    } catch (error: any) {
      console.error('Error saving menu data:', error);
      Alert.alert('Error', `Failed to save menu data: ${error.message || 'Unknown error'}`);
    } finally {
      console.log('Setting isSaving to false');
      setIsSaving(false);
    }
  };
  
  // Handle text input changes
  const handleInputChange = (day: DayKey, mealType: MealKey, value: string) => {
    setMenuData(prevData => ({
      ...prevData,
      [day]: {
        ...prevData[day],
        [mealType]: value
      }
    }));
  };
  
  // Days of the week
  const daysOfWeek: DayKey[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Meal types
  const mealTypes: MealKey[] = ['breakfast', 'lunch', 'dinner'];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Weekly Menu</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: secondaryText }]}>Loading menu...</Text>
          </View>
        ) : (
          <>
            {/* Days of week tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
            >
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayTab,
                    activeDay === day && { 
                      borderBottomColor: accentColor,
                      borderBottomWidth: 2,
                    }
                  ]}
                  onPress={() => setActiveDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { 
                        color: activeDay === day ? accentColor : secondaryText,
                        fontWeight: activeDay === day ? '600' : 'normal'
                      }
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <ScrollView 
              style={styles.menuContent}
              contentContainerStyle={styles.menuContentInner}
              showsVerticalScrollIndicator={false}
            >
              {/* Menu form for active day */}
              {mealTypes.map(meal => (
                <View key={meal} style={[styles.mealCard, { backgroundColor: cardBg }]}>
                  <Text style={[styles.mealLabel, { color: textColor }]}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Text>
                  <TextInput
                    style={[styles.mealInput, { 
                      color: textColor, 
                      backgroundColor: isDark ? '#2a2a2a' : '#f7f7f7',
                      borderColor
                    }]}
                    placeholder={`Enter ${meal} items...`}
                    placeholderTextColor={secondaryText}
                    value={menuData[activeDay][meal]}
                    onChangeText={(text) => handleInputChange(activeDay, meal, text)}
                    multiline
                  />
                  <Text style={[styles.inputHelper, { color: secondaryText }]}>
                    Tip: Separate items with commas (e.g., "Poha, Tea, Fruit")
                  </Text>
                </View>
              ))}
              
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: accentColor }]}
                  onPress={() => {
                    console.log('Save button pressed');
                    saveMenuData();
                  }}
                  activeOpacity={0.7}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Weekly Menu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}
        
        {/* Success message overlay */}
        {showSuccess && (
          <Animated.View 
            style={[
              styles.successOverlay,
              { opacity: fadeAnim }
            ]}
          >
            <View style={[styles.successMessage, { backgroundColor: cardBg }]}>
              <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
              <Text style={[styles.successText, { color: textColor }]}>
                Menu Updated Successfully
              </Text>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  dayText: {
    fontSize: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuContentInner: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  mealInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    marginTop: 8,
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
  saveButtonContainer: {
    marginVertical: 20,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  successMessage: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '80%',
    maxWidth: 300,
  },
  successText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});