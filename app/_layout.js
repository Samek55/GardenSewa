import SideBarModalLoggedIn from '@/components/LoggedInSideBar';
import SideBarModal from '@/components/SideBarModal';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Asset } from 'expo-asset';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { memo, useContext, useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => { });

const TOTAL_DURATION_MS = 3000;

const SplashOverlay = memo(({ countdownDigits }) => (
  <View style={styles.splashOverlay}>
    <View style={styles.centerContent}>
      <Image
        source={require('@/assets/images/splash-icon-actual.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />
      <Text style={styles.timerText}>{countdownDigits}</Text>
    </View>
  </View>
));

function MainAppContent() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdownDigits, setCountdownDigits] = useState("3000");

  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    let animFrameId;

    async function prepareApp() {
      SplashScreen.hideAsync().catch(() => { });

      Asset.loadAsync([
        require('@/assets/images/home/hero.jpg'),
        require('@/assets/images/splash-icon-actual.png'),
        require('@/assets/images/gardensewa.webp'),
        require('@/assets/images/services/9.jpg'),
        require('@/assets/images/services/19.jpg'),
        require('@/assets/images/services/7.jpg'),
        require('@/assets/images/services/15.jpg'),
        require('@/assets/images/services/21.jpg'),
        require('@/assets/images/services/16.jpg'),
        require('@/assets/images/services/3.jpg'),
        require('@/assets/images/services/20.jpg'),
        require('@/assets/images/services/18.jpg'),
        require('@/assets/images/services/14.jpg'),
        require('@/assets/images/services/17.jpg'),
        require('@/assets/images/services/8.jpg'),
        require('@/assets/images/services/2.jpg'),
        require('@/assets/images/services/4.jpg'),
        require('@/assets/images/services/12.jpg'),
        require('@/assets/images/services/5.jpg'),
        require('@/assets/images/services/6.jpg'),
        require('@/assets/images/services/11.jpg'),
        require('@/assets/images/services/10.jpg'),
        require('@/assets/images/services/13.jpg'),
        require('@/assets/images/about/garden4.jpg'),
        require('@/assets/images/contact/map.png'),
        require('@/assets/images/bookings/101_1.jpg'),
      ]).catch((e) => console.warn(e));

      const startTime = Date.now();

      const tick = () => {
        const elapsedMs = Date.now() - startTime;
        const remainingMs = Math.max(0, TOTAL_DURATION_MS - elapsedMs);

        setCountdownDigits(remainingMs.toString().padStart(4, '0'));

        if (remainingMs > 0) {
          animFrameId = requestAnimationFrame(tick);
        } else {
          setIsAppReady(true);
        }
      };

      animFrameId = requestAnimationFrame(tick);
    }

    prepareApp();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, []);

  const onMenuOpen = () => setIsModalOpen(true);
  const onClose = () => setIsModalOpen(false);

  const onWhatsappOpen = async () => {
    const phoneNumber = "9852024365";
    const message = "Hello! I am looking for a gardening service";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on this device");
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#245d5a" },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <View style={{ paddingLeft: 8 }}>
            <Text style={{ color: "#fff", fontWeight: '600', fontSize: 24 }}>
              GardenSewa
            </Text>
          </View>
        ),
        headerLeft: () => (
          <View style={{
            width: 36, height: 36, backgroundColor: "#fff",
            borderRadius: 18, overflow: 'hidden',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Image
              source={require('@/assets/images/gardensewa.webp')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ),
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={onWhatsappOpen}>
              <Ionicons name="logo-whatsapp" size={24} color="white" />
            </Pressable>
            <Pressable onPress={onMenuOpen}>
              <Ionicons name="menu" size={24} color="white" />
            </Pressable>
          </View>
        )
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onBoarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(professional)" />
        <Stack.Screen name="(all)" />
      </Stack>

      {isModalOpen && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
          </Pressable>
          {isLoggedIn ? (
            <SideBarModalLoggedIn onClose={onClose} />
          ) : (
            <SideBarModal onClose={onClose} />
          )}
        </View>
      )}

      {!isAppReady && <SplashOverlay countdownDigits={countdownDigits} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#245d5a',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
});