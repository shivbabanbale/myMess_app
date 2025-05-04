import React from 'react';
import LeaveScreen from '@/app/screens/leave';
import { useLocalSearchParams } from 'expo-router';

export default function LeaveRoute() {
  // Get route params
  const params = useLocalSearchParams();
  
  // Pass all params directly to the LeaveScreen component
  // This ensures the params are available in the screen
  return <LeaveScreen {...params} />;
} 