import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { OneSignal } from "../../lib/oneSignal";
import SuccessAfterVerification from "../../components/SuccessModal";
import { sendOtp, verifyOtp } from "../../api/PostApiOtp";

const PhoneVerification = () => {
  const router = useRouter();

  const { phone, requestType, otpPurpose } = useLocalSearchParams();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
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
    const cleaned = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    if (cleaned.length > 0 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      await sendOtp(phone, otpPurpose);
      setSeconds(60);
      setCanResend(false);
      setOtp(["", "", "", ""]);
      inputRefs[0].current?.focus();
      Alert.alert("Code Sent", `A new OTP has been sent to ${phone || "your number"}`);
    } catch (error) {
      Alert.alert("Could Not Resend", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 4) {
      Alert.alert("Incomplete Code", "Please enter the complete 4-digit verification code.");
      return;
    }
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await verifyOtp(phone, otpPurpose, fullOtp);
      if (result.verified) {
        // Booking is submitted with no login at all — this is the one point
        // a customer's phone is confirmed real, so it's also the right point
        // to register the device for push (booking-accepted, job-completed),
        // matching HomeSewa's own BookingOtp.tsx registering here rather than
        // requiring a separate login. Native-only, same guard as app/_layout.js.
        if (Platform.OS !== "web" && otpPurpose === "booking") {
          OneSignal.login(phone);
          OneSignal.User.addTag("role", "customer");
        }
        setIsOpenModal(true);
      } else {
        Alert.alert("Verification Failed", result.message || "Incorrect OTP");
        setOtp(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } catch (error) {
      Alert.alert("Verification Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearForm = () => {
    setOtp(["", "", "", ""]);
    setIsOpenModal(false);
    inputRefs[0].current?.focus();
    router.replace('/(tabs)/');
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

            {/* Centered PIN row matching resetPin style */}
            <View style={styles.pinInputsGroupRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={styles.singlePinBox}
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
                <TouchableOpacity onPress={handleResend} style={styles.resendButton} disabled={isResending}>
                  <Text style={styles.resendBtnText}>
                    {isResending ? "Sending..." : " Didn't get code? Resend Code"}
                  </Text>
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
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Submit</Text>
              )}
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
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 28,
    gap: 12,
  },
  singlePinBox: {
    width: 46,
    height: 54,
    backgroundColor: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    borderWidth: 1.5,
    borderColor: "#C5CEE0",
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
    width: "60%",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PhoneVerification;