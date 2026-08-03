import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SlideOneVector = () => (
  <Image
    source={require('../assets/images/icon.png')}
    style={styles.vectorImage}
    resizeMode="contain"
  />
);

const SlideTwoVector = () => (
  <Image
    source={require('../assets/images/icon.png')}
    style={styles.vectorImage}
    resizeMode="contain"
  />
);

const SlideThreeVector = () => (
  <Image
    source={require('../assets/images/icon.png')}
    style={styles.vectorImage}
    resizeMode="contain"
  />
);

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to GardenSewa',
    description: 'Your one-stop solution for expert gardening and plant care services.',
    VectorGraphic: SlideOneVector,
  },
  {
    id: '2',
    title: 'Expert Plant Care',
    description: 'Book professional gardeners directly to keep your indoor and outdoor space green.',
    VectorGraphic: SlideTwoVector,
  },
  {
    id: '3',
    title: 'Get Started Today',
    description: 'Browse available gardening services and transform your home space.',
    VectorGraphic: SlideThreeVector,
  },
];

export default function OnBoardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const renderItem = ({ item }) => {
    const VectorGraphic = item.VectorGraphic;
    return (
      <View style={styles.slide}>
        <View style={styles.vectorContainer}>
          <VectorGraphic />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewConfig}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentIndex < SLIDES.length - 1 ? (
            <>
              <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.button, styles.fullButton]} onPress={handleNext}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 12,
  },
  vectorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  vectorImage: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#245d5a',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    marginBottom: 68,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#245d5a',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  button: {
    backgroundColor: '#245d5a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  fullButton: {
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});