import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { Image, Pressable, View } from "react-native";

export default function RootLayout() {
  const onMenuOpen = () => {
    alert("Menu Clicked");
  };
  const onWhatsappOpen = () => {
    alert("WhatsApp Clicked");
  };

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          title: 'Garden Sewa',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: "#047754",
          },
          headerTitleStyle: {
            color: "#fff",
            fontWeight: '600',
          },

          headerTitleContainerStyle: {
            left: 0,
            right: 0,
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
                style={{ width: '100%', height: '100%' }}
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
                {/* <Image source={require('@/assets/images/whatsapp-fill-svgrepo-com.svg')} /> */}

              </Pressable>

              <Pressable onPress={onMenuOpen}>
                <Ionicons name="menu" size={26} color="white" />
              </Pressable>
            </View>
          )
        }}
      />
    </Stack>
  );
}