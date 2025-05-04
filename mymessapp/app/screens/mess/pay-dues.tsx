import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - ensure it's properly encoded for special characters
const API_BASE_URL = 'http://localhost:8080';

// Helper function for API calls with retry mechanism
const fetchWithRetry = async (url: string, options: any, retries = 3, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    
    throw new Error(`API error with status ${response.status}`);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Retrying API call to ${url}, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

export default function PayDuesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Extract messId from params
  const messId = params.messId as string || '';
  const ownerEmailParam = params.ownerEmail as string || '';
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [totalDues, setTotalDues] = useState(0);
  const [messDetails, setMessDetails] = useState<any>(null);
  const [ownerEmail, setOwnerEmail] = useState(ownerEmailParam);
  const [userEmail, setUserEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [previousPayments, setPreviousPayments] = useState<any[]>([]);
  
  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const inputBgColor = isDark ? '#2a2a2a' : '#f3f4f6';
  const borderColor = isDark ? '#333333' : '#e5e7eb';
  const accentColor = '#3b82f6';
  
  useEffect(() => {
    loadData();
  }, [messId]);
  
  const loadData = async () => {
    try {
      setInitialLoading(true);
      
      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        Alert.alert('Error', 'User email not found. Please login again.');
        router.back();
        return;
      }
      
      setUserEmail(email);
      
      // Fetch mess details if messId is provided
      if (messId) {
        try {
          // Fetch mess details with retry
          let response;
          try {
            response = await fetchWithRetry(`${API_BASE_URL}/mess/getById/${messId}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            }, 2);
          } catch (error) {
            // If still failed after retries, try backup endpoint if ownerEmail is available
            if (!ownerEmail) {
              throw error;
            }
            
            response = await fetchWithRetry(`${API_BASE_URL}/mess/getByEmail/${ownerEmail}`, {
              headers: {
                'Content-Type': 'application/json',
              },
            }, 2);
          }
          
          const messData = await response.json();
          setMessDetails(messData);
          
          // Only set ownerEmail if it wasn't already provided in params
          if (messData && !ownerEmailParam) {
            setOwnerEmail(messData.email || messData.contact || '');
          }
          
          // Calculate default subscription amount (will use this as fallback)
          const totalSubscriptionAmount = messData?.subscriptionPlan || 3500;
          
          // Try to fetch pending dues with retry
          await fetchPendingDues(email, messId);
          
          // Try to fetch payment history with retry - use exactly the same endpoint as history screen
          try {
            const paymentResponse = await fetchWithRetry(
              `${API_BASE_URL}/payment/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messId)}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              },
              2
            );
            
            const paymentData = await paymentResponse.json();
            console.log('Payment history from API:', paymentData);
            
            if (Array.isArray(paymentData) && paymentData.length > 0) {
              // Format payment data for display in the same way as history screen
              const formattedPayments = paymentData.map(payment => ({
                id: payment.id,
                userEmail: payment.userEmail,
                messId: payment.messId,
                messName: payment.messName || messDetails?.messName,
                date: new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short', 
                  year: 'numeric'
                }),
                amount: payment.amountPaid,
                remainingAmount: payment.remainingDues,
                status: payment.status || 'COMPLETED',
                paymentDate: payment.paymentDate,
              }));
              
              setPreviousPayments(formattedPayments);
            } else {
              setPreviousPayments([]);
            }
          } catch (paymentsError) {
            console.error('Error fetching payment history:', paymentsError);
            setPreviousPayments([]);
          }
        } catch (error) {
          console.error('Error fetching mess details:', error);
          Alert.alert('Error', 'Failed to load mess details. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Mess ID is required.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };
  
  const handlePayment = async () => {
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    
    // Validate payment amount is not greater than total dues
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > totalDues) {
      Alert.alert('Error', `Payment amount cannot exceed total dues (₹${totalDues}).`);
      return;
    }
    
    // Validate remaining info
    if (!messId || !ownerEmail || !userEmail) {
      Alert.alert('Error', 'Missing required information. Please try again.');
      return;
    }
    
    try {
      setProcessingPayment(true);
      
      // Calculate remaining amount
      const newRemainingAmount = Math.max(0, totalDues - paymentAmount);
      console.log(`Processing payment. Total dues: ${totalDues}, Amount: ${paymentAmount}, New remaining: ${newRemainingAmount}`);
      
      // Create payment request with string values for form parameters - match exactly with history screen
      const paymentFormData = {
        userEmail: userEmail,
        ownerEmail: ownerEmail,
        messId: messId,
        amountPaid: paymentAmount.toString(),
        remainingDues: newRemainingAmount.toString()
      };
      
      console.log('Sending payment data:', paymentFormData);
      
      // Use the updated payment endpoint with retry - match exactly with history screen
      try {
        const response = await fetchWithRetry(
          `${API_BASE_URL}/payment/record`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(paymentFormData).toString()
          }, 
          3
        ); 
        
        // Parse the response
        const newPayment = await response.json();
        console.log('Payment recorded successfully:', newPayment);
        
        // Format the new payment to match the expected structure for display
        const formattedPayment = {
          id: newPayment.id || new Date().getTime().toString(),
          messId: messId,
          messName: messDetails?.messName || 'Current Mess',
          userEmail: userEmail,
          amount: paymentAmount,
          remainingAmount: newRemainingAmount,
          date: new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          paymentDate: new Date().toISOString(),
          status: 'COMPLETED'
        };
        
        // Update previous payments with the new payment
        setPreviousPayments(prevPayments => [formattedPayment, ...prevPayments]);
        
        // Update total dues with the new remaining amount (IMPORTANT!)
        setTotalDues(newRemainingAmount);
        console.log(`Updated total dues after payment: ${newRemainingAmount}`);
        
        // Re-fetch the pending dues from the API to ensure we have the latest value
        await fetchPendingDues(userEmail, messId);
        
        // Store payment locally as fallback
        try {
          // Store payment in the same format as history screen would expect
          await AsyncStorage.setItem(`dues_${messId}_${userEmail}`, newRemainingAmount.toString());
        } catch (storageError) {
          console.error('Error storing payment locally:', storageError);
        }
        
        // Show success message
        setPaymentSuccess(true);
        
        // Navigate to history page after a delay
        setTimeout(() => {
          router.push('/history' as any);
        }, 2000);
      } catch (paymentError: any) {
        console.error('Error recording payment after retries:', paymentError);
        Alert.alert(
          'Payment Processing Issue',
          'The payment may have been processed but we could not confirm it. Please check your payment history or try again later.',
          [
            { text: 'Check History', onPress: () => router.push('/history' as any) },
            { text: 'Try Again', onPress: () => setProcessingPayment(false) }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', `Failed to process payment: ${error.message}`);
      setProcessingPayment(false);
    }
  };
  
  // When a payment is successful, update the total dues amount
  useEffect(() => {
    if (paymentSuccess && amount) {
      console.log(`Payment successful, updating total dues. Before: ${totalDues}, Amount paid: ${amount}`);
      const amountPaid = parseFloat(amount);
      setTotalDues(prevDues => {
        const newDues = Math.max(0, prevDues - amountPaid);
        console.log(`New total dues: ${newDues}`);
        return newDues;
      });
    }
  }, [paymentSuccess]);
  
  // Use focus effect to refresh total dues every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused, refreshing pending dues");
      if (userEmail && messId) {
        fetchPendingDues(userEmail, messId);
      }
      return () => {
        // Clean up if needed when screen is unfocused
      };
    }, [userEmail, messId])
  );

  // Function to fetch pending dues specifically
  const fetchPendingDues = async (email: string, messId: string) => {
    try {
      console.log(`Fetching pending dues for ${email} in mess ${messId}`);
      const pendingDuesResponse = await fetchWithRetry(
        `${API_BASE_URL}/payment/pending/user/${encodeURIComponent(email)}/mess/${encodeURIComponent(messId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }, 
        2
      );
      
      const pendingDuesData = await pendingDuesResponse.json();
      console.log('Pending dues response:', pendingDuesData);
      
      if (pendingDuesData && typeof pendingDuesData.pendingDues === 'number') {
        setTotalDues(pendingDuesData.pendingDues);
        console.log(`Updated pending dues amount: ₹${pendingDuesData.pendingDues}`);
      } else if (pendingDuesData && pendingDuesData.pendingDues) {
        // Try to parse it as a string containing a number
        const pendingAmount = parseFloat(pendingDuesData.pendingDues);
        if (!isNaN(pendingAmount)) {
          setTotalDues(pendingAmount);
          console.log(`Updated pending dues from string: ₹${pendingAmount}`);
        }
      }
    } catch (error) {
      console.error('Error fetching pending dues:', error);
    }
  };
  
  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={{ color: textColor, marginTop: 16 }}>Loading payment details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          title: 'Pay Dues',
          headerStyle: { backgroundColor },
          headerShadowVisible: false,
          headerTintColor: textColor,
        }}
      />
      
      {paymentSuccess ? (
        <View style={styles.successContainer}>
          <View style={[styles.successCard, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            <Text style={[styles.successTitle, { color: textColor }]}>Payment Successful!</Text>
            <Text style={[styles.successMessage, { color: isDark ? '#a0a0a0' : '#666666' }]}>
              Your payment of ₹{amount} has been processed successfully.
            </Text>
            <View style={styles.successDetails}>
              <View style={styles.successDetailRow}>
                <Text style={[styles.successDetailText, { color: textColor }]}>
                  Remaining dues: ₹{totalDues.toFixed(2)}
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => userEmail && messId && fetchPendingDues(userEmail, messId)}
                >
                  <Ionicons name="refresh" size={18} color={accentColor} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.successDetailText, { color: isDark ? '#a0a0a0' : '#666666', marginTop: 5 }]}>
                Transaction Date: {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <Text style={[styles.redirectMessage, { color: isDark ? '#90caf9' : '#1e88e5', marginTop: 20 }]}>
              Redirecting to payment history...
            </Text>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Mess Details Card */}
            {messDetails && (
              <View style={[styles.messCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.messName, { color: textColor }]}>
                  {messDetails.messName}
                </Text>
                <Text style={[styles.messAddress, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                  {messDetails.messAddress}
                </Text>
              </View>
            )}
          
            {/* Payment Form */}
            <View style={[styles.formCard, { backgroundColor: cardBg }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>Payment Details</Text>
              
              {/* Display Total Dues */}
              <View style={[styles.duesContainer, { backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9' }]}>
                <Text style={[styles.duesLabel, { color: isDark ? '#e0e0e0' : '#333333' }]}>
                  Total Dues
                </Text>
                <Text 
                  style={[
                    styles.duesAmount, 
                    { 
                      color: totalDues > 0 ? (isDark ? '#FF9E9E' : '#FF5252') : '#4CAF50'
                    }
                  ]}
                >
                  ₹{totalDues.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Payment Amount (₹)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: inputBgColor,
                      color: textColor,
                      borderColor: isDark ? '#555555' : borderColor
                    }
                  ]}
                  placeholder="Enter amount to pay"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={[styles.helperText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                  Remaining amount will be automatically calculated.
                </Text>
                
                {/* Display calculated remaining amount if user has entered a value */}
                {amount && !isNaN(parseFloat(amount)) && (
                  <View style={[styles.calculationResult, { backgroundColor: isDark ? '#1e293b' : '#f0f8ff' }]}>
                    <Text style={[styles.calculationText, { color: isDark ? '#e0e0e0' : '#1e40af' }]}>
                      Remaining dues after payment: ₹{Math.max(0, totalDues - parseFloat(amount)).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
        
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButton}
              >
                <TouchableOpacity
                  style={styles.payButtonTouch}
                  onPress={handlePayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="wallet-outline" size={22} color="white" />
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            {/* Payment History Section */}
            {previousPayments.length > 0 && (
              <View style={[styles.historyCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.formTitle, { color: textColor }]}>Payment History</Text>
                
                {previousPayments.map((payment, index) => (
                  <View 
                    key={payment.id || index} 
                    style={[
                      styles.paymentItem, 
                      { borderBottomColor: borderColor },
                      index === previousPayments.length - 1 ? { borderBottomWidth: 0, marginBottom: 0 } : {}
                    ]}
                  >
                    <View style={styles.paymentHeader}>
                      <Text style={[styles.paymentDate, { color: textColor }]}>
                        {payment.date}
                      </Text>
                      <Text style={[styles.paymentAmount, { color: accentColor }]}>
                        ₹{payment.amount}
                      </Text>
                    </View>
                    
                    <Text style={[styles.remainingText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                      Remaining: ₹{payment.remainingAmount}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Payment Info */}
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" size={28} color={accentColor} />
                <Text style={[styles.infoTitle, { color: textColor }]}>Payment Information</Text>
              </View>
              
              <Text style={[styles.infoText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                • Your payment will be processed securely
              </Text>
              <Text style={[styles.infoText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                • You will receive a payment receipt via email
              </Text>
              <Text style={[styles.infoText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                • Your subscription details will be updated automatically
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  messCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  messAddress: {
    fontSize: 14,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  messPrice: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '500',
  },
  payButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    paddingLeft: 4,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '90%',
  },
  duesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  duesLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  duesAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  calculationResult: {
    marginTop: 14,
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  calculationText: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentItem: {
    padding: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successDetailText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  successDetails: {
    marginTop: 20,
    padding: 16,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  redirectMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    padding: 5,
    marginLeft: 8,
  },
}); 