import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Colors } from '@/constants/Colors';

// API base URL
const API_BASE_URL = 'http://localhost:8080';

interface Feedback {
  id: string;
  messEmail: string;
  userEmail: string;
  feedbackText: string;
  rating: number;
  userName?: string; // Added after fetching user details
}

export default function ReviewsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [messOwnerEmail, setMessOwnerEmail] = useState('');
  const [averageRating, setAverageRating] = useState(0);

  // Load data on component mount
  useEffect(() => {
    loadFeedbackData();
  }, []);

  // Load feedback data
  const loadFeedbackData = async () => {
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
      
      try {
        // Get feedbacks for the mess
        const feedbacksResponse = await axios.get(`${API_BASE_URL}/feedback/${email}`);
        let feedbacksData = feedbacksResponse.data || [];
        
        if (!Array.isArray(feedbacksData)) {
          console.warn('Feedbacks data is not an array:', feedbacksData);
          feedbacksData = [];
        }
        
        // Get mess details to get average rating
        const messResponse = await axios.get(`${API_BASE_URL}/mess/getByEmail/${email}`);
        const messDetails = messResponse.data;
        
        if (messDetails.averageRating !== undefined && messDetails.averageRating !== null) {
          setAverageRating(messDetails.averageRating);
        }
        
        // Fetch user details for each feedback to get names
        const enhancedFeedbacks = await Promise.all(
          feedbacksData.map(async (feedback: Feedback) => {
            try {
              const userResponse = await axios.get(`${API_BASE_URL}/byEmail/${feedback.userEmail}`);
              const userData = userResponse.data;
              return {
                ...feedback,
                userName: userData.name || 'Anonymous User'
              };
            } catch (error) {
              console.error(`Error fetching user details for ${feedback.userEmail}:`, error);
              return {
                ...feedback,
                userName: 'Anonymous User'
              };
            }
          })
        );
        
        // Sort feedbacks by newest first (assuming id contains timestamp info)
        const sortedFeedbacks = enhancedFeedbacks.sort((a, b) => {
          return b.id.localeCompare(a.id);
        });
        
        setFeedbacks(sortedFeedbacks);
        setLoading(false);
      } catch (apiError: any) {
        console.error('API error:', apiError);
        setError(apiError.message || 'Failed to load reviews');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error loading feedback data:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? 'star' : 'star-outline'} 
          size={16} 
          color={i <= rating ? Colors.light.warning : Colors.light.grayDark} 
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View style={styles.feedbackItem}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.userName}>{item.userName || 'Anonymous User'}</Text>
        {renderStars(item.rating)}
      </View>
      <Text style={styles.feedbackText}>{item.feedbackText}</Text>
      <Text style={styles.userEmail}>{item.userEmail}</Text>
    </View>
  );

  const renderAverageRating = () => {
    return (
      <View style={styles.averageRatingContainer}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
        </View>
        <View>
          <Text style={styles.ratingTitle}>Average Rating</Text>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.ratingCount}>
            Based on {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.light.warning} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFeedbackData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customer Reviews</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Average Rating Section */}
          {renderAverageRating()}

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadFeedbackData}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>

          {/* Feedbacks List */}
          <FlatList
            data={feedbacks}
            renderItem={renderFeedbackItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.feedbacksList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={Colors.light.grayDark} />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>
                  Your reviews will appear here once customers submit their feedback.
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingCount: {
    fontSize: 12,
    color: Colors.light.grayDark,
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
    marginRight: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feedbacksList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  feedbackItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.light.grayDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.light.grayDark,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
}); 