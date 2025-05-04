import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

export default function MembersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for API data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState<Array<any>>([]);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [messId, setMessId] = useState('');

  // Theme colors
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#333333';
  const secondaryText = isDark ? '#a0a0a0' : '#666666';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const accentColor = '#3b82f6';

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Load owner data and their mess details
  const loadOwnerData = async () => {
    try {
      setLoading(true);
      
      // Get owner email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        throw new Error('Owner email not found. Please login again.');
      }
      
      setOwnerEmail(email);
      console.log('Owner email:', email);
      
      // Fetch owner's mess data - ensure proper URL encoding
      const messResponse = await fetch(`${API_BASE_URL}/mess/getByEmail/${encodeURIComponent(email)}`);
      
      if (!messResponse.ok) {
        throw new Error(`Failed to fetch mess details: ${messResponse.status}`);
      }
      
      const messData = await messResponse.json();
      console.log('Mess data:', messData);
      
      if (!messData.id) {
        throw new Error('No mess ID found for this owner.');
      }
      
      setMessId(messData.id);
      
      // Check if joinedUsers exists and is not empty
      if (!messData.joinedUsers || !Array.isArray(messData.joinedUsers) || messData.joinedUsers.length === 0) {
        console.log('No joined users found for this mess');
        setMembers([]);
        setLoading(false);
        return;
      }
      
      console.log('Joined users emails:', messData.joinedUsers);
      
      // Create an array to hold all member data
      const formattedMembers = [];
      
      // Fetch user details for each joined user email
      for (const userEmail of messData.joinedUsers) {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/byEmail/${encodeURIComponent(userEmail)}`);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log(`User data for ${userEmail}:`, userData);
            
            // Format the user data
            const member = {
              id: userData.id || userData.contact || userData.email || Math.random().toString(),
              name: userData.name || 'Unknown Member',
              image: userData.contact ? 
                    { uri: `${API_BASE_URL}/profile/${encodeURIComponent(userData.contact)}` } : 
                    userData.email ? 
                    { uri: `${API_BASE_URL}/profile/${encodeURIComponent(userData.email)}` } :
                    require('@/assets/images/react-logo.png'),
              plan: userData.subscriptionPlan || 'Monthly',
              mealType: userData.foodType || 'Not specified',
              pendingDues: 0, // We'll update this with payment data in a later step
              attendance: 85, // Default attendance
              joinDate: userData.joinDate ? formatDate(userData.joinDate) : 'Recent',
              status: 'active',
              email: userData.contact || userData.email,
              phoneNumber: userData.phoneNumber
            };
            
            // Fetch payment data for this user
            try {
              const paymentResponse = await fetch(`${API_BASE_URL}/payments/user/${encodeURIComponent(member.email)}/mess/${messData.id}`);
              
              if (paymentResponse.ok) {
                const payments = await paymentResponse.json();
                console.log(`Payment data for ${member.email}:`, payments);
                
                if (payments && payments.length > 0) {
                  // Sort by date (most recent first)
                  payments.sort((a: any, b: any) => {
                    const dateA = new Date(a.paymentDate);
                    const dateB = new Date(b.paymentDate);
                    return dateB.getTime() - dateA.getTime();
                  });
                  
                  // Get the most recent payment's remaining amount
                  const latestPayment = payments[0];
                  console.log(`Latest payment for ${member.email}:`, latestPayment);
                  
                  // Make sure we use the correct property and it's a number
                  if (latestPayment.remainingAmount !== undefined) {
                    member.pendingDues = Number(latestPayment.remainingAmount);
                    console.log(`Set pendingDues for ${member.email} to ${member.pendingDues}`);
                  } else {
                    console.warn(`No remainingAmount found in latest payment for ${member.email}`);
                    // Calculate default dues if no remaining amount is found
                    calculateDefaultDues(member, userData, messData);
                  }
                } else {
                  console.log(`No payment records found for ${member.email}`);
                  // Calculate default dues if no payment records found
                  calculateDefaultDues(member, userData, messData);
                }
              } else {
                console.warn(`Failed to fetch payment data for ${member.email}: ${paymentResponse.status}`);
                // Calculate default dues if payment fetch failed
                calculateDefaultDues(member, userData, messData);
              }
            } catch (e) {
              console.error(`Failed to fetch payment data for ${member.email}:`, e);
              // Calculate default dues if there was an error
              calculateDefaultDues(member, userData, messData);
            }
            
            formattedMembers.push(member);
          } else {
            console.warn(`Failed to fetch details for user ${userEmail}: ${userResponse.status}`);
          }
        } catch (e) {
          console.error(`Error processing user ${userEmail}:`, e);
        }
      }
      
      console.log('Formatted members:', formattedMembers);
      setMembers(formattedMembers);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
      Alert.alert('Error', `Failed to load members: ${err.message}`);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Helper function to calculate default dues based on subscription plan
  const calculateDefaultDues = (member: any, userData: any, messData: any) => {
    const pricePerMeal = messData.pricePerMeal || 0;
    let subscriptionAmount = 0;
    
    // Check if messData has a subscription plan
    if (messData.subscriptionPlan) {
      // If subscriptionPlan > 100, it's likely a fixed amount, not days
      if (messData.subscriptionPlan > 100) {
        subscriptionAmount = messData.subscriptionPlan;
        console.log(`Using mess subscription plan as a fixed amount: ${subscriptionAmount}`);
      } else {
        // Otherwise, it's days, so calculate based on price per meal
        subscriptionAmount = messData.subscriptionPlan * pricePerMeal;
        console.log(`Calculated from mess data: ${pricePerMeal} × ${messData.subscriptionPlan} days = ${subscriptionAmount}`);
      }
    } 
    // Fallback to user's subscription plan if available
    else if (userData.subscriptionPlan) {
      if (typeof userData.subscriptionPlan === 'number') {
        // Same logic as above - if large number, it's a fixed amount
        if (userData.subscriptionPlan > 100) {
          subscriptionAmount = userData.subscriptionPlan;
        } else {
          subscriptionAmount = userData.subscriptionPlan * pricePerMeal;
        }
      } else if (typeof userData.subscriptionPlan === 'string') {
        // Handle string descriptions
        if (userData.subscriptionPlan.toLowerCase().includes('monthly')) {
          subscriptionAmount = 30 * pricePerMeal;
        } else if (userData.subscriptionPlan.toLowerCase().includes('bimonthly')) {
          subscriptionAmount = 60 * pricePerMeal;
        } else {
          // Try to parse if it's a numeric string
          const planNumber = parseFloat(userData.subscriptionPlan);
          if (!isNaN(planNumber)) {
            if (planNumber > 100) {
              subscriptionAmount = planNumber;
            } else {
              subscriptionAmount = planNumber * pricePerMeal;
            }
          } else {
            // Default to monthly if unknown
            subscriptionAmount = 30 * pricePerMeal;
          }
        }
      }
    } 
    // Default fallback
    else {
      subscriptionAmount = 30 * pricePerMeal;
    }
    
    member.pendingDues = subscriptionAmount;
    console.log(`Set pendingDues for ${member.email} to ${member.pendingDues}`);
  };

  // Filter members based on search query and filter status
  const filteredMembers = members.filter((member: any) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && member.status === 'active') ||
      (filterStatus === 'leave' && member.status === 'leave') ||
      (filterStatus === 'dues' && member.pendingDues > 0);
    
    return matchesSearch && matchesFilter;
  });

  // Render a single member item
  const renderMemberItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.memberCard, { backgroundColor: cardBg }]}
      onPress={() => {
        Alert.alert(
          item.name,
          `Email: ${item.email || 'Not available'}\nPhone: ${item.phoneNumber || 'Not available'}\nJoined: ${item.joinDate}\nPending Dues: ₹${item.pendingDues}`,
          [
            { text: 'Close', style: 'cancel' },
            { 
              text: 'View Profile Picture', 
              onPress: () => {
                if (item.email) {
                  Alert.alert('Profile URL', `${API_BASE_URL}/profile/${encodeURIComponent(item.email)}`);
                } else {
                  Alert.alert('No Profile', 'No email address available to fetch profile');
                }
              }
            }
          ]
        );
      }}
    >
      <View style={styles.memberHeader}>
        <Image 
          source={item.image} 
          style={styles.memberImage}
          defaultSource={require('@/assets/images/react-logo.png')}
          onError={(e) => {
            console.log(`Failed to load image for ${item.email}:`, e.nativeEvent.error);
          }}
        />
        
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.memberPlan, { color: secondaryText }]}>
            {item.plan} • {item.mealType}
          </Text>
          <Text style={[styles.memberJoinDate, { color: secondaryText }]}>
            Joined: {item.joinDate}
          </Text>
          {item.email && (
            <Text style={[styles.memberEmail, { color: secondaryText }]} numberOfLines={1} ellipsizeMode="tail">
              {item.email}
            </Text>
          )}
        </View>
        
        {item.status === 'leave' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>On Leave</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.memberStats, { borderTopColor: borderColor }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: secondaryText }]}>Pending Dues</Text>
          <Text 
            style={[
              styles.statValue, 
              { 
                color: item.pendingDues > 0 ? '#ef4444' : '#10b981'
              }
            ]}
          >
            {item.pendingDues > 0 ? `₹${item.pendingDues}` : 'Paid'}
          </Text>
        </View>
        
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: secondaryText }]}>Attendance</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{item.attendance}%</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={secondaryText} />
      </View>
    </TouchableOpacity>
  );

  // Add a floating action button for attendance
  const renderFloatingActionButton = () => (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: accentColor }]}
      onPress={() => router.push('/attendance')}
    >
      <Ionicons name="calendar" size={24} color="#ffffff" />
      <Text style={styles.fabText}>Mark Attendance</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={{ color: textColor, marginTop: 16 }}>Loading members...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#ef4444" />
        <Text style={{ color: textColor, marginTop: 16, textAlign: 'center', paddingHorizontal: 20 }}>{error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, backgroundColor: accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
          onPress={loadOwnerData}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: cardBg }]}>
        <Ionicons name="search" size={20} color={secondaryText} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search members..."
          placeholderTextColor={secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={secondaryText} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollableFilterButton 
          title="All"
          active={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
          isDark={isDark}
        />
        <ScrollableFilterButton 
          title="Active"
          active={filterStatus === 'active'}
          onPress={() => setFilterStatus('active')}
          isDark={isDark}
        />
        <ScrollableFilterButton 
          title="On Leave"
          active={filterStatus === 'leave'}
          onPress={() => setFilterStatus('leave')}
          isDark={isDark}
        />
        <ScrollableFilterButton 
          title="With Dues"
          active={filterStatus === 'dues'}
          onPress={() => setFilterStatus('dues')}
          isDark={isDark}
        />
      </View>
      
      {/* Members List */}
      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={secondaryText} />
            <Text style={[styles.emptyText, { color: secondaryText }]}>
              No members found
            </Text>
            <TouchableOpacity
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={loadOwnerData}
            >
              <Ionicons name="refresh" size={18} color={accentColor} />
              <Text style={{ color: accentColor, marginLeft: 6 }}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Add Member Button */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: accentColor }]}
        onPress={() => router.push('/(owner)/add-member' as any)}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      {/* Floating action button for attendance */}
      {renderFloatingActionButton()}
    </SafeAreaView>
  );
}

// Filter Button Component
const ScrollableFilterButton = ({ 
  title, 
  active, 
  onPress, 
  isDark 
}: { 
  title: string; 
  active: boolean; 
  onPress: () => void; 
  isDark: boolean; 
}) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      active && styles.activeFilterButton,
      { backgroundColor: active ? (isDark ? '#333' : '#e6f0ff') : 'transparent' }
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterText,
        active && styles.activeFilterText,
        { color: active ? '#3b82f6' : (isDark ? '#a0a0a0' : '#666666') }
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  activeFilterButton: {
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  memberCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0', // Placeholder background color
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberPlan: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
  },
  memberEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#f59e0b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  memberStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 