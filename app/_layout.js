import SideBarModalLoggedIn from '@/components/LoggedInSideBar';
import SideBarModal from '@/components/SideBarModal';
import { AuthContext, AuthProvider } from '@/context/AuthContext';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useContext, useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => { });

const TOTAL_DURATION_MS = 3000;

function MainAppContent() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdownDigits, setCountdownDigits] = useState("3000");

  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const remainingMs = Math.max(0, TOTAL_DURATION_MS - elapsedMs);

      setCountdownDigits(Math.floor(remainingMs).toString().padStart(4, '0'));

      if (remainingMs <= 0) {
        clearInterval(interval);
        setIsAppReady(true);

      }
    }, 16);

    return () => clearInterval(interval);
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
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="onBoarding"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />

          <Stack.Screen
            name="(tabs)"
            options={{
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
              headerTitleStyle: { color: "#fff", fontWeight: '600' },
              headerLeft: () => (
                <View style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
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
            }}
          />

          <Stack.Screen
            name="(professional)"
            options={{
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
              headerTitleStyle: { color: "#fff", fontWeight: '600' },
              headerLeft: () => (
                <View style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
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
            }}
          />
          <Stack.Screen
            name="(all)"
            options={{
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
              headerTitleStyle: { color: "#fff", fontWeight: '600' },
              headerLeft: () => (
                <View style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#fff",
                  borderRadius: 18,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
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
            }}
          />
        </Stack>

        {!isAppReady && (
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
        )}

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
      </View>
    </SafeAreaProvider>
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
    zIndex: 9998,
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