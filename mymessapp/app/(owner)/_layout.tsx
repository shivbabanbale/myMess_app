import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function OwnerTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f8f9fa';
  const tabBarActiveTintColor = isDark ? '#3b82f6' : '#4f46e5';
  const tabBarInactiveTintColor = isDark ? '#a0a0a0' : '#666666';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarStyle: {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          borderTopColor: isDark ? '#333333' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#333333',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finances',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      
      {/* Screens that should not be in the tab bar */}
      <Tabs.Screen
        name="menu"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          tabBarButton: () => null,
          title: 'Attendance',
          headerShown: false,
        }}
      />
    </Tabs>
  );
} 