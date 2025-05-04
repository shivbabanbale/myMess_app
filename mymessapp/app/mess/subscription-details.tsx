import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, getApiUrl } from '@/app/utils/apiConfig';

// Helper function for reliable API calls with retries
const fetchWithRetry = async (url: string, options = {}, maxRetries = 2) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return response; // Success!
    } catch (error) {
      console.warn(`API call failed (attempt ${i + 1}/${maxRetries + 1}):`, error);
      lastError = error;
      
      if (i < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, i) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying after ${delay}ms...`);
      }
    }
  }
  
  throw lastError; // If we get here, all retries failed
};

// Define attendance data type
type AttendanceStatus = 'present' | 'absent' | 'leave';

interface AttendanceData {
  date: string;
  status: AttendanceStatus;
  reason?: string;
}

interface ApiMess {
  id: string;
  name: string;
  messName: string;
  messAddress: string;
  messType: string;
  email: string;
  subscriptionPlan: number;
  pricePerMeal: number;
  capacity: number;
  currentDate: string;
  imageName: string;
  joinedUsers: string[];
  // Add other fields as needed
}

// Define leave history interface
interface LeaveHistory {
  id: string;
  from: string;
  to: string;
  reason: string;
  status: string;
  rejectionReason?: string;
}

// Define payment history interface
interface PaymentHistory {
  id: string;
  date: string;
  amount: string;
  description: string;
  status: string;
}

export default function SubscriptionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Active tab state ('details', 'leaves', 'payments')
  const [activeTab, setActiveTab] = useState('details');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription state
  const [subscription, setSubscription] = useState<any>({
    messId: id || '',
    messName: '',
    image: require('@/assets/images/react-logo.png'),
    joinDate: '',
    endDate: '',
    plan: '',
    mealType: '',
    pendingDues: 0,
    dueDate: '',
    leavesTaken: 0,
    leavesRemaining: 0,
    attendance: {
      present: 0,
      absent: 0,
      leave: 0,
      total: 0
    }
  });
  
  // Mess details state
  const [messDetails, setMessDetails] = useState<any>(null);
  
  // Attendance data (green: present, red: absent, red: leave - changed from yellow)
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  
  // Leave history
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistory[]>([]);
  
  // Payment history
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);

  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Month selection for calendar
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Add this new state variable with the other state variables
  const [refreshing, setRefreshing] = useState(false);

  // Add this to your state declarations
  const [leaveStatistics, setLeaveStatistics] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    leavesRemaining: 6, // Default max leaves per month
    leaveDaysInCurrentMonth: 0,
    totalLeaveDays: 0
  });

  // Add a new state for attendance summary
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    total: 0
  });

  useEffect(() => {
    fetchSubscriptionDetails();
    fetchAttendanceData();
    
    // Cleanup function
    return () => {};
  }, [id]);

  // Add a specific effect to immediately refresh data when the component mounts
  // This will ensure the calendar displays correctly with our new logic
  useEffect(() => {
    // Force refresh data - needed to immediately show days as present by default
    const refreshTimer = setTimeout(() => {
      console.log('Refreshing attendance data to apply new default present logic');
      fetchAttendanceData();
    }, 500);
    
    return () => clearTimeout(refreshTimer);
  }, []);

  useEffect(() => {
    if (subscription.messId) {
      fetchAttendanceData();
    }
  }, [subscription.messId, selectedMonth, selectedYear]);

  useEffect(() => {
    // Reset attendance summary when month changes
    setAttendanceSummary({
      present: 0,
      absent: 0,
      leave: 0,
      total: 0
    });
  }, [selectedMonth, selectedYear]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      
      // Get user email from AsyncStorage
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userEmail) {
        throw new Error('User email not found. Please login again.');
      }
      
      console.log('Fetching user details for email:', userEmail);
      
      // Fetch user details by email to get the messId
      const userUrl = `${API_BASE_URL}/byEmail/${userEmail}`;
      console.log('Fetching user details from:', userUrl);
      
      const userResponse = await fetchWithRetry(userUrl);
      
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user details: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      console.log('User data fetched:', userData);
      
      // Use messId from params or from user data
      const messId = id || userData.messId;
      
      if (!messId) {
        throw new Error('No mess subscription found');
      }
      
      // Fetch mess details
      const messUrl = `${API_BASE_URL}/mess/getById/${messId}`;
      console.log('Fetching mess details from:', messUrl);
      
      const messResponse = await fetchWithRetry(messUrl);
      
      if (!messResponse.ok) {
        throw new Error(`Failed to fetch mess details: ${messResponse.status}`);
      }
      
      const messData = await messResponse.json();
      console.log('Mess data fetched:', messData);
      
      // Set mess details for later use
      setMessDetails(messData);
      
      // Calculate remaining days in subscription
      const joinDate = new Date(messData.currentDate);
      const currentDate = new Date();
      const totalDays = messData.subscriptionPlan || 30;
      const elapsedDays = Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
      const remainingDays = Math.max(0, totalDays - elapsedDays);
      
      // Calculate end date
      const endDate = new Date(joinDate);
      endDate.setDate(endDate.getDate() + totalDays);
      
      // Format dates
      const formattedJoinDate = formatDate(messData.currentDate);
      const formattedEndDate = formatDate(endDate.toISOString().split('T')[0]);
      
      // Calculate total subscription amount
      const totalSubscriptionAmount = messData.pricePerMeal * messData.subscriptionPlan || 3000;
      
      // Fetch payment history to get pending dues
      let pendingDues = 0;
      try {
        // Get pending dues using the API endpoint from apiConfig
        const pendingDuesUrl = getApiUrl(API_ENDPOINTS.PAYMENT.GET_PENDING_DUES(userEmail, messId));
        console.log('Fetching pending dues from:', pendingDuesUrl);
        
        const pendingDuesResponse = await fetchWithRetry(pendingDuesUrl);
        
        if (pendingDuesResponse.ok) {
          const pendingDuesData = await pendingDuesResponse.json();
          console.log('Pending dues data fetched:', pendingDuesData);
          
          if (pendingDuesData && typeof pendingDuesData.pendingDues === 'number') {
            pendingDues = pendingDuesData.pendingDues;
            console.log(`Updated pending dues amount: ₹${pendingDuesData.pendingDues}`);
          } else if (pendingDuesData && pendingDuesData.pendingDues) {
            // Try to parse it as a string containing a number
            const pendingAmount = parseFloat(pendingDuesData.pendingDues);
            if (!isNaN(pendingAmount)) {
              pendingDues = pendingAmount;
              console.log(`Updated pending dues from string: ₹${pendingAmount}`);
            }
          } else if (typeof pendingDuesData === 'number') {
            // Handle if the API just returns a number directly
            pendingDues = pendingDuesData;
            console.log(`Updated pending dues from direct number: ₹${pendingDuesData}`);
          }
        } else {
          console.warn('Failed to fetch pending dues, status:', pendingDuesResponse.status);
          
          // Fallback to payment history API to calculate pending dues
          const paymentUrl = getApiUrl(API_ENDPOINTS.PAYMENT.GET_USER_MESS_PAYMENTS(userEmail, messId));
          console.log('Trying to fetch payment history from:', paymentUrl);
          
          const paymentResponse = await fetchWithRetry(paymentUrl);
          
          if (paymentResponse.ok) {
            const payments = await paymentResponse.json();
            console.log('Payment history fetched:', payments);
            
            // Also update payment history state for the UI
            if (Array.isArray(payments) && payments.length > 0) {
              const formattedPayments = payments.map(payment => ({
                id: payment.id || String(Math.random()),
                date: formatDate(payment.paymentDate),
                amount: `₹${payment.amountPaid}`,
                description: `Payment for ${messData.messName || 'subscription'}`,
                status: payment.status || 'completed'
              }));
              
              // Update payment history state
              setPaymentHistory(formattedPayments);
              
              // Sort by date (most recent first)
              payments.sort((a, b) => {
                const dateA = new Date(a.paymentDate);
                const dateB = new Date(b.paymentDate);
                return dateB.getTime() - dateA.getTime();
              });
              
              // Get remaining amount from the most recent payment
              const latestPayment = payments[0];
              pendingDues = latestPayment.remainingDues || 0;
            } else {
              // No previous payments, set the total dues to the subscription amount
              pendingDues = totalSubscriptionAmount;
            }
          } else {
            // If the API call fails, default to subscription amount
            console.warn('Failed to fetch payment history, status:', paymentResponse.status);
            pendingDues = totalSubscriptionAmount;
          }
        }
      } catch (paymentError) {
        console.error('Error fetching payment/dues information:', paymentError);
        // Set default dues amount
        pendingDues = totalSubscriptionAmount;
      }
      
      // Update subscription data
      setSubscription({
        messId: messData.id || messId as string,
        messName: messData.messName || 'Unknown Mess',
        image: messData.imageName 
          ? { uri: `${API_BASE_URL}/mess/profile/${messData.email}` } 
          : require('@/assets/images/react-logo.png'),
        joinDate: formattedJoinDate,
        endDate: formattedEndDate,
        plan: `${messData.subscriptionPlan || 30} days (₹${(messData.pricePerMeal || 100) * (messData.subscriptionPlan || 30)})`,
        mealType: messData.messType || 'Standard',
        pendingDues: pendingDues,
        dueDate: formattedEndDate,
        leavesTaken: 0, // Default value, will be updated by fetchAttendanceData
        leavesRemaining: 6, // Default value
        attendance: {
          present: 0, // Default values, will be updated by fetchAttendanceData
          absent: 0,
          leave: 0,
          total: 0
        }
      });
      
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error fetching subscription details:', err);
      setError(err.message);
      setLoading(false);
      Alert.alert('Error', `Failed to fetch subscription details: ${err.message}`);
    }
  };
  
  const fetchAttendanceData = async () => {
    try {
      // Get user email from AsyncStorage
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userEmail) {
        throw new Error('User email not found. Please login again.');
      }
      
      console.log('Fetching attendance data for email:', userEmail);
      
      // Get mess ID from subscription
      const messId = subscription.messId;
      if (!messId) {
        console.warn('No mess ID available for fetching attendance data');
      }
      
      // 1. Fetch attendance data for actual recorded attendance
      let attendanceData: AttendanceData[] = [];
      
      try {
        // Use the selected month and year
        const year = selectedYear;
        const month = selectedMonth + 1; // JavaScript months are 0-indexed
        
        // First try to get monthly summary with the new endpoint
        const attendanceUrl = getApiUrl(API_ENDPOINTS.ATTENDANCE.MONTHLY_SUMMARY(userEmail, year, month));
        console.log('Fetching attendance data from:', attendanceUrl);
        
        const attendanceResponse = await fetchWithRetry(attendanceUrl);
        
        if (attendanceResponse.ok) {
          const data = await attendanceResponse.json();
          console.log('Monthly attendance summary fetched:', data);
          
          // Process attendance records - the payload contains presentDates array
          if (data.success && data.payload && Array.isArray(data.payload.presentDates)) {
            // Add present dates to attendanceData
            data.payload.presentDates.forEach((dateString: string) => {
              attendanceData.push({
                date: dateString,
                status: 'present',
                reason: 'Present'
              });
            });
            
            // We no longer mark past days as absent by default
            // Instead, they will be considered present by the RenderCalendarDay component
            // This is the key change from the previous implementation
            console.log('Past days without explicit data will be considered present by default');
          }
        } else {
          // Fallback to the old method if monthly summary fails
          console.warn('Failed to fetch monthly attendance summary, status:', attendanceResponse.status);
          
          // Try to get present dates with the present-dates-only endpoint
          const presentDatesUrl = getApiUrl(API_ENDPOINTS.ATTENDANCE.PRESENT_DATES_ONLY(userEmail));
          console.log('Trying alternative endpoint:', presentDatesUrl);
          
          const presentDatesResponse = await fetchWithRetry(presentDatesUrl);
          
          if (presentDatesResponse.ok) {
            const data = await presentDatesResponse.json();
            console.log('Present dates fetched:', data);
            
            if (data.success && Array.isArray(data.payload)) {
              // Add present dates to attendanceData
              data.payload.forEach((dateString: string) => {
                // Only add dates from the selected month
                const date = new Date(dateString);
                if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
                  attendanceData.push({
                    date: dateString,
                    status: 'present',
                    reason: 'Present'
                  });
                }
              });
            }
          } else {
            console.warn('Failed to fetch present dates, status:', presentDatesResponse.status);
            
            // Last resort - try the by-user endpoint
            const byUserUrl = getApiUrl(API_ENDPOINTS.ATTENDANCE.BY_USER(userEmail));
            console.log('Trying by-user endpoint:', byUserUrl);
            
            const byUserResponse = await fetchWithRetry(byUserUrl);
            
            if (byUserResponse.ok) {
              const data = await byUserResponse.json();
              console.log('Attendance data fetched from by-user:', data);
              
              if (data.success && Array.isArray(data.payload)) {
                data.payload.forEach((record: any) => {
                  // Only add records from the selected month
                  const date = new Date(record.date);
                  if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear && 
                      record.status && (record.status.toLowerCase() === 'present' || record.status.toLowerCase() === 'absent')) {
                    attendanceData.push({
                      date: record.date,
                      status: record.status.toLowerCase() as AttendanceStatus,
                      reason: record.reason || 'No information'
                    });
                  }
                });
              }
            } else {
              console.warn('Failed to fetch attendance data, status:', byUserResponse.status);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
      
      // 2. Fetch approved leaves
      try {
        // Use the API endpoint from apiConfig
        const leavesUrl = getApiUrl(API_ENDPOINTS.LEAVE.GET_BY_USER_EMAIL(userEmail));
        console.log('Fetching leaves data from:', leavesUrl);
        
        const leavesResponse = await fetchWithRetry(leavesUrl);
        
        if (leavesResponse.ok) {
          const leavesData = await leavesResponse.json();
          console.log('Leaves data fetched:', leavesData);
          
          // Process leaves and update leave history
          if (Array.isArray(leavesData)) {
            // Update leave history state for display
            const processedLeaves = leavesData.map(leave => {
              // Handle differences in property names by accepting either format
              const from = leave.startDate || leave.from || '';
              const to = leave.endDate || leave.to || '';
              const status = (leave.status || '').toUpperCase();
              
              return {
                id: leave.id || String(Math.random()),
                from: from,
                to: to,
                reason: leave.reason || '',
                status: status.toLowerCase(),
                rejectionReason: leave.rejectionReason
              };
            });
            
            setLeaveHistory(processedLeaves);
            
            // Calculate and update leave statistics
            const statistics = calculateLeaveStatistics(leavesData);
            setLeaveStatistics(statistics);
            
            // Update subscription data with leave counts
            setSubscription((prev: typeof subscription) => ({
              ...prev,
              leavesTaken: statistics.leaveDaysInCurrentMonth,
              leavesRemaining: statistics.leavesRemaining
            }));
            
            // Process approved leaves to mark them in the calendar
            leavesData.forEach(leave => {
              // Support both status formats (uppercase and lowercase)
              const status = (leave.status || '').toUpperCase();
              if (status === 'APPROVED') {
                // Convert date strings to Date objects - support both property naming conventions
                const fromDate = new Date(leave.startDate || leave.from || '');
                const toDate = new Date(leave.endDate || leave.to || '');
                
                // Only process date ranges that are valid
                if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                  console.log(`Processing approved leave from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
                  
                  // Generate all dates in the range
                  const currentDate = new Date(fromDate);
                  
                  // Check if this leave range overlaps with the selected month
                  const selectedMonthStart = new Date(selectedYear, selectedMonth, 1);
                  const selectedMonthEnd = new Date(selectedYear, selectedMonth + 1, 0);
                  
                  // Only continue if the leave overlaps with the selected month
                  if (!(toDate < selectedMonthStart || fromDate > selectedMonthEnd)) {
                    console.log(`Leave overlaps with selected month ${selectedMonth + 1}/${selectedYear}`);
                    
                    // Create a new Date object that won't be modified in the loop
                    const loopDate = new Date(fromDate);
                    
                    // Loop through each day in the range
                    while (loopDate <= toDate) {
                      const currMonth = loopDate.getMonth();
                      const currYear = loopDate.getFullYear();
                      
                      // Check if the current date is in the selected month/year
                      if (currMonth === selectedMonth && currYear === selectedYear) {
                        const dateString = loopDate.toISOString().split('T')[0];
                        console.log(`Adding leave for date: ${dateString}`);
                        
                        // Check if this date already exists in attendanceData
                        const existingIndex = attendanceData.findIndex(item => item.date === dateString);
                        
                        if (existingIndex >= 0) {
                          // Update existing record to be a leave instead
                          attendanceData[existingIndex] = {
                            date: dateString,
                            status: 'leave',
                            reason: leave.reason || 'Approved leave'
                          };
                        } else {
                          // Add new leave record
                          attendanceData.push({
                            date: dateString,
                            status: 'leave',
                            reason: leave.reason || 'Approved leave'
                          });
                        }
                      }
                      
                      // Move to next day
                      loopDate.setDate(loopDate.getDate() + 1);
                    }
                  } else {
                    console.log(`Leave from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]} does not overlap with selected month ${selectedMonth + 1}/${selectedYear}`);
                  }
                } else {
                  console.warn('Invalid leave date range found:', leave);
                }
              }
            });
          }
        } else {
          console.warn('Failed to fetch leaves data, status:', leavesResponse.status);
        }
      } catch (error) {
        console.error('Error fetching leaves data:', error);
      }
      
      // Sort attendance data by date
      attendanceData.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Update attendance data state
      setAttendanceData(attendanceData);
      
      // Calculate and update attendance summary only for the selected month
      const summary = calculateAttendanceSummary(attendanceData);
      setAttendanceSummary(summary);
      
      // Also update subscription data for backward compatibility
      setSubscription((prev: typeof subscription) => ({
        ...prev,
        attendance: summary
      }));
      
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      Alert.alert('Error', `Failed to fetch attendance data: ${err.message}`);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Generate calendar days based on current month
  const generateCalendarDays = () => {
    // Use the selected month and year instead of current date
    const currentMonth = selectedMonth;
    const currentYear = selectedYear;
    
    // First day of the selected month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Starting day of week (0 = Sunday, 1 = Monday, etc.)
    const startingDayOfWeek = firstDayOfMonth.getDay();
    // Number of days in the selected month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const calendarDays = [];
    
    // Add empty spaces for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.calendarEmptyDay} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarDays.push(
        <RenderCalendarDay 
          key={`day-${day}`}
          day={day} 
          date={dateString} 
          data={attendanceData} 
          textColor={textColor} 
        />
      );
    }
    
    return calendarDays;
  };
  
  const backgroundColor = isDark ? '#121212' : '#F5F7FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#333333';
  const secondaryTextColor = isDark ? '#A0A0A0' : '#666666';
  const borderColor = isDark ? '#333333' : '#E0E0E0';
  const accentColor = '#3B82F6';
  
  const handleLeaveApplication = () => {
    setLeaveModal(true);
  };
  
  const submitLeaveApplication = async () => {
    try {
      setIsSubmittingLeave(true);
      
      // Get user email from AsyncStorage
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userEmail) {
        throw new Error('User email not found. Please login again.');
      }
      
      // Validate dates
      const fromDate = new Date(leaveForm.fromDate);
      const toDate = new Date(leaveForm.toDate);
      const today = new Date();
      
      if (fromDate < today) {
        Alert.alert('Invalid Date', 'Leave cannot be applied for past dates.');
        setIsSubmittingLeave(false);
        return;
      }
      
      if (toDate < fromDate) {
        Alert.alert('Invalid Date Range', 'To date cannot be earlier than from date.');
        setIsSubmittingLeave(false);
        return;
      }
      
      if (!leaveForm.reason.trim()) {
        Alert.alert('Missing Information', 'Please provide a reason for your leave.');
        setIsSubmittingLeave(false);
        return;
      }
      
      // Get owner email from messDetails
      const ownerEmail = messDetails?.email || messDetails?.ownerEmail;
      if (!ownerEmail) {
        console.warn('Owner email not found in mess details. Using fallback.');
      }
      
      // Create leave request payload
      const leaveRequest = {
        userEmail: userEmail,
        messId: subscription.messId,
        startDate: leaveForm.fromDate,
        endDate: leaveForm.toDate,
        reason: leaveForm.reason,
        status: 'PENDING',
        applicationDate: new Date().toISOString().split('T')[0],
        ownerEmail: ownerEmail || ''
      };
      
      console.log('Submitting leave request:', leaveRequest);
      
      // Send leave request to API using the correct endpoint
      const leaveUrl = getApiUrl(API_ENDPOINTS.LEAVE.APPLY);
      console.log('Submitting leave to:', leaveUrl);
      
      const response = await fetchWithRetry(
        leaveUrl, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(leaveRequest),
        },
        3 // Use 3 retries for important user actions
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit leave application: ${errorText}`);
      }
      
      // Close modal and refresh data
      setLeaveModal(false);
      Alert.alert('Success', 'Leave application submitted successfully.');
      
      // Reset form
      setLeaveForm({
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      
      // Refresh leave history and attendance data
      fetchAttendanceData();
      
    } catch (err: any) {
      console.error('Error submitting leave application:', err);
      Alert.alert('Error', `Failed to submit leave application: ${err.message}`);
    } finally {
      setIsSubmittingLeave(false);
    }
  };
  
  const handlePayDues = () => {
    // Navigate to the pay dues page with the correct parameters
    router.push({
      pathname: '/screens/mess/pay-dues',
      params: { 
        messId: subscription.messId,
        ownerEmail: messDetails?.email || ''
      }
    });
  };
  
  // Add this function to navigate to previous month
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Add this function to navigate to next month
  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  // Add this new function to handle refreshing
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSubscriptionDetails();
      // fetchAttendanceData will be called as part of fetchSubscriptionDetails
    } finally {
      setRefreshing(false);
    }
  };
  
  // Add this function to calculate leave statistics
  const calculateLeaveStatistics = (leaves: any[]) => {
    if (!Array.isArray(leaves) || leaves.length === 0) {
      return {
        approved: 0,
        pending: 0,
        rejected: 0,
        leavesRemaining: 6,
        leaveDaysInCurrentMonth: 0,
        totalLeaveDays: 0
      };
    }

    // Count by status - handle both uppercase and lowercase status values
    const approved = leaves.filter(leave => (leave.status || '').toUpperCase() === 'APPROVED').length;
    const pending = leaves.filter(leave => (leave.status || '').toUpperCase() === 'PENDING').length;
    const rejected = leaves.filter(leave => (leave.status || '').toUpperCase() === 'REJECTED').length;
    
    // Calculate leave days in current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let leaveDaysInCurrentMonth = 0;
    let totalLeaveDays = 0;
    
    leaves.forEach(leave => {
      if ((leave.status || '').toUpperCase() === 'APPROVED') {
        // Support different property naming conventions
        const fromDate = new Date(leave.startDate || leave.from || '');
        const toDate = new Date(leave.endDate || leave.to || '');
        
        // Skip invalid date ranges
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          console.warn('Skipping leave with invalid date range:', leave);
          return;
        }
        
        // Calculate days between dates (inclusive)
        const daysBetween = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)) + 1;
        totalLeaveDays += daysBetween;
        
        // Check if leave is in current month
        const isFromDateInCurrentMonth = fromDate.getMonth() === currentMonth && fromDate.getFullYear() === currentYear;
        const isToDateInCurrentMonth = toDate.getMonth() === currentMonth && toDate.getFullYear() === currentYear;
        
        if (isFromDateInCurrentMonth || isToDateInCurrentMonth) {
          // Calculate days only for the portion that falls in current month
          if (isFromDateInCurrentMonth && isToDateInCurrentMonth) {
            // Both dates in current month - use full range
            leaveDaysInCurrentMonth += daysBetween;
          } else if (isFromDateInCurrentMonth) {
            // Only from date in current month - count from fromDate to end of month
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
            const daysInCurrentMonth = Math.floor((lastDayOfMonth.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)) + 1;
            leaveDaysInCurrentMonth += daysInCurrentMonth;
          } else {
            // Only to date in current month - count from start of month to toDate
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            const daysInCurrentMonth = Math.floor((toDate.getTime() - firstDayOfMonth.getTime()) / (1000 * 3600 * 24)) + 1;
            leaveDaysInCurrentMonth += daysInCurrentMonth;
          }
        }
      }
    });
    
    // Calculate remaining leaves (max 6 per month)
    const maxLeavesPerMonth = 6;
    const leavesRemaining = Math.max(0, maxLeavesPerMonth - leaveDaysInCurrentMonth);
    
    return {
      approved,
      pending,
      rejected,
      leavesRemaining,
      leaveDaysInCurrentMonth,
      totalLeaveDays
    };
  };
  
  // In fetchAttendanceData, calculate summary based on the selected month
  const calculateAttendanceSummary = (attendanceRecords: AttendanceData[]) => {
    const today = new Date();
    
    // Get total days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Filter records for the selected month
    const filteredRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === selectedMonth && 
        recordDate.getFullYear() === selectedYear
      );
    });
    
    // Count records by status
    const recordedPresent = filteredRecords.filter(item => item.status === 'present').length;
    const absent = filteredRecords.filter(item => item.status === 'absent').length;
    const leave = filteredRecords.filter(item => item.status === 'leave').length;
    
    // Determine how many days to count up to
    const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
    const isPastMonth = 
      (selectedYear < today.getFullYear()) || 
      (selectedYear === today.getFullYear() && selectedMonth < today.getMonth());
    
    // Calculate the day up to which we should count attendance
    let lastDayToCount = 0;
    if (isCurrentMonth) {
      lastDayToCount = today.getDate(); // Count up to today
    } else if (isPastMonth) {
      lastDayToCount = daysInMonth; // Count all days for past months
    }
    
    // Calculate present days
    let present = recordedPresent; // Start with explicitly recorded present days
    
    // For current or past months, add automatically present days
    if (lastDayToCount > 0) {
      // Count days with leave or absent status that have actual entries
      const daysWithStatus = filteredRecords.length;
      
      // Automatic present = days up to now - (leave + absent)
      // This assumes all days up to today are present unless marked otherwise
      const automaticPresent = lastDayToCount - leave - absent;
      
      // Take the maximum - either the recorded present or automatic calculation
      // This handles cases where more days are marked present than our calculation
      present = Math.max(recordedPresent, automaticPresent);
    }
    
    // Ensure present count is not negative
    present = Math.max(0, present);
    
    const total = present + absent + leave;
    
    return { present, absent, leave, total };
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={{ color: textColor, marginTop: 16, fontSize: 16 }}>Loading subscription details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Ionicons name="alert-circle-outline" size={50} color="#FF5252" />
        <Text style={{ color: '#FF5252', marginTop: 16, fontSize: 16, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity 
          style={{ backgroundColor: accentColor, padding: 12, borderRadius: 8, marginTop: 20 }}
          onPress={fetchSubscriptionDetails}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Subscription Details',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[accentColor]}
            tintColor={accentColor}
          />
        }
      >
        {/* Header/Subscription Card */}
        <View style={[styles.subscriptionCard, { backgroundColor: cardBg }]}>
          <View style={styles.cardHeader}>
            <Image 
              source={subscription.image} 
              style={styles.messImage} 
              resizeMode="cover"
            />
            
            <View style={styles.headerInfo}>
              <Text style={[styles.messName, { color: textColor }]}>
                {subscription.messName}
              </Text>
              
              <Text style={[styles.planText, { color: secondaryTextColor }]}>
                {subscription.plan} • {subscription.mealType}
              </Text>
              
              <View style={styles.dateInfoRow}>
                <View style={styles.dateItem}>
                  <Text style={[styles.dateLabel, { color: secondaryTextColor }]}>
                    Joined on
                  </Text>
                  <Text style={[styles.dateValue, { color: textColor }]}>
                    {subscription.joinDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Dues Information */}
          <View style={[styles.duesSection, { borderColor }]}>
            <View style={styles.duesInfo}>
              <Text style={[styles.duesLabel, { color: secondaryTextColor }]}>
                Pending Dues
              </Text>
              <Text style={[
                styles.duesAmount, 
                { color: subscription.pendingDues > 0 ? '#FF5252' : '#4CAF50' }
              ]}>
                {subscription.pendingDues > 0 ? `₹${subscription.pendingDues}` : 'No dues'}
              </Text>
              {subscription.pendingDues > 0 && (
                <Text style={[styles.dueDate, { color: secondaryTextColor }]}>
                  Due by {subscription.dueDate}
                </Text>
              )}
            </View>
            
            {subscription.pendingDues > 0 && (
              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: accentColor }]}
                onPress={handlePayDues}
              >
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Attendance Summary */}
          <View style={[styles.attendanceSectionHeader, { borderBottomColor: borderColor }]}>
            <Text style={[styles.attendanceSectionTitle, { color: textColor }]}>
              Attendance Summary - {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.attendanceSummary}>
            <View style={styles.attendanceItem}>
              <View style={styles.attendanceItemHeader}>
                <View style={[styles.attendanceIndicator, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.attendanceText, { color: textColor }]}>
                  Present
                </Text>
              </View>
              <Text style={[styles.attendanceCount, { color: '#4CAF50' }]}>
                {attendanceSummary.present}
              </Text>
              {attendanceSummary.total > 0 && (
                <Text style={[styles.attendancePercentage, { color: secondaryTextColor }]}>
                  {Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%
                </Text>
              )}
            </View>
            
            <View style={styles.attendanceItem}>
              <View style={styles.attendanceItemHeader}>
                <View style={[styles.attendanceIndicator, { backgroundColor: '#FF5252' }]} />
                <Text style={[styles.attendanceText, { color: textColor }]}>
                  Absent
                </Text>
              </View>
              <Text style={[styles.attendanceCount, { color: '#FF5252' }]}>
                {attendanceSummary.absent}
              </Text>
              {attendanceSummary.total > 0 && (
                <Text style={[styles.attendancePercentage, { color: secondaryTextColor }]}>
                  {Math.round((attendanceSummary.absent / attendanceSummary.total) * 100)}%
                </Text>
              )}
            </View>
            
            <View style={styles.attendanceItem}>
              <View style={styles.attendanceItemHeader}>
                <View style={[styles.attendanceIndicator, { backgroundColor: '#FFC107' }]} />
                <Text style={[styles.attendanceText, { color: textColor }]}>
                  Leave
                </Text>
              </View>
              <Text style={[styles.attendanceCount, { color: '#FFC107' }]}>
                {attendanceSummary.leave}
              </Text>
              {attendanceSummary.total > 0 && (
                <Text style={[styles.attendancePercentage, { color: secondaryTextColor }]}>
                  {Math.round((attendanceSummary.leave / attendanceSummary.total) * 100)}%
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View
            style={[
              styles.tab,
              styles.activeTab,
              { backgroundColor: accentColor }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: '#FFFFFF' }
            ]}>
              Subscription Details
            </Text>
          </View>
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Attendance Calendar
            </Text>
            
            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity style={styles.monthArrow} onPress={goToPreviousMonth}>
                <Ionicons name="chevron-back" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
              
              <Text style={[styles.monthText, { color: textColor }]}>
                {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity style={styles.monthArrow} onPress={goToNextMonth}>
                <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text 
                  key={index} 
                  style={[styles.calendarHeaderDay, { color: secondaryTextColor }]}
                >
                  {day}
                </Text>
              ))}
            </View>
            
            {/* Calendar Days */}
            <View style={styles.calendarGrid}>
              {generateCalendarDays()}
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>Present</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#FF5252' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>Absent</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#FFC107' }]} />
                <Text style={[styles.legendText, { color: secondaryTextColor }]}>Leave</Text>
              </View>
            </View>
          </View>
          
          {/* Apply for Leave Button */}
          <TouchableOpacity 
            style={[styles.applyLeaveButton, { backgroundColor: accentColor }]}
            onPress={handleLeaveApplication}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            <Text style={styles.applyLeaveText}>Apply for Leave</Text>
          </TouchableOpacity>
          
          {/* Leaves Summary */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Leaves Summary
            </Text>
            
            <View style={styles.leavesSummaryContent}>
              <View style={styles.leavesSummaryItem}>
                <Text style={[styles.leavesNumber, { color: textColor }]}>
                  {leaveStatistics.leaveDaysInCurrentMonth}
                </Text>
                <Text style={[styles.leavesLabel, { color: secondaryTextColor }]}>
                  Days Taken
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              
              <View style={styles.leavesSummaryItem}>
                <Text style={[styles.leavesNumber, { color: textColor }]}>
                  {leaveStatistics.leavesRemaining}
                </Text>
                <Text style={[styles.leavesLabel, { color: secondaryTextColor }]}>
                  Days Remaining
                </Text>
              </View>
            </View>
            
            <View style={[styles.moreLeaveStats, { borderTopColor: borderColor }]}>
              <View style={styles.leaveStatRow}>
                <Text style={[styles.leaveStatLabel, { color: secondaryTextColor }]}>Total Approved Leaves:</Text>
                <Text style={[styles.leaveStatValue, { color: textColor }]}>{leaveStatistics.approved}</Text>
              </View>
              <View style={styles.leaveStatRow}>
                <Text style={[styles.leaveStatLabel, { color: secondaryTextColor }]}>Pending Requests:</Text>
                <Text style={[styles.leaveStatValue, { color: textColor }]}>{leaveStatistics.pending}</Text>
              </View>
              <View style={styles.leaveStatRow}>
                <Text style={[styles.leaveStatLabel, { color: secondaryTextColor }]}>Rejected Requests:</Text>
                <Text style={[styles.leaveStatValue, { color: textColor }]}>{leaveStatistics.rejected}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Leave Application Modal */}
      <Modal
        visible={leaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setLeaveModal(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: textColor }]}>From Date</Text>
              <TouchableOpacity 
                style={[styles.dateInput, { borderColor }]}
                onPress={() => {
                  // In a real app, show date picker here
                  Alert.alert('Date Picker', 'Date picker would open here in the real app');
                }}
              >
                <Text style={[styles.dateInputText, { color: textColor }]}>{leaveForm.fromDate}</Text>
                <Ionicons name="calendar-outline" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: textColor }]}>To Date</Text>
              <TouchableOpacity 
                style={[styles.dateInput, { borderColor }]}
                onPress={() => {
                  // In a real app, show date picker here
                  Alert.alert('Date Picker', 'Date picker would open here in the real app');
                }}
              >
                <Text style={[styles.dateInputText, { color: textColor }]}>{leaveForm.toDate}</Text>
                <Ionicons name="calendar-outline" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: textColor }]}>Reason</Text>
              <TextInput
                style={[styles.reasonInput, { borderColor, color: textColor }]}
                placeholder="Enter reason for leave"
                placeholderTextColor={secondaryTextColor}
                multiline={true}
                numberOfLines={4}
                value={leaveForm.reason}
                onChangeText={(text) => setLeaveForm(prev => ({ ...prev, reason: text }))}
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { backgroundColor: accentColor, opacity: isSubmittingLeave ? 0.7 : 1 }
              ]}
              onPress={submitLeaveApplication}
              disabled={isSubmittingLeave}
            >
              {isSubmittingLeave ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Leave Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Calendar Day Component
interface CalendarDayProps {
  day: number;
  date: string;
  data: Array<{
    date: string;
    status: 'present' | 'absent' | 'leave';
    reason?: string;
  }>;
  textColor: string;
}

const RenderCalendarDay: React.FC<CalendarDayProps> = ({ day, date, data, textColor }) => {
  // Check if this is the current day
  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = date === formattedToday;
  
  // Check if this date is in the future
  const dateObj = new Date(date);
  const isFutureDate = dateObj > today;
  
  // Find if there's specific data for this day
  const dayData = data.find(item => item.date === date);
  
  // Determine status
  // Default to 'present' for past dates unless marked as 'leave'
  let status = null;
  if (dayData) {
    // Use the recorded status if available
    status = dayData.status;
  } else if (!isFutureDate && !isToday) {
    // For past dates with no data, mark as present
    status = 'present';
  }
  
  let backgroundColor = 'transparent';
  if (status === 'present') backgroundColor = '#4CAF5033';
  else if (status === 'absent') backgroundColor = '#FF525233';
  else if (status === 'leave') backgroundColor = '#FFC10733'; // Yellow background for leaves
  
  let statusIndicatorColor = 'transparent';
  if (status === 'present') statusIndicatorColor = '#4CAF50';
  else if (status === 'absent') statusIndicatorColor = '#FF5252';
  else if (status === 'leave') statusIndicatorColor = '#FFC107'; // Yellow indicator for leaves
  
  const reason = dayData?.reason || (status === 'present' ? 'Present by default' : '');
  
  return (
    <TouchableOpacity 
      style={[
        styles.calendarDay, 
        { backgroundColor },
        isToday && styles.todayHighlight,
        isFutureDate && styles.futureDate
      ]}
      onPress={() => status && alert(`Status: ${status}${reason ? `\nReason: ${reason}` : ''}`)}
      disabled={!status} // Disable touch for days without status
    >
      <Text 
        style={[
          styles.calendarDayText, 
          { color: textColor },
          isToday && styles.todayText
        ]}
      >
        {day}
      </Text>
      {status && (
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: statusIndicatorColor }
          ]} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  subscriptionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  messImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  messName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planText: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateInfoRow: {
    flexDirection: 'row',
  },
  dateItem: {
    marginRight: 16,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  duesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  duesInfo: {
    flex: 1,
  },
  duesLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  duesAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
  },
  payButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  attendanceSummary: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
  },
  attendanceItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: '28%',
  },
  attendanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attendanceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendancePercentage: {
    fontSize: 12,
  },
  attendanceSectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  attendanceSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    marginBottom: 20,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarHeaderDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 1/7 for 7 days a week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  calendarEmptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  applyLeaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  applyLeaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  leavesSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leavesSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  leavesNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  leavesLabel: {
    fontSize: 13,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  moreLeaveStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  leaveStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leaveStatLabel: {
    fontSize: 14,
  },
  leaveStatValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  dateInputText: {
    flex: 1,
    marginRight: 8,
  },
  reasonInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  todayHighlight: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  todayText: {
    fontWeight: 'bold',
  },
  futureDate: {
    opacity: 0.5,
  },
}); 