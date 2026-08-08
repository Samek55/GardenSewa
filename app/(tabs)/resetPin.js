import { Ionicons } from "@expo/vector-icons";
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

const ResetPin = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const phoneParam = Array.isArray(params.phone) ? params.phone[0] : params.phone;

    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [newPin, setNewPin] = useState(["", "", "", ""]);
    const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);

    const [seconds, setSeconds] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const newPinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const confirmPinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    useEffect(() => {
        if (phoneParam) {
            const rawDigits = String(phoneParam).replace(/[^0-9]/g, "").slice(0, 10);
            setPhoneNumber(rawDigits);
        }
    }, [phoneParam]);

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

    const resetForm = () => {
        setPhoneNumber("");
        setOtp(["", "", "", ""]);
        setNewPin(["", "", "", ""]);
        setConfirmPin(["", "", "", ""]);
    };

    const handlePinChange = (text, index, stateArray, setStateArray, refs) => {
        const updated = [...stateArray];
        updated[index] = text;
        setStateArray(updated);

        if (text.length === 1 && index < 3) {
            refs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e, index, stateArray, refs) => {
        if (e.nativeEvent.key === "Backspace" && stateArray[index] === "" && index > 0) {
            refs[index - 1].current?.focus();
        }
    };

    const formatPhone = (text) => {
        const digitsOnly = (text || "").replace(/[^0-9]/g, "");
        if (digitsOnly.length === 10) {
            return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 10)}`;
        }
        return text;
    };

    const handleResend = () => {
        if (!canResend) return;
        setSeconds(60);
        setCanResend(false);
        setOtp(["", "", "", ""]);
        otpRefs[0].current?.focus();
        Alert.alert("Code Sent", `A new OTP code has been sent to ${phoneNumber || "your number"}.`);
    };

    const handleSave = () => {
        const fullOtp = otp.join("");
        const fullNewPin = newPin.join("");
        const fullConfirmPin = confirmPin.join("");

        if (!phoneNumber) {
            Alert.alert("Missing Field", "Please enter your phone number.");
            return;
        }

        if (fullOtp.length < 4) {
            Alert.alert("Incomplete Code", "Please enter the complete 4-digit verification code.");
            return;
        }

        if (fullNewPin.length < 4) {
            Alert.alert("Incomplete PIN", "Please enter a 4-digit new PIN.");
            return;
        }

        if (fullConfirmPin.length < 4) {
            Alert.alert("Incomplete Confirmation", "Please confirm your new 4-digit PIN.");
            return;
        }

        if (fullNewPin !== fullConfirmPin) {
            Alert.alert("PIN Mismatch", "The New PIN and Confirm PIN do not match. Please try again.");
            return;
        }

        Alert.alert("Success", "Your PIN has been successfully reset!", [
            {
                text: "OK",
                onPress: () => {
                    resetForm();
                    router.back();
                },
            },
        ]);
    };

    const isTablet = screenWidth > 600;
    const cardMaxWidth = isTablet ? 500 : "100%";
    const pinBoxHeight = screenHeight < 700 ? 46 : 54;

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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.brandingHeaderContainer}>
                        <View style={styles.outerCircle}>
                            <Ionicons name="key-outline" size={28} color="#FFF" />
                        </View>
                        <Text style={styles.brandTitleText}>Reset PIN</Text>
                        <Text style={styles.subTitleText}>Choose a new PIN to regain access</Text>
                    </View>

                    <View
                        style={[
                            styles.whitePanelCard,
                            {
                                maxWidth: cardMaxWidth,
                                borderTopLeftRadius: 32,
                                borderTopRightRadius: 32,
                                borderBottomLeftRadius: isTablet ? 32 : 0,
                                borderBottomRightRadius: isTablet ? 32 : 0,
                            },
                        ]}
                    >
                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <View style={styles.phoneInputRow}>
                            <Ionicons name="call-outline" size={19} color="#333" style={styles.phoneIcon} />
                            <TextInput
                                style={styles.phoneTextInput}
                                value={formatPhone(phoneNumber)}
                                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ""))}
                                keyboardType="phone-pad"
                                placeholder="Enter your phone number"
                                placeholderTextColor="#999"
                                maxLength={12}
                            />
                        </View>

                        <Text style={styles.fieldLabel}>Verification Code</Text>
                        <View style={styles.pinInputsGroupRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={`otp-${index}`}
                                    ref={otpRefs[index]}
                                    style={[styles.singlePinBox, { height: pinBoxHeight }]}
                                    value={digit}
                                    onChangeText={(text) =>
                                        handlePinChange(text, index, otp, setOtp, otpRefs)
                                    }
                                    onKeyPress={(e) => handleKeyPress(e, index, otp, otpRefs)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                                    <Text style={styles.resendBtnText}>Didn't get code? Resend Code</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.resendText}>
                                    Resend Code in <Text style={styles.timerHighlight}>{seconds}s</Text>
                                </Text>
                            )}
                        </View>

                        <Text style={styles.fieldLabel}>New PIN</Text>
                        <View style={styles.pinInputsGroupRow}>
                            {newPin.map((digit, index) => (
                                <TextInput
                                    key={`new-${index}`}
                                    ref={newPinRefs[index]}
                                    style={[styles.singlePinBox, { height: pinBoxHeight }]}
                                    value={digit}
                                    onChangeText={(text) =>
                                        handlePinChange(text, index, newPin, setNewPin, newPinRefs)
                                    }
                                    onKeyPress={(e) => handleKeyPress(e, index, newPin, newPinRefs)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    secureTextEntry
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Confirm New PIN</Text>
                        <View style={styles.pinInputsGroupRow}>
                            {confirmPin.map((digit, index) => (
                                <TextInput
                                    key={`confirm-${index}`}
                                    ref={confirmPinRefs[index]}
                                    style={[styles.singlePinBox, { height: pinBoxHeight }]}
                                    value={digit}
                                    onChangeText={(text) =>
                                        handlePinChange(
                                            text,
                                            index,
                                            confirmPin,
                                            setConfirmPin,
                                            confirmPinRefs
                                        )
                                    }
                                    onKeyPress={(e) =>
                                        handleKeyPress(e, index, confirmPin, confirmPinRefs)
                                    }
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    secureTextEntry
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <View style={styles.actionButtonGroup}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.cancelButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.saveButton}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#204A46",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "space-between",
    },
    brandingHeaderContainer: {
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
    },
    outerCircle: {
        width: 80,
        height: 80,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.4)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    brandTitleText: {
        color: "#FFF",
        fontSize: 22,
        fontWeight: "700",
    },
    subTitleText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 13,
        fontWeight: "400",
        marginTop: 3,
    },
    whitePanelCard: {
        flex: 1,
        width: "100%",
        backgroundColor: "#F7F9F8",
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: Platform.OS === 'web' ? 24 : 30,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1C1C1C",
        marginBottom: 8,
    },
    phoneInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5EBEA",
        borderRadius: 15,
        height: 48,
        paddingHorizontal: 15,
        marginBottom: 12,
    },
    phoneIcon: {
        marginRight: 10,
    },
    phoneTextInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#000",
    },
    pinInputsGroupRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 8,
    },
    singlePinBox: {
        flex: 1,
        backgroundColor: "#FFF",
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        borderWidth: 1,
        borderColor: "#e2edeb",
        paddingVertical: 0,
        borderRadius: 12,
    },
    resendContainer: {
        alignItems: "center",
        marginVertical: 4,
        marginBottom: 10,
    },
    resendText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1d1b1b",
    },
    timerHighlight: {
        fontWeight: "700",
        color: "#2C5E5A",
    },
    resendButton: {
        paddingVertical: 2,
    },
    resendBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2C5E5A",
        textDecorationLine: "underline",
    },
    actionButtonGroup: {
        flexDirection: "row",
        gap: 14,
        marginTop: 18,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D0DCDA",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#1C1C1C",
        fontSize: 15,
        fontWeight: "700",
    },
    saveButton: {
        flex: 1,
        height: 48,
        borderRadius: 15,
        backgroundColor: "#204A46",
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "700",
    },
});

export default ResetPin;