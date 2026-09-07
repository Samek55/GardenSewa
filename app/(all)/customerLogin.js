import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
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
    View,
} from "react-native";
import { OneSignal } from "../../lib/oneSignal";

import { invokeEdgeFunction } from "../../api/functionsClient";
import { sendOtp } from "../../api/PostApiOtp";
import { AuthContext } from "../../context/AuthContext";

const CustomerLogin = () => {
    const { login } = useContext(AuthContext);

    const [step, setStep] = useState("phone"); // 'phone' | 'otp'
    const [phone, setPhone] = useState("");
    const [fullName, setFullName] = useState("");
    const [sending, setSending] = useState(false);

    const [otp, setOtp] = useState(["", "", "", ""]);
    const [verifying, setVerifying] = useState(false);
    const [seconds, setSeconds] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        if (step !== "otp") return;
        let timer;
        if (seconds > 0) {
            timer = setInterval(() => setSeconds((s) => s - 1), 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, seconds]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }
        setSending(true);
        try {
            const result = await sendOtp(phone, "customer-login", fullName.trim());
            if (!result.success) {
                Alert.alert("Could Not Send Code", result.message || "Please try again.");
                return;
            }
            setOtp(["", "", "", ""]);
            setSeconds(60);
            setCanResend(false);
            setStep("otp");
        } catch (error) {
            Alert.alert("Could Not Send Code", error.message || "Something went wrong. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || resending) return;
        setResending(true);
        try {
            const result = await sendOtp(phone, "customer-login", fullName.trim());
            if (!result.success) {
                Alert.alert("Could Not Resend", result.message || "Please try again.");
                return;
            }
            setOtp(["", "", "", ""]);
            setSeconds(60);
            setCanResend(false);
            inputRefs[0].current?.focus();
        } catch (error) {
            Alert.alert("Could Not Resend", error.message || "Something went wrong. Please try again.");
        } finally {
            setResending(false);
        }
    };

    const handleOtpChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        const newOtp = [...otp];
        newOtp[index] = cleaned.slice(-1);
        setOtp(newOtp);
        if (cleaned.length > 0 && index < 3) inputRefs[index + 1].current?.focus();
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 4) {
            Alert.alert("Incomplete Code", "Please enter the complete 4-digit verification code.");
            return;
        }
        setVerifying(true);
        try {
            const result = await invokeEdgeFunction(
                "customer-login",
                { phone, code: fullOtp, fullName: fullName.trim() },
                "Login failed"
            );
            if (!result.verified) {
                Alert.alert("Verification Failed", result.message || "Incorrect OTP");
                setOtp(["", "", "", ""]);
                inputRefs[0].current?.focus();
                return;
            }
            // OneSignal is null in any environment lacking its native module
            // (Expo Go, web) — see lib/oneSignal.js.
            if (OneSignal) {
                OneSignal.login(result.customer.phone);
                OneSignal.User.addTag("role", "customer");
            }
            await login({ phone: result.customer.phone, name: result.customer.fullName });
            router.replace("/(tabs)");
        } catch (error) {
            Alert.alert("Verification Failed", error.message || "Something went wrong. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                {step === "phone" ? (
                    <View style={styles.card}>
                        <Text style={styles.title}>Login / Sign Up</Text>
                        <Text style={styles.subtitle}>Enter your phone number to continue</Text>

                        <Text style={styles.label}>Full Name (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit Phone Number"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ""))}
                        />

                        <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={sending}>
                            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send OTP</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.backButton} onPress={() => setStep("phone")}>
                            <Ionicons name="arrow-back" size={22} color="#245d5a" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Verify Phone</Text>
                        <Text style={styles.subtitle}>
                            Enter the 4-digit code sent to <Text style={styles.phoneHighlight}>{phone}</Text>
                        </Text>

                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={inputRefs[index]}
                                    style={styles.otpBox}
                                    value={digit}
                                    onChangeText={(t) => handleOtpChange(t, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend} disabled={resending}>
                                    <Text style={styles.resendText}>{resending ? "Sending..." : "Didn't get code? Resend"}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.timerText}>Resend Code in {seconds}s</Text>
                            )}
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={verifying}>
                            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify & Continue</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#235A55" },
    scrollContainer: { flexGrow: 1, justifyContent: "center", padding: 20 },
    card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, gap: 12 },
    backButton: { marginBottom: 4 },
    title: { fontSize: 24, fontWeight: "700", color: "#000" },
    subtitle: { fontSize: 14, color: "#555" },
    phoneHighlight: { fontWeight: "700", color: "#2C5E5A" },
    label: { fontSize: 13, fontWeight: "600", color: "#555", marginTop: 6 },
    input: { borderWidth: 1, borderColor: "#C5CEE0", borderRadius: 10, padding: 12, fontSize: 15 },
    primaryButton: { backgroundColor: "#2C5E5A", borderRadius: 26, height: 52, alignItems: "center", justifyContent: "center", marginTop: 12 },
    primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginVertical: 16 },
    otpBox: { width: 46, height: 54, borderWidth: 1.5, borderColor: "#C5CEE0", borderRadius: 10, fontSize: 20, fontWeight: "700" },
    resendContainer: { alignItems: "center" },
    resendText: { color: "#2C5E5A", fontWeight: "700", fontSize: 13, textDecorationLine: "underline" },
    timerText: { color: "#1d1b1b", fontSize: 13, fontWeight: "600" },
});

export default CustomerLogin;
