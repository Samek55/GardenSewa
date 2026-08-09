import Ionicons from "@expo/vector-icons/Ionicons";
import {
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
const Contact = () => {
  const onWhatsAppOpen = async () => {
    const phoneNumber = "9852024365";
    const message =
      "Hello! I am looking for a gardening service [ www.gardensewa.com ]";
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

  const onMapOpen = async () => {
    const query = encodeURIComponent(
      "Rem.Work, Kamalpokhari, Kathmandu, Nepal",
    );
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      const supported = await Linking.canOpenURL(webUrl);
      if (supported) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert("Error", "Unable to open browser");
      }
    } catch (error) {
      console.error("An error occurred while opening Google Maps", error);
    }
  };

  const onEmailOpen = async () => {
    const email = "gardensewa@sriyog.com";
    const subject = "Gardening Service Inquiry";
    const message = "Hello! I am looking for a gardening service";

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No email app installed on this device");
      }
    } catch (error) {
      console.error("An error occurred", error);
    }
  };

  const onWebsiteOpen = async () => {
    const websiteUrl = "https://gardensewa.com";

    try {
      const supported = await Linking.canOpenURL(websiteUrl);

      if (supported) {
        await Linking.openURL(websiteUrl);
      } else {
        Alert.alert("Error", `Cannot open URL: ${websiteUrl}`);
      }
    } catch (error) {
      console.error("An error occurred while opening the website", error);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <Text style={styles.headerSubtitle}>
          We are always here to help you out.
        </Text>
      </View>

      <View style={styles.mapCard}>
        <Image
          source={require("../../assets/images/contact/map.png")}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.buttonContainer}
          activeOpacity={0.8}
          onPress={onMapOpen}
        >
          <Ionicons name="map-outline" size={18} color="white" />
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
            <View style={styles.mapCard}>
                <Image
                    source={require('../../assets/images/contact/map.png')}
                    style={styles.mapImage}
                    resizeMode='cover'
                />
                <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.8} onPress={onMapOpen}>
                    <Ionicons name="map-outline" size={18} color="white" />
                    <Text style={styles.buttonText}>Open in Maps</Text>
                </TouchableOpacity>
            </View>

      <View style={styles.sectionTextContainer}>
        <Text style={styles.sectionTitle}>Garden Sewa</Text>
        <Text style={styles.sectionSubtitle}>
          Professional Gardening Services in Nepal
        </Text>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.cardContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="location-outline" size={22} color="#245d5a" />
          </View>
          <View style={styles.textWithinCardContainer}>
            <Text style={styles.cardTitle}>Visit Us</Text>
            <Text style={styles.cardText}>
              Rem.Work, Kamalpokhari{"\n"}
              Kathmandu, Nepal
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cardContainer}
          activeOpacity={0.7}
          onPress={() => onWhatsAppOpen()}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="call-outline" size={22} color="#245d5a" />
          </View>
          <View style={styles.textWithinCardContainer}>
            <Text style={styles.cardTitle}>Call / WhatsApp</Text>
            <Text style={styles.cardText}>+977 - 98520 24 365</Text>
          </View>
          {/* <Ionicons name="chevron-forward" size={20} color="#666" style={styles.arrowIcon} /> */}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardContainer}
          activeOpacity={0.7}
          onPress={() => onEmailOpen()}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={22} color="#245d5a" />
          </View>
          <View style={styles.textWithinCardContainer}>
            <Text style={styles.cardTitle}>eMail Us</Text>
            <Text style={styles.cardText}>gardensewa@sriyog.com</Text>
          </View>
          {/* <Ionicons name="chevron-forward" size={20} color="#666" style={styles.arrowIcon} /> */}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardContainer}
          activeOpacity={0.7}
          onPress={() => onWebsiteOpen()}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="globe-outline" size={22} color="#245d5a" />
          </View>
          <View style={styles.textWithinCardContainer}>
            <Text style={styles.cardTitle}>Website</Text>
            <Text style={styles.cardText}>www.gardensewa.com</Text>
          </View>
          {/* <Ionicons name="chevron-forward" size={20} color="#666" style={styles.arrowIcon} /> */}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f7f9f9",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerTextContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#444",
    marginTop: 4,
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8e8",
  },
  mapImage: {
    width: "100%",
    height: 180,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#245d5a",
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTextContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  listContainer: {
    gap: 12,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef2f2",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#e6f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWithinCardContainer: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 18,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default Contact;
