import SideBarModal from '@/components/SideBarModal';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

export default function RootLayout() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onMenuOpen = () => {
    console.log("menu clicked");
    setIsModalOpen(true);
  };

  const onWhatsappOpen = () => {
    alert("WhatsApp Clicked");
  };

  const onClose = () => {
    setIsModalOpen(false);
  };

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
                  Garden Sewa
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