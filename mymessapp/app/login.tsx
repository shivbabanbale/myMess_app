import React, { useState, useRef, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Backend API URL - update this to your actual backend URL
const API_URL = 'http://localhost:8080'; // Using localhost for development

type UserType = 'user' | 'owner';
type AuthStep = 'email' | 'otp';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [userType, setUserType] = useState<UserType>('user');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animated value for error message
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  
  // Show error with animation
  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
    Animated.sequence([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(3000),
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => setErrorMessage(''));
  };
  
  // Show success with animation
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    Animated.sequence([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(3000),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => setSuccessMessage(''));
  };

  // Create refs for OTP inputs
  const otpInputs = useRef<Array<TextInput | null>>([null, null, null, null]);
  
  // Theme colors
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const inputBgColor = isDark ? '#2a2a2a' : '#f3f4f6';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const errorColor = '#ef4444';
  const successColor = '#10b981';
  
  const gradientUser = isDark 
    ? ['#4f46e5', '#3b82f6'] as const
    : ['#3b82f6', '#4f46e5'] as const;
    
  const gradientOwner = isDark 
    ? ['#f59e0b', '#ef4444'] as const 
    : ['#ef4444', '#f59e0b'] as const;

  // Send OTP to email
  const sendOtp = async () => {
    try {
      setIsLoading(true);
      const endpoint = userType === 'user' ? '/auth/sendOtp' : '/auth/sendOtpToMess';
      const response = await fetch(`${API_URL}${endpoint}?contact=${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      
      if (response.ok) {
        showSuccess('Verification code sent to your email');
        setAuthStep('otp');
      } else {
        showError(data || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (otpValue: string) => {
    try {
      setIsLoading(true);
      const endpoint = userType === 'user' ? '/auth/verifyOtp' : '/auth/verifyMess';
      const response = await fetch(`${API_URL}${endpoint}?contact=${email}&otp=${otpValue}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      
      if (response.ok) {
        // Extract token from response
        const tokenPart = data.split('Token: ')[1];
        if (tokenPart) {
          // Store token, user type and email
          await AsyncStorage.setItem('userToken', tokenPart);
          await AsyncStorage.setItem('userType', userType);
          await AsyncStorage.setItem('userEmail', email);
          
          console.log(`Email stored: ${email}`);
          showSuccess('Login successful');
          // Call the auth context login method
          login(userType);
        } else {
          showError('Invalid response from server');
        }
      } else {
        showError(data || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (authStep === 'email') {
      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailRegex.test(email)) {
        await sendOtp();
      } else {
        showError('Please enter a valid email address');
      }
    } else {
      // Validate OTP
      const otpValue = otp.join('');
      if (otpValue.length === 4) {
        await verifyOtp(otpValue);
      }
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    // Only allow digits
    if (text && !/^\d+$/.test(text)) {
      return;
    }
    
    // Update OTP state
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto focus next input if text is entered
    if (text.length === 1 && index < 3) {
      otpInputs.current[index + 1]?.focus();
    } else if (text.length === 1 && index === 3) {
      // If last digit is entered, check if all digits are filled
      const completedOtp = [...newOtp.slice(0, 3), text];
      if (completedOtp.every(digit => digit.length === 1)) {
        // Submit after a short delay to allow the user to see the completed OTP
        setTimeout(() => {
          handleContinue();
        }, 500);
      }
    }
    
    // If backspace is pressed on empty input, focus previous input
    if (text.length === 0 && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    // Reset OTP fields
    setOtp(['', '', '', '']);
    // Focus the first OTP input
    otpInputs.current[0]?.focus();
    // Send OTP again
    await sendOtp();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error and Success Messages */}
        {errorMessage !== '' && (
          <Animated.View style={[styles.messageContainer, { opacity: errorOpacity, backgroundColor: '#ef4444' }]}>
            <Ionicons name="alert-circle" size={20} color="white" />
            <Text style={styles.messageText}>{errorMessage}</Text>
          </Animated.View>
        )}
        
        {successMessage !== '' && (
          <Animated.View style={[styles.messageContainer, { opacity: successOpacity, backgroundColor: '#10b981' }]}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.messageText}>{successMessage}</Text>
          </Animated.View>
        )}
        
        <View style={styles.header}>
          <Image source={require('../logo.jpg')} style={styles.logo} />
          <Text style={[styles.title, { color: textColor }]}>
            Welcome to <Text style={styles.appName}>myMessApp</Text>
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#aaaaaa' : '#666666' }]}>
            Sign in to continue
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              userType === 'user' && styles.activeTab,
              { borderColor: userType === 'user' ? gradientUser[0] : borderColor }
            ]}
            onPress={() => setUserType('user')}
          >
            <LinearGradient
              colors={userType === 'user' ? gradientUser : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.iconContainer,
                userType !== 'user' && { backgroundColor: inputBgColor }
              ]}
            >
              <Ionicons
                name="person"
                size={22}
                color={userType === 'user' ? '#ffffff' : placeholderColor}
              />
            </LinearGradient>
            <Text
              style={[
                styles.tabText,
                { color: userType === 'user' ? (isDark ? '#ffffff' : '#333333') : placeholderColor }
              ]}
            >
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              userType === 'owner' && styles.activeTab,
              { borderColor: userType === 'owner' ? gradientOwner[0] : borderColor }
            ]}
            onPress={() => setUserType('owner')}
          >
            <LinearGradient
              colors={userType === 'owner' ? gradientOwner : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.iconContainer,
                userType !== 'owner' && { backgroundColor: inputBgColor }
              ]}
            >
              <Ionicons
                name="business"
                size={22}
                color={userType === 'owner' ? '#ffffff' : placeholderColor}
              />
            </LinearGradient>
            <Text
              style={[
                styles.tabText,
                { color: userType === 'owner' ? (isDark ? '#ffffff' : '#333333') : placeholderColor }
              ]}
            >
              Owner
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {authStep === 'email' ? (
            <>
              <Text style={[styles.inputLabel, { color: textColor }]}>
                Enter your email address
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
                <Ionicons name="mail-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="example@email.com"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
              <Text style={[styles.infoText, { color: placeholderColor }]}>
                We'll send a verification code to this email
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: textColor }]}>
                Enter the 4-digit verification code
              </Text>
              <Text style={[styles.emailDisplay, { color: placeholderColor }]}>
                Sent to: {email}
              </Text>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={el => otpInputs.current[index] = el}
                    style={[
                      styles.otpInput,
                      { 
                        backgroundColor: inputBgColor, 
                        borderColor: digit ? (userType === 'user' ? gradientUser[0] : gradientOwner[0]) : borderColor,
                        color: textColor 
                      }
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    autoFocus={index === 0}
                    selectTextOnFocus={true}
                    editable={!isLoading}
                  />
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={handleResendCode}
                disabled={isLoading}
              >
                <Text style={[
                  styles.resendText, 
                  { 
                    color: userType === 'user' ? gradientUser[0] : gradientOwner[0],
                    opacity: isLoading ? 0.5 : 1
                  }
                ]}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={[
              styles.buttonContainer, 
              { 
                opacity: (
                  isLoading || 
                  (authStep === 'email' && !email) || 
                  (authStep === 'otp' && otp.join('').length < 4)
                ) ? 0.7 : 1 
              }
            ]}
            onPress={handleContinue}
            disabled={
              isLoading || 
              (authStep === 'email' && !email) || 
              (authStep === 'otp' && otp.join('').length < 4)
            }
          >
            <LinearGradient
              colors={userType === 'user' ? gradientUser : gradientOwner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.buttonText}>
                    {authStep === 'email' ? 'Sending...' : 'Verifying...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {authStep === 'email' ? 'Continue' : 'Verify & Sign In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    borderRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  appName: {
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  activeTab: {
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 20,
  },
  emailDisplay: {
    fontSize: 14,
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: (width - 120) / 4,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  messageContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 999,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 