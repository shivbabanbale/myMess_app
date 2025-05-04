import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth context to track authentication state across the app
export const AuthContext = React.createContext({
  isAuthenticated: false,
  userType: null as string | null,
  userEmail: null as string | null,
  login: (userType?: string) => {},
  logout: () => {},
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Check if user is authenticated
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Check if user is already authenticated instead of always resetting
        const storedAuthState = await AsyncStorage.getItem('isAuthenticated');
        const isUserAuthenticated = storedAuthState === 'true';
        
        // Also get the user type and email
        const storedUserType = await AsyncStorage.getItem('userType');
        const storedUserEmail = await AsyncStorage.getItem('userEmail');
        
        setIsAuthenticated(isUserAuthenticated);
        setUserType(storedUserType);
        setUserEmail(storedUserEmail);
        
        // If we're in development and want to reset auth each time, uncomment below
        // await AsyncStorage.setItem('isAuthenticated', 'false');
        // setIsAuthenticated(false);
      } catch (error) {
        console.log('Error checking auth status:', error);
        setIsAuthenticated(false);
      }
    }
    
    checkAuthStatus();
  }, []);
  
  // Authentication functions
  const authContext = {
    isAuthenticated,
    userType,
    userEmail,
    login: async (userType?: string) => {
      try {
        await AsyncStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        
        // Set user type if provided
        if (userType) {
          await AsyncStorage.setItem('userType', userType);
          setUserType(userType);
        }
        
        // Get and set email from AsyncStorage
        const email = await AsyncStorage.getItem('userEmail');
        setUserEmail(email);
        
        // Navigate based on user type
        if (userType === 'owner') {
          router.replace('/(owner)' as any);
        } else {
          // Default to user route
          router.replace('/(drawer)/(tabs)' as any);
        }
        
        // Add small delay to ensure navigation completes
        setTimeout(() => {
          console.log('Navigation completed');
        }, 100);
      } catch (error) {
        console.log('Error during login:', error);
      }
    },
    logout: async () => {
      try {
        await AsyncStorage.setItem('isAuthenticated', 'false');
        await AsyncStorage.removeItem('userType');
        await AsyncStorage.removeItem('userEmail');
        setIsAuthenticated(false);
        setUserType(null);
        setUserEmail(null);
        router.replace('/login' as any);
      } catch (error) {
        console.log('Error during logout:', error);
      }
    },
  };

  // Protected routes effect - ensures users can't access protected routes without auth
  useEffect(() => {
    // Only check protected routes after app is fully ready
    if (isAppReady && isSplashAnimationComplete) {
      if (!isAuthenticated && segments.length > 0) {
        // Check if the current route is protected (not login)
        // First segment will be in the format "(tabs)" or something similar
        const firstSegment = segments[0];
        const isProtectedRoute = firstSegment !== 'login';
        
        if (isProtectedRoute) {
          // Redirect to login if trying to access protected route without auth
          router.replace('/login' as any);
        }
      }
    }
  }, [isAuthenticated, segments, router, isAppReady, isSplashAnimationComplete]);

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Artificially delay for a smoother experience - showing splash screen for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setIsAppReady(true);
        await SplashScreen.hideAsync();
        
        // Wait a bit more before transitioning
        setTimeout(() => {
          setIsSplashAnimationComplete(true);
        }, 500);
      }
    }

    prepare();
  }, []);

  // Separate useEffect for navigation after component is mounted
  useEffect(() => {
    // Only proceed if splash animation is complete and app is ready
    if (isSplashAnimationComplete && isAppReady) {
      // Handle initial navigation based on authentication status
      if (!isAuthenticated) {
        router.replace('/login' as any);
      } else {
        // Route based on user type
        if (userType === 'owner') {
          router.replace('/(owner)' as any);
        } else {
          router.replace('/(drawer)/(tabs)' as any);
        }
      }
    }
  }, [isSplashAnimationComplete, isAppReady, router, isAuthenticated, userType]);

  // Show custom splash screen while loading
  if (!loaded || !isAppReady) {
    return <CustomSplashScreen />;
  }
  
  // Show custom splash screen during the transition animation
  if (!isSplashAnimationComplete) {
    return <CustomSplashScreen />;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Using Slot instead of Stack to fix routing issues */}
        <Slot />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
