import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  FlatList,
} from 'react-native';
const { width } = Dimensions.get('window');
// RELEVANT SLIDE CONTENT: Highlighting the app's real utility
const slides = [
  { 
    id: '1', 
    emoji: '🏗️', 
    title: 'Project-Centric', 
    description: 'Move beyond a flat list. Group your API keys, logins, and notes by the actual project they belong to.' 
  },
  { 
    id: '2', 
    emoji: '📧', 
    title: 'Identity Mapping', 
    description: 'Instantly recall if you used your personal, work, or college email for a specific developer account.' 
  },
  { 
    id: '3', 
    emoji: '⚡', 
    title: 'Guided Capture', 
    description: 'Our smart listener detects copied secrets and prompts you to map them to a project context immediately.' 
  },
  { 
    id: '4', 
    emoji: '🔒', 
    title: 'Zero-Knowledge', 
    description: 'AES-256 local-first encryption ensures your credentials stay on your device, private and secure.' 
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const color = scrollX.interpolate({
            inputRange,
            outputRange: ['#444', '#3b82f6', '#444'],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: color }]}
            />
          );
        })}
      </View>
    );
  };

  const renderSlide = ({ item, index }: any) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    // Scale and opacity for content polish
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    // Dynamic border color for the circle
    const borderColor = scrollX.interpolate({
      inputRange,
      outputRange: ['#222', '#3b82f6', '#222'],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.emojiCircle, { transform: [{ scale }], opacity, borderColor }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </Animated.View>
        
        <Animated.View style={[styles.textContent, { opacity }]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipContainer} onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />
      <View style={styles.footer}>
        <Pagination />
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  skipContainer: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { color: '#666', fontSize: 16, fontWeight: '600' },
  slide: { width, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emojiCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Slightly thicker for the color effect
    marginBottom: 50,
  },
  emoji: { fontSize: 80 },
  textContent: { alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 15, textAlign: 'center', letterSpacing: -0.5 },
  description: { fontSize: 17, color: '#999', textAlign: 'center', lineHeight: 26, paddingHorizontal: 10 },
  footer: { position: 'absolute', bottom: 60, width: '100%', paddingHorizontal: 24 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
