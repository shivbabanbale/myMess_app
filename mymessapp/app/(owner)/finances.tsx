import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

// Helper function for retry mechanism
const fetchWithRetry = async (url: string, options = {}, retries = 3, delay = 1000) => {
  try {
    const response = await axios({
      url,
      ...options
    });
    return response;
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Retrying API call to ${url}, ${retries} retries left...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
};

// Define types for our data
interface Payment {
  id: string;
  userEmail: string;
  ownerEmail: string;
  messId: string;
  totalDues: number;      // Amount that was due
  amountPaid: number;     // Amount paid in the transaction
  remainingDues: number;  // Remaining amount after payment
  paymentDate: string;
  status: string;
  messName?: string;
  userName?: string;      // Added after fetching user details
}

interface User {
  name: string;
  contact: string;
  phoneNumber?: string;
  messId?: string;
  messName?: string;
  subscriptionPlan?: string;
  foodType?: string;
}

interface FinancialSummary {
  totalCollected: number;
  pendingDues: number;
  totalMembers: number;
  activeMembers: number;
}

export default function FinancesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messOwnerEmail, setMessOwnerEmail] = useState('');
  const [messId, setMessId] = useState('');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalCollected: 0,
    pendingDues: 0,
    totalMembers: 0,
    activeMembers: 0,
  });

  // Load data on component mount
  useEffect(() => {
    loadFinancialData();
  }, []);

  // Load financial data
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get owner email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        setError('User email not found');
        setLoading(false);
        return;
      }
      
      setMessOwnerEmail(email);
      
      // Fetch mess details to get messId
      try {
        const messResponse = await fetchWithRetry(`${API_BASE_URL}/mess/getByEmail/${email}`);
        const messDetails = messResponse.data;
        
        if (!messDetails.id) {
          setError('No mess ID found for this owner.');
          setLoading(false);
          return;
        }
        
        setMessId(messDetails.id);
        
        // Fetch payments for this mess
        await fetchPayments(messDetails.id);
        
        // Fetch members count
        await fetchMembersCount(messDetails.id);
        
      } catch (apiError: any) {
        console.error('API error:', apiError);
        setError(apiError.message || 'Failed to load mess details');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error loading financial data:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };
  
  // Fetch payments for the mess
  const fetchPayments = async (messId: string) => {
    try {
      // Get mess details to get price info
      const messDetailsResponse = await fetchWithRetry(`${API_BASE_URL}/mess/getById/${messId}`);
      const messDetails = messDetailsResponse.data;
      const pricePerMeal = messDetails.pricePerMeal || 0;
      
      // Determine if subscriptionPlan is days or a fixed amount
      // If it's > 100, it's likely a fixed amount, not days
      let subscriptionPlan = messDetails.subscriptionPlan || 30;
      let defaultSubscriptionAmount;
      
      if (subscriptionPlan > 100) {
        // If the subscriptionPlan is a large number, it's likely a total amount already
        defaultSubscriptionAmount = subscriptionPlan;
        console.log(`Using subscription plan as a fixed amount: ${defaultSubscriptionAmount}`);
      } else {
        // Otherwise, it's likely days, so calculate the total
        defaultSubscriptionAmount = pricePerMeal * subscriptionPlan;
        console.log(`Calculated default subscription: ${pricePerMeal} × ${subscriptionPlan} days = ${defaultSubscriptionAmount}`);
      }
      
      console.log(`Mess details - Price per meal: ${pricePerMeal}, Subscription plan: ${subscriptionPlan}`);
      console.log(`Default subscription amount: ${defaultSubscriptionAmount}`);
      
      // Get the list of joined users
      const joinedUsers = messDetails.joinedUsers || [];
      console.log(`Mess has ${joinedUsers.length} joined users`);
      
      // Fetch all payments for this mess - use the correct endpoint
      try {
        // Using proper API endpoint with error handling
        const paymentsResponse = await fetchWithRetry(`${API_BASE_URL}/payment/mess/${messId}`);
        let paymentsData = paymentsResponse.data || [];
        
        if (!Array.isArray(paymentsData)) {
          console.warn('Payments data is not an array:', paymentsData);
          paymentsData = [];
        }
        
        console.log(`Found ${paymentsData.length} payment records`);
        
        // Calculate totals - Use a map to track latest payment for each user
        let totalCollected = 0;
        const userLatestPayments = new Map();
        
        // Process all payments to sum the total collected and find latest payment per user
        paymentsData.forEach((payment: Payment) => {
          // Use amountPaid instead of paymentAmount
          totalCollected += payment.amountPaid || 0;
          
          // Track latest payment by user
          const existingPayment = userLatestPayments.get(payment.userEmail);
          const paymentDate = new Date(payment.paymentDate).getTime();
          
          if (!existingPayment || paymentDate > new Date(existingPayment.paymentDate).getTime()) {
            userLatestPayments.set(payment.userEmail, payment);
          }
        });
        
        // Calculate pending dues including users who haven't made any payments yet
        let pendingDues = 0;
        
        // First, count dues from users who have made payments
        userLatestPayments.forEach((payment) => {
          // Use remainingDues instead of remainingAmount
          pendingDues += payment.remainingDues || 0;
        });
        
        // Now, add default dues for users who haven't made any payments
        const usersWithPayments = new Set(Array.from(userLatestPayments.keys()));
        
        // Get list of users without payments and add default subscription amount to pending dues
        const usersWithoutPayments = joinedUsers.filter((email: string) => !usersWithPayments.has(email));
        const additionalPendingDues = usersWithoutPayments.length * defaultSubscriptionAmount;
        
        console.log(`Found ${usersWithoutPayments.length} users without any payment records`);
        console.log(`Additional pending dues from users without payments: ${additionalPendingDues}`);
        
        pendingDues += additionalPendingDues;
        console.log(`Total pending dues including users without payments: ${pendingDues}`);
        
        // Update financial summary
        setFinancialSummary(prev => ({
          ...prev,
          totalCollected,
          pendingDues
        }));
        
        // Fetch user details for each payment to get names
        const enhancedPayments = await Promise.all(
          paymentsData.map(async (payment: Payment) => {
            try {
              const userResponse = await fetchWithRetry(`${API_BASE_URL}/byEmail/${encodeURIComponent(payment.userEmail)}`);
              const userData = userResponse.data;
              return {
                ...payment,
                userName: userData.name || 'Unknown User'
              };
            } catch (error) {
              console.error(`Error fetching user details for ${payment.userEmail}:`, error);
              return {
                ...payment,
                userName: 'Unknown User'
              };
            }
          })
        );
        
        // Sort payments by date (newest first)
        const sortedPayments = enhancedPayments.sort((a, b) => {
          return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        });
        
        setPayments(sortedPayments);
        setLoading(false);
      } catch (paymentError: any) {
        console.error('Error fetching payments:', paymentError);
        
        // Try alternate endpoint for total pending dues
        try {
          console.log('Trying to fetch total pending dues for mess');
          const pendingDuesResponse = await fetchWithRetry(`${API_BASE_URL}/payment/total-pending/mess/${messId}`);
          const pendingDuesData = pendingDuesResponse.data;
          
          if (pendingDuesData && typeof pendingDuesData.totalPendingDues === 'number') {
            console.log(`Fetched total pending dues: ${pendingDuesData.totalPendingDues}`);
            
            // Update financial summary with fetched pending dues
            setFinancialSummary(prev => ({
              ...prev,
              pendingDues: pendingDuesData.totalPendingDues
            }));
          }
        } catch (duesError) {
          console.error('Error fetching total pending dues:', duesError);
        }
        
        setPayments([]);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching mess details:', error);
      setError(error.message || 'Failed to fetch mess details');
      setLoading(false);
    }
  };
  
  // Fetch members count
  const fetchMembersCount = async (messId: string) => {
    try {
      // First try to use the get all users who have joined this mess directly from mess details
      const messResponse = await fetchWithRetry(`${API_BASE_URL}/mess/getById/${messId}`);
      const messDetails = messResponse.data;
      
      if (messDetails && Array.isArray(messDetails.joinedUsers)) {
        const joinedUsers = messDetails.joinedUsers;
        const joinedUsersCount = joinedUsers.length;
        
        console.log(`Mess has ${joinedUsersCount} joined users from mess details`);
        
        // Update financial summary with member counts
        setFinancialSummary(prev => ({
          ...prev,
          totalMembers: joinedUsersCount,
          activeMembers: joinedUsersCount
        }));
        
        return;
      }
      
      // Fallback to fetching all users and filtering
      const usersResponse = await fetchWithRetry(`${API_BASE_URL}/getAll`);
      const usersData = usersResponse.data;
      
      if (usersData.content && Array.isArray(usersData.content)) {
        // Count users who are members of this mess
        const messMembers = usersData.content.filter((user: any) => user.messId === messId);
        const activeMembersCount = messMembers.length;
        
        console.log(`Found ${activeMembersCount} members from user listing`);
        
        // Update financial summary with member counts
        setFinancialSummary(prev => ({
          ...prev,
          totalMembers: activeMembersCount,
          activeMembers: activeMembersCount
        }));
      }
    } catch (error) {
      console.error('Error fetching members count:', error);
      // Try one more alternate approach
      try {
        // Try to fetch total members directly from a specialized endpoint if available
        const memberCountResponse = await fetchWithRetry(`${API_BASE_URL}/mess/memberCount/${messId}`);
        const memberCount = memberCountResponse.data;
        
        if (typeof memberCount === 'number') {
          setFinancialSummary(prev => ({
            ...prev,
            totalMembers: memberCount,
            activeMembers: memberCount
          }));
        }
      } catch (alternateError) {
        console.error('All attempts to fetch member count failed:', alternateError);
        // Don't set error state here, as this is not critical
      }
    }
  };

  // Filter transactions based on search and filter type
  const filteredTransactions = payments.filter(payment => {
    const matchesSearch = (payment.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (payment.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'payment' && payment.amountPaid > 0) ||
                       (filterType === 'due' && payment.remainingDues > 0);
    return matchesSearch && matchesType;
  });

  const renderTransactionItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => alert(`Payment details\nUser: ${item.userName || 'Unknown'}\nEmail: ${item.userEmail}\nPayment Amount: ₹${item.amountPaid}\nRemaining Dues: ₹${item.remainingDues}\nDate: ${new Date(item.paymentDate).toLocaleDateString()}`)}
    >
      <View style={styles.transactionDetails}>
        <Text style={styles.memberName}>{item.userName || 'Unknown User'}</Text>
        <Text style={styles.transactionDate}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{item.amountPaid}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.remainingDues > 0 ? Colors.light.warningLight : Colors.light.successLight }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: item.remainingDues > 0 ? Colors.light.warning : Colors.light.success }
            ]}>
              {item.remainingDues > 0 ? 'PENDING' : 'PAID'}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.transactionType,
          { color: item.remainingDues > 0 ? Colors.light.warning : Colors.light.success }
        ]}>
          {item.remainingDues > 0 ? `Remaining: ₹${item.remainingDues}` : 'Fully Paid'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.light.grayDark} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.light.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFinancialData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Pending Dues</Text>
              <Text style={[styles.summaryValue, { color: Colors.light.warning }]}>
                ₹{financialSummary.pendingDues}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Members</Text>
              <Text style={styles.summaryValue}>
                {financialSummary.activeMembers}/{financialSummary.totalMembers}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.light.grayDark} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by member name or email"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Options */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'payment' && styles.activeFilter]}
              onPress={() => setFilterType('payment')}
            >
              <Text style={[styles.filterText, filterType === 'payment' && styles.activeFilterText]}>
                Payments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'due' && styles.activeFilter]}
              onPress={() => setFilterType('due')}
            >
              <Text style={[styles.filterText, filterType === 'due' && styles.activeFilterText]}>
                Dues
              </Text>
            </TouchableOpacity>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadFinancialData}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>

          {/* Transactions List */}
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id || `${item.userEmail}-${item.paymentDate}`}
            contentContainerStyle={styles.transactionsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No transactions found</Text>
                {payments.length === 0 && (
                  <TouchableOpacity style={styles.createButton} onPress={() => Alert.alert('Information', 'No payment records found for this mess. Payments will appear here when members make payments.')}>
                    <Text style={styles.createButtonText}>Why am I seeing this?</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 12,
    color: Colors.light.grayDark,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.light.grayLight,
  },
  activeFilter: {
    backgroundColor: Colors.light.tint,
  },
  filterText: {
    color: Colors.light.grayDark,
  },
  activeFilterText: {
    color: 'white',
  },
  transactionsList: {
    paddingBottom: 80,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: Colors.light.grayDark,
    marginBottom: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: Colors.light.grayDark,
    fontSize: 16,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.light.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: Colors.light.grayLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  createButtonText: {
    color: Colors.light.grayDark,
    fontWeight: '500',
  },
}); 