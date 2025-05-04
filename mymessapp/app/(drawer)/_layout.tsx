import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomDrawerContent from '@/components/CustomDrawerContent';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '80%',
          backgroundColor: isDark ? '#121212' : '#f5f7fa'
        },
        overlayColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'
      }}
      drawerContent={(props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />}
      initialRouteName="(tabs)"
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="favorites"
        options={{
          drawerLabel: 'Favorite Messes',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="leave"
        options={{
          drawerLabel: 'Leave Management',
          title: 'Leave Management',
          headerShown: true,
          drawerIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="subscription"
        options={{
          drawerLabel: 'My Subscription',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerLabel: 'Notifications',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="payment"
        options={{
          drawerLabel: 'Payment Methods',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="support"
        options={{
          drawerLabel: 'Help & Support',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: 'About MyMess',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
} 