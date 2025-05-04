import React from 'react';
import HomeScreen from '@/app/(tabs)/index';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreenWithDrawer() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#ffffff' : '#333333';
  
  // Create a menu button element
  const menuButton = (
    <TouchableOpacity 
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      }}
    >
      <Ionicons name="menu-outline" size={28} color={textColor} />
    </TouchableOpacity>
  );
  
  // Pass the menu button element to the HomeScreen
  return <HomeScreen CustomMenuButton={menuButton} />;
} 