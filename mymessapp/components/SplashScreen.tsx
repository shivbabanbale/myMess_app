import React, { useRef, useEffect } from 'react';
import { Image, StyleSheet, View, Text, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

export function SplashScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#333333';
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Gradient colors based on theme
  const gradientColors = colorScheme === 'dark' 
    ? ['#4f46e5', '#06b6d4', '#3b82f6'] as const
    : ['#3b82f6', '#06b6d4', '#4f46e5'] as const;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[
        styles.logoContainer,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] 
        }
      ]}>
        <Image source={require('../logo.jpg')} style={styles.logo} />
        
        <Animated.View 
          style={[
            styles.titleWrapper,
            {
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })}]
            }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.titlePrefix, { color: textColor }]}>my</Text>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientContainer}
            >
              <Text style={styles.titleMain}>Mess</Text>
            </LinearGradient>
          </View>
          
          <Text style={[styles.titlePostfix, { color: textColor }]}>
            <Text style={styles.appHighlight}></Text> Find Your Mess That Serve You Best
          </Text>
        </Animated.View>
        
        <Animated.View 
          style={{ 
            opacity: titleAnim,
            marginTop: 30,
            alignItems: 'center'
          }}
        >
          <View style={styles.dotContainer}>
            {[...Array(3)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  { backgroundColor: gradientColors[i % gradientColors.length] }
                ]} 
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  titleWrapper: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titlePrefix: {
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: -1,
    marginRight: 2,
  },
  gradientContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  titleMain: {
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: -1,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  titlePostfix: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
    opacity: 0.8,
  },
  appHighlight: {
    fontWeight: '700',
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  }
}); 