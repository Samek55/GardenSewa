import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

const IS_DEV = false;

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function routeAfterSplash() {
            await new Promise((resolve) => setTimeout(resolve, 3000));

            if (!isMounted) return;

            if (IS_DEV) {
                router.replace('/onBoarding');
            } else {
                try {
                    const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
                    if (hasSeen === 'true') {
                        router.replace('/(tabs)');
                    } else {
                        router.replace('/onBoarding');
                    }
                } catch (e) {
                    router.replace('/(tabs)');
                }
            }
        }

        routeAfterSplash();

        return () => {
            isMounted = false;
        };
    }, []);

    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
}