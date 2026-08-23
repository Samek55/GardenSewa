import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Effortless Garden Care',
    description:
      'Book trusted gardeners for daily, weekly, monthly & yearly gardening services.',
    vectorAsset: require('../assets/images/onboarding/vector1.svg'),
  },
  {
    id: '2',
    title: 'Professional\nGardening Service',
    description:
      'Garden Sewa provides professional gardening services all over Nepal.',
    vectorAsset: require('../assets/images/onboarding/vector2.svg'),
  },
  {
    id: '3',
    title: 'Join as a Gardener ',
    description:
      'Garden Sewa provides freelancing opportunity where you can work as a full time or a freelancer gardener.',
    vectorAsset: require('../assets/images/onboarding/vector3.svg'),
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
    return (
      <View style={styles.slide}>
        <View style={styles.header}>
          {currentIndex < SLIDES.length - 1 ? (
            <TouchableOpacity onPress={handleFinish} style={styles.skipHeaderButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerPlaceholder} />
          )}
        </View>

        <View style={styles.illustrationSection}>
          <View style={styles.vectorBackgroundCircle}>
            {item.vectorAsset ? (
              <Image
                source={item.vectorAsset}
                style={{ width: width * 0.7, height: height * 0.3 }}
                contentFit="contain"
              />
            ) : null}
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 8,
  },
  skipHeaderButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  headerPlaceholder: {
    height: 32,
  },
  illustrationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.30,
  },
  vectorBackgroundCircle: {
    width: width * 0.78,
    height: width * 0.78,
    borderRadius: (width * 0.78) / 2,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#245d5a',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 44,
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
    backgroundColor: '#E2E8F0',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#245d5a',
    paddingVertical: 14,
    width: '50%', 
    alignItems: 'center',
    borderRadius: 14,
    shadowColor: '#245d5a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});