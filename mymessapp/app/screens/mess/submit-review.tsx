import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Colors } from '@/constants/Colors';

const API_BASE_URL = 'http://localhost:8080';

export default function SubmitReviewScreen() {
  const router = useRouter();
  const { messId, messEmail, messName } = useLocalSearchParams();
  
  const [userEmail, setUserEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        setLoading(true);
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) {
          setError('User email not found. Please log in again.');
          return;
        }
        setUserEmail(email);
        
        // Check if the user has joined this mess
        await checkUserJoinedMess(email, messEmail as string);
      } catch (err) {
        console.error('Error loading user email:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserEmail();
  }, [messEmail]);

  const checkUserJoinedMess = async (userEmail: string, messEmail: string) => {
    try {
      // First get the mess details to check joinedUsers array
      const messResponse = await axios.get(`${API_BASE_URL}/mess/getByEmail/${messEmail}`);
      const messData = messResponse.data;
      
      if (messData && messData.joinedUsers && Array.isArray(messData.joinedUsers)) {
        // Check if user's email is in the joinedUsers array
        const joined = messData.joinedUsers.includes(userEmail);
        setHasJoined(joined);
        
        if (!joined) {
          setError('You need to join this mess before you can submit a review');
        }
      } else {
        setError('Could not verify your subscription status');
      }
    } catch (err) {
      console.error('Error checking if user joined mess:', err);
      setError('Failed to verify your subscription status');
    }
  };

  const handleSubmitReview = async () => {
    if (!hasJoined) {
      Alert.alert('Error', 'You need to join this mess before you can submit a review');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!feedback.trim()) {
      Alert.alert('Error', 'Please provide some feedback');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        messEmail: messEmail,
        userEmail: userEmail,
        feedbackText: feedback,
        rating: rating
      };
      
      console.log('Submitting feedback:', reviewData);
      
      const response = await axios.post(`${API_BASE_URL}/feedback`, reviewData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your review has been submitted successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => setRating(i)}
          style={styles.starContainer}
        >
          <Ionicons 
            name={i <= rating ? 'star' : 'star-outline'} 
            size={32} 
            color={i <= rating ? Colors.light.warning : Colors.light.grayDark} 
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.warning} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasJoined) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.light.warning} />
        <Text style={styles.errorText}>You need to join this mess before you can submit a review</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Review</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.messInfoCard}>
          <Text style={styles.messNameText}>{messName}</Text>
          <Text style={styles.infoText}>
            Your feedback helps improve the quality of service
          </Text>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>Rate your experience</Text>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 
              ? 'Tap a star to rate' 
              : rating === 1 
                ? 'Poor' 
                : rating === 2 
                  ? 'Fair' 
                  : rating === 3 
                    ? 'Good' 
                    : rating === 4 
                      ? 'Very Good' 
                      : 'Excellent'}
          </Text>
        </View>

        <View style={styles.feedbackContainer}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Please share your experience with this mess..."
            placeholderTextColor={Colors.light.grayDark}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || !feedback.trim() || submitting) && styles.disabledButton
          ]}
          onPress={handleSubmitReview}
          disabled={rating === 0 || !feedback.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Review</Text>
              <Ionicons name="send" size={20} color="#ffffff" style={styles.sendIcon} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  messInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.grayDark,
  },
  ratingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starContainer: {
    padding: 8,
  },
  ratingText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  feedbackContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    height: 150,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: Colors.light.grayLight,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  sendIcon: {
    marginLeft: 4,
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