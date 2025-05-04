import React from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Sample favorite messes data
const favoriteMesses = [
  {
    id: '1',
    name: 'Green Garden Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.8,
    price: '₹3,500/month',
    distance: '0.8 km',
    vegetarian: true,
  },
  {
    id: '2',
    name: 'Blue Star Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.5,
    price: '₹3,200/month',
    distance: '1.2 km',
    vegetarian: false,
  },
  {
    id: '3',
    name: 'Royal Dining Mess',
    image: require('@/assets/images/react-logo.png'),
    rating: 4.7,
    price: '₹4,000/month',
    distance: '1.5 km',
    vegetarian: false,
  },
];

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const backgroundColor = isDark ? '#121212' : '#f5f7fa';
  const textColor = isDark ? '#ffffff' : '#333333';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const subTextColor = isDark ? '#a0a0a0' : '#666666';
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Favorite Messes</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Your Favorite Messes
        </Text>
        
        <View style={styles.favoritesList}>
          {favoriteMesses.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.favoriteCard, { backgroundColor: cardBg }]}
              activeOpacity={0.8}
            >
              <Image source={item.image} style={styles.messImage} />
              <View style={styles.vegBadge}>
                <View style={[styles.vegIndicator, { backgroundColor: item.vegetarian ? '#4CAF50' : '#FF5252' }]} />
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.messName, { color: textColor }]}>{item.name}</Text>
                  <TouchableOpacity style={styles.heartButton}>
                    <Ionicons name="heart" size={24} color="#FF5252" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.ratingText, { color: textColor }]}>{item.rating}</Text>
                  <View style={styles.dotSeparator} />
                  <Text style={[styles.infoText, { color: subTextColor }]}>{item.distance}</Text>
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={[styles.priceText, { color: textColor }]}>{item.price}</Text>
                </View>
                
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.orderButton}>
                    <Text style={styles.orderButtonText}>Order Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  favoritesList: {
    paddingHorizontal: 16,
  },
  favoriteCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  vegBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messName: {
    fontSize: 18,
    fontWeight: '700',
  },
  heartButton: {
    padding: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888888',
    marginHorizontal: 6,
  },
  infoText: {
    fontSize: 14,
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  orderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 