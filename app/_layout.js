import SideBarModal from '@/components/SideBarModal';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import PopUpAd from '../components/PopUpAd';

SplashScreen.preventAutoHideAsync();

const TOTAL_DURATION_MS = 3000;

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(false);

  const [countdownDigits, setCountdownDigits] = useState("3000");

  const requestRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    SplashScreen.hideAsync();

    const updateTimer = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedMs = timestamp - startTimeRef.current;
      const remainingMs = Math.max(0, TOTAL_DURATION_MS - elapsedMs);

      // Pad with leading zeros up to 4 digits (e.g., 0950)
      const formatted4Digits = Math.floor(remainingMs).toString().padStart(4, '0');
      setCountdownDigits(formatted4Digits);

      if (remainingMs > 0) {
        requestRef.current = requestAnimationFrame(updateTimer);
      } else {
        setIsAppReady(true);
        setIsAdVisible(true);
      }
    };

    requestRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const onMenuOpen = () => setIsModalOpen(true);

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

  const onClose = () => setIsModalOpen(false);

  if (!isAppReady) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.centerContent}>
          <Image
            source={require('@/assets/images/splash-icon-actual.png')}
            style={styles.splashImage}
            resizeMode="contain"
          />
          <Text style={styles.timerText}>{countdownDigits}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#245d5a" },
            headerTitleAlign: 'left',
            headerTitle: () => (
              <View style={{ marginLeft: 8, paddingLeft: 8 }}>
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
                  style={{ width: '100%', height: '100%', marginRight: 2 }}
                  resizeMode="cover"
                />
              </View>
            ),
            headerRight: () => (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
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

      <Modal
        visible={isAdVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAdVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.adContainer}>
            <PopUpAd onClose={() => setIsAdVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Sidebar Modal */}
      {isModalOpen && (
        <>
          <Pressable
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onPress={onClose}
          />
          <SideBarModal onClose={onClose} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  adContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    width: '90%',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  }
});