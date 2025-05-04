import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Default time slots
const DEFAULT_TIME_SLOTS = [
  {
    id: '1',
    time: '7:00 AM - 8:00 AM',
    type: 'Breakfast',
    enabled: true,
    capacity: 10
  },
  {
    id: '2',
    time: '8:00 AM - 9:00 AM',
    type: 'Breakfast',
    enabled: true,
    capacity: 10
  },
  {
    id: '3',
    time: '12:00 PM - 1:00 PM',
    type: 'Lunch',
    enabled: true,
    capacity: 15
  },
  {
    id: '4',
    time: '1:00 PM - 2:00 PM',
    type: 'Lunch',
    enabled: true,
    capacity: 15
  },
  {
    id: '5',
    time: '7:00 PM - 8:00 PM',
    type: 'Dinner',
    enabled: true,
    capacity: 15
  },
  {
    id: '6',
    time: '8:00 PM - 9:00 PM',
    type: 'Dinner',
    enabled: true,
    capacity: 15
  }
];

// Interface for time slot
interface TimeSlot {
  id: string;
  time: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  enabled: boolean;
  capacity: number;
}

export default function SlotSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messEmail, setMessEmail] = useState('');
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const accentColor = isDark ? '#3b82f6' : '#4f46e5';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  
  // Load slot settings
  const loadSlotSettings = async () => {
    try {
      setLoading(true);
      
      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'User email not found');
        setLoading(false);
        return;
      }
      
      setMessEmail(email);
      
      // TODO: Replace this with real API call when backend is ready
      // For now, just use DEFAULT_TIME_SLOTS after a delay to simulate API call
      setTimeout(() => {
        setTimeSlots(DEFAULT_TIME_SLOTS);
        setLoading(false);
      }, 1000);
      
      // Uncomment when API is ready:
      /*
      try {
        const response = await axios.get(`${API_BASE_URL}/slot/settings/${email}`);
        if (response.data) {
          setTimeSlots(response.data);
        } else {
          setTimeSlots(DEFAULT_TIME_SLOTS);
        }
      } catch (error) {
        console.error('Error loading slot settings:', error);
        // Use default if API fails
        setTimeSlots(DEFAULT_TIME_SLOTS);
      }
      */
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load slot settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Save slot settings
  const saveSlotSettings = async () => {
    try {
      setSaving(true);
      
      // TODO: Replace with real API call when backend is ready
      // For now, just simulate a successful save after a delay
      setTimeout(() => {
        Alert.alert('Success', 'Slot settings saved successfully');
        setSaving(false);
      }, 1000);
      
      // Uncomment when API is ready:
      /*
      await axios.post(`${API_BASE_URL}/slot/settings/${messEmail}`, timeSlots);
      Alert.alert('Success', 'Slot settings saved successfully');
      */
    } catch (error) {
      console.error('Error saving slot settings:', error);
      Alert.alert('Error', 'Failed to save slot settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle slot enabled state
  const toggleSlotEnabled = (id: string) => {
    setTimeSlots(currentSlots => 
      currentSlots.map(slot => 
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };
  
  // Update slot capacity
  const updateSlotCapacity = (id: string, capacity: string) => {
    const capacityNum = parseInt(capacity, 10);
    if (isNaN(capacityNum)) return;
    
    setTimeSlots(currentSlots => 
      currentSlots.map(slot => 
        slot.id === id ? { ...slot, capacity: capacityNum } : slot
      )
    );
  };
  
  // Load data when component mounts
  useEffect(() => {
    loadSlotSettings();
  }, []);
  
  // Group slots by meal type
  const breakfastSlots = timeSlots.filter(slot => slot.type === 'Breakfast');
  const lunchSlots = timeSlots.filter(slot => slot.type === 'Lunch');
  const dinnerSlots = timeSlots.filter(slot => slot.type === 'Dinner');
  
  // Render a time slot
  const renderTimeSlot = (slot: TimeSlot) => (
    <View key={slot.id} style={[styles.slotCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.slotHeader}>
        <Text style={[styles.slotTime, { color: textColor }]}>{slot.time}</Text>
        <Switch
          value={slot.enabled}
          onValueChange={() => toggleSlotEnabled(slot.id)}
          trackColor={{ false: isDark ? '#555' : '#ccc', true: accentColor }}
          thumbColor={isDark ? '#fff' : '#fff'}
        />
      </View>
      
      <View style={styles.slotCapacity}>
        <Text style={[styles.slotCapacityLabel, { color: secondaryText }]}>Max Capacity:</Text>
        <TextInput
          style={[
            styles.slotCapacityInput, 
            { 
              color: textColor, 
              borderColor, 
              backgroundColor: isDark ? '#333' : '#f5f5f5' 
            }
          ]}
          value={slot.capacity.toString()}
          onChangeText={(text) => updateSlotCapacity(slot.id, text)}
          keyboardType="number-pad"
          maxLength={3}
          editable={slot.enabled}
        />
      </View>
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
        <Text style={[styles.headerTitle, { color: textColor }]}>Slot Settings</Text>
        <View style={{ width: 32 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading slot settings...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.description, { color: secondaryText }]}>
            Configure available time slots for meal bookings. Enable or disable slots and set maximum capacity for each.
          </Text>
          
          {/* Breakfast Slots */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Ionicons name="sunny-outline" size={20} color={accentColor} />
              <Text style={[styles.mealTitle, { color: textColor }]}>Breakfast</Text>
            </View>
            {breakfastSlots.map(renderTimeSlot)}
          </View>
          
          {/* Lunch Slots */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Ionicons name="restaurant-outline" size={20} color={accentColor} />
              <Text style={[styles.mealTitle, { color: textColor }]}>Lunch</Text>
            </View>
            {lunchSlots.map(renderTimeSlot)}
          </View>
          
          {/* Dinner Slots */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Ionicons name="moon-outline" size={20} color={accentColor} />
              <Text style={[styles.mealTitle, { color: textColor }]}>Dinner</Text>
            </View>
            {dinnerSlots.map(renderTimeSlot)}
          </View>
          
          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={saveSlotSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  slotCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  slotCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotCapacityLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  slotCapacityInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 