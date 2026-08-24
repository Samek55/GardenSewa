import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

const IS_DEV = false; 

export default function Index() {
  const [targetRoute, setTargetRoute] = useState(null);

  useEffect(() => {
    const determineRoute = async () => {
      try {
        if (IS_DEV) {
          setTargetRoute('/onBoarding');
          return;
        }
        const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
        setTargetRoute(hasSeen ? '/(tabs)' : '/onBoarding');
      } catch (e) {
        setTargetRoute('/(tabs)');
      }
    };

    determineRoute();
  }, []);

  if (!targetRoute) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  return <Redirect href={targetRoute} />;
}