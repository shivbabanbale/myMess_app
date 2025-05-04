import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiProps {
  count?: number;
  colors?: string[];
  duration?: number;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  count = 50, 
  colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
  duration = 5000
}) => {
  // Create confetti pieces
  const confettiPieces = Array(count).fill(0).map((_, i) => {
    const size = Math.random() * 10 + 5;
    return {
      id: i,
      x: Math.random() * width,
      y: -20 - Math.random() * 100,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    };
  });

  // Animation references
  const fallAnimations = useRef(
    confettiPieces.map(() => new Animated.Value(0))
  ).current;
  
  const rotateAnimations = useRef(
    confettiPieces.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Start animations
    const fallAnimationSequence = fallAnimations.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: duration + (Math.random() * 3000),
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });

    const rotateAnimationSequence = rotateAnimations.map((anim) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: duration + (Math.random() * 2000),
        easing: Easing.linear,
        useNativeDriver: true,
      });
    });

    Animated.parallel([
      ...fallAnimationSequence,
      ...rotateAnimationSequence
    ]).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => {
        const translateY = fallAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [piece.y, height + 50]
        });

        const translateX = fallAnimations[index].interpolate({
          inputRange: [0, 0.3, 0.6, 1],
          outputRange: [
            piece.x,
            piece.x + (Math.random() * 40 - 20),
            piece.x + (Math.random() * 60 - 30),
            piece.x + (Math.random() * 100 - 50),
          ]
        });

        const rotate = rotateAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [`${piece.rotation}deg`, `${piece.rotation + 360 * (Math.random() * 3 + 1)}deg`]
        });

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confetti,
              {
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: piece.shape === 'circle' ? piece.size / 2 : 0,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  confetti: {
    position: 'absolute',
  }
});

export default Confetti; 