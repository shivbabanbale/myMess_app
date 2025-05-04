import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ApplyLeaveTab from './ApplyLeaveTab';
import LeaveHistoryTab from './LeaveHistoryTab';
import PendingLeavesTab from './PendingLeavesTab';

type TabType = 'apply' | 'history' | 'pending';

const LeaveScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('apply');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  // Get messId and messName from URL params
  const messId = params.messId as string || '';
  const messName = params.messName as string || '';
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f7f7f7';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  
  // Handle back button press
  const handleBack = () => {
    router.back();
  };
  
  // Render tabs
  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'apply' && [styles.activeTab, { borderColor: '#4f46e5' }]
          ]}
          onPress={() => setActiveTab('apply')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={18} 
            color={activeTab === 'apply' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666'} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'apply' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666' }
            ]}
          >
            Apply Leave
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'history' && [styles.activeTab, { borderColor: '#4f46e5' }]
          ]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={18} 
            color={activeTab === 'history' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666'} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'history' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666' }
            ]}
          >
            Leave History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'pending' && [styles.activeTab, { borderColor: '#4f46e5' }]
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons 
            name="hourglass-outline" 
            size={18} 
            color={activeTab === 'pending' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666'} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'pending' ? '#4f46e5' : isDark ? '#a0a0a0' : '#666666' }
            ]}
          >
            Pending Leaves
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'apply':
        return <ApplyLeaveTab isDark={isDark} messId={messId} messName={messName} />;
      case 'history':
        return <LeaveHistoryTab isDark={isDark} messId={messId} messName={messName} />;
      case 'pending':
        return <PendingLeavesTab isDark={isDark} messId={messId} messName={messName} />;
      default:
        return <ApplyLeaveTab isDark={isDark} messId={messId} messName={messName} />;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: cardBg, borderColor }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={textColor} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Leave Management
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      {renderTabs()}
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
});

export default LeaveScreen; 