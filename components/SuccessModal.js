import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const SuccessAfterVerification = ({ visible, onClose, onClear }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-done" size={48} color="#2C5E5A"  />
          </View>

          <Text style={styles.title}>Submitted!</Text>
          <Text style={styles.subtitle}>
            Your Application has been received successfully!
          </Text>
          <Text style={styles.questionText}>Would you like to clear the form?</Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Keep</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              onPress={onClear}
            >
              <Text style={styles.primaryButtonText}>Clear Form</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: "90%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F4F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D1B1B",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C5E5A",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2C5E5A",
  },
  secondaryButton: {
    backgroundColor: "#EFEFEF",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButtonText: {
    color: "#444444",
    fontWeight: "600",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default SuccessAfterVerification;