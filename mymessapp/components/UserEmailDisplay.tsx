import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../app/_layout';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * A component that displays the currently logged-in user's email
 * This can be imported and used anywhere in the application
 */
export default function UserEmailDisplay() {
  const { userEmail } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Set colors based on theme
  const textColor = isDark ? '#ffffff' : '#333333';
  const backgroundColor = isDark ? '#2a2a2a' : '#f3f4f6';
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>Logged in as:</Text>
      <Text style={[styles.email, { color: textColor }]}>{userEmail || 'Not logged in'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 