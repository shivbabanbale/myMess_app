import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '@/app/utils/apiConfig';
import AllLeavesTab from '@/app/components/owner/AllLeavesTab';
import PendingLeavesOwnerTab from '@/app/components/owner/PendingLeavesOwnerTab';

export default function OwnerLeavesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [messId, setMessId] = useState('');
  const [messName, setMessName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const activeTabBg = isDark ? '#3b82f6' : '#4f46e5';
  const inactiveTabBg = isDark ? '#1e1e1e' : '#ffffff';
  
  // Load mess info on component mount
  useEffect(() => {
    const getMessInfo = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) {
          Alert.alert('Error', 'User email not found. Please login again.');
          setLoading(false);
          return;
        }
        
        setOwnerEmail(email);
        
        // Fetch mess details using owner email
        const response = await fetch(getApiUrl(`/mess/getByEmail/${encodeURIComponent(email)}`));
        const messData = await response.json();
        
        if (messData && messData.id) {
          setMessId(messData.id);
          setMessName(messData.name || 'My Mess');
        } else {
          Alert.alert('Error', 'Could not retrieve mess details. Please try again.');
        }
      } catch (error) {
        console.error('Error loading mess info:', error);
        Alert.alert('Error', 'An error occurred while loading mess information.');
      } finally {
        setLoading(false);
      }
    };
    
    getMessInfo();
  }, []);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#4f46e5'} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Leave Management</Text>
            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>{messName}</Text>
          </View>
          
          <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9', borderColor }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'all' && { backgroundColor: activeTabBg }
              ]}
              onPress={() => setActiveTab('all')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === 'all' ? '#ffffff' : subTextColor }
                ]}
              >
                All Leaves
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'pending' && { backgroundColor: activeTabBg }
              ]}
              onPress={() => setActiveTab('pending')}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === 'pending' ? '#ffffff' : subTextColor }
                ]}
              >
                Pending Leaves
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContent}>
            {activeTab === 'all' ? (
              <AllLeavesTab
                isDark={isDark}
                messId={messId}
                messName={messName}
                ownerEmail={ownerEmail}
              />
            ) : (
              <PendingLeavesOwnerTab
                isDark={isDark}
                messId={messId}
                messName={messName}
                ownerEmail={ownerEmail}
              />
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
  },
}); 