import SideBarModal from '@/components/SideBarModal';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import PopUpAd from '../components/PopUpAd';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdVisible, setIsAdVisible] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 7000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
        setIsAdVisible(true);
      }
    }

    prepare();
  }, []);

  const onMenuOpen = () => {
    setIsModalOpen(true);
  };

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

  const onClose = () => {
    setIsModalOpen(false);
  };

  if (!isAppReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: "#245d5a",
            },
            headerTitleAlign: 'left',
            headerTitle: () => (
              <View style={{ marginLeft: 8, paddingLeft: 8 }}>
                <Text style={{ color: "#fff", fontWeight: '600', fontSize: 24 }}>
                  GardenSewa
                </Text>
              </View>
            ),
            headerTitleStyle: {
              color: "#fff",
              fontWeight: '600',
            },
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
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}>
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
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
    paddingTop:12,
    paddingBottom:24,
    width: '90%',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: '#eee',
    borderRadius: 15,
    padding: 4,
  },
});