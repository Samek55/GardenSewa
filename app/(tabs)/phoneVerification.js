import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import SuccessAfterVerification from "../../components/SuccessModal";

const PhoneVerification = () => {
  const router = useRouter();

  const { phone, requestType } = useLocalSearchParams();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [seconds, setSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isTablet = screenWidth > 600;
  const cardMaxWidth = isTablet ? 500 : "100%";
  const dynamicPadding = screenHeight < 700 ? 20 : 32;

  useEffect(() => {
    let timer;
    if (seconds > 0) {
      timer = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [seconds]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setSeconds(60);
    setCanResend(false);
    setOtp(["", "", "", ""]);
    inputRefs[0].current?.focus();
    Alert.alert("Code Sent", `A new OTP has been sent to ${phone || "your number"}`);
  };

  const handleSubmit = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 4) {
      Alert.alert("Incomplete Code", "Please enter the complete 4-digit verification code.");
      return;
    }
    setIsOpenModal(true);
  };

  const handleClearForm = () => {
    setOtp(["", "", "", ""]);
    setIsOpenModal(false);
    inputRefs[0].current?.focus();
    router.replace('/(tabs)/')

  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { alignItems: isTablet ? "center" : "stretch" },
          ]}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.whitePanelCard,
              {
                maxWidth: cardMaxWidth,
                paddingHorizontal: dynamicPadding,
                paddingTop: dynamicPadding + 8,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: isTablet ? 36 : 0,
                borderBottomRightRadius: isTablet ? 36 : 0,
                marginBottom: isTablet ? 40 : 0,
              },
            ]}
          >
            <Text style={styles.signInTitle}>Phone Verification</Text>
            <Text style={styles.instructionText}>{requestType} Request Received</Text>
            <Text style={styles.instructionText}>Awaiting Confirmation!</Text>

            <Text style={styles.instructionText}>
              Enter the 4-digit OTP code sent to{" "}
              <Text style={styles.phoneHighlightText}>
                {phone || "your registered number"}
              </Text>
            </Text>

            <View style={styles.pinInputsGroupRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.singlePinBox,
                    { height: screenHeight < 700 ? 52 : 58 },
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                  <Text style={styles.resendBtnText}> Didn't get code? Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendText}>
                  Resend Code in <Text style={styles.timerHighlight}>{seconds}s</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.loginSubmitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.loginButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <SuccessAfterVerification
          visible={isOpenModal}
          onClose={() => setIsOpenModal(false)}
          onClear={handleClearForm}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#235A55",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  whitePanelCard: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    paddingBottom: 40,
    gap: 16,
    alignItems: "center",
  },
  signInTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: "#444",
    lineHeight: 20,
    textAlign: "center",
  },
  phoneHighlightText: {
    fontWeight: "700",
    color: "#2C5E5A",
  },
  pinInputsGroupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 28,
    gap: 12,
  },
  singlePinBox: {
    flex: 1,
    backgroundColor: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    borderWidth: 1,
    borderColor: "#d2e3e1",
    paddingVertical: 0,
    borderRadius: 10,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d1b1b",
  },
  timerHighlight: {
    fontWeight: "700",
    color: "#2C5E5A",
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C5E5A",
    textDecorationLine: "underline",
  },
  loginSubmitButton: {
    backgroundColor: "#2C5E5A",
    width: "80%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    // marginTop: "auto",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PhoneVerification;