import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { resetPin as resetPinRequest, sendOtp } from "../../api/PostApiOtp";

const ResetPin = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const phoneParam = Array.isArray(params.phone) ? params.phone[0] : params.phone;

    // Default flow starts at step 2
    const [step, setStep] = useState(2);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [newPin, setNewPin] = useState(["", "", "", ""]);
    const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);

    const [seconds, setSeconds] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
    const [focusedNewPinIndex, setFocusedNewPinIndex] = useState(null);
    const [focusedConfirmPinIndex, setFocusedConfirmPinIndex] = useState(null);

    const [isSending, setIsSending] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { width: screenWidth } = useWindowDimensions();

    const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const newPinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const confirmPinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    useFocusEffect(
        useCallback(() => {
            setStep(2);
            setSeconds(60);
            setCanResend(false);
            setOtp(["", "", "", ""]);
            setNewPin(["", "", "", ""]);
            setConfirmPin(["", "", "", ""]);
        }, [])
    );

    // Fires the real OTP the moment the phone number is known — resetPin.js was
    // previously entirely disconnected from any backend: this screen never sent
    // a code, never verified one, and "Save" just showed a fake success alert
    // with nothing written to the database.
    useEffect(() => {
        if (!phoneParam) return;
        const rawDigits = String(phoneParam).replace(/[^0-9]/g, "").slice(0, 10);
        setPhoneNumber(rawDigits);
        if (rawDigits.length !== 10) return;

        (async () => {
            setIsSending(true);
            try {
                const result = await sendOtp(rawDigits, "pin-reset");
                if (!result.success) {
                    Alert.alert("Could Not Send Code", result.message || "Please try again.");
                }
            } catch (error) {
                Alert.alert("Could Not Send Code", error.message || "Something went wrong.");
            } finally {
                setIsSending(false);
            }
        })();
    }, [phoneParam]);

    useEffect(() => {
        let timer = null;
        if (step === 2 && !canResend && seconds > 0) {
            timer = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            setCanResend(true);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [seconds, canResend, step]);

    const resetForm = () => {
        setPhoneNumber("");
        setOtp(["", "", "", ""]);
        setNewPin(["", "", "", ""]);
        setConfirmPin(["", "", "", ""]);
        setStep(2);
    };

    const handlePinChange = (text, index, stateArray, setStateArray, refs, nextGroupRef = null) => {
        const cleanedText = text.replace(/[^0-9]/g, "");

        if (cleanedText.length === 4) {
            const newArr = cleanedText.split("");
            setStateArray(newArr);
            refs[3].current?.focus();
            return;
        }

        const updated = [...stateArray];
        updated[index] = cleanedText.slice(-1);
        setStateArray(updated);

        if (cleanedText.length > 0) {
            if (index < 3) {
                refs[index + 1].current?.focus();
            } else if (nextGroupRef && nextGroupRef[0]?.current) {
                nextGroupRef[0].current.focus();
            }
        }
    };

    const handleKeyPress = (e, index, stateArray, refs) => {
        if (e.nativeEvent.key === "Backspace") {
            if (stateArray[index] === "" && index > 0) {
                refs[index - 1].current?.focus();
            }
        }
    };

    const handleResend = async () => {
        if (!canResend || isSending || !phoneNumber) return;
        setIsSending(true);
        try {
            const result = await sendOtp(phoneNumber, "pin-reset");
            if (!result.success) {
                Alert.alert("Could Not Resend", result.message || "Please try again.");
                return;
            }
            setSeconds(60);
            setCanResend(false);
            setOtp(["", "", "", ""]);
            otpRefs[0].current?.focus();
            Alert.alert("Code Sent", `A new OTP code has been sent to ${phoneNumber}.`);
        } catch (error) {
            Alert.alert("Could Not Resend", error.message || "Something went wrong.");
        } finally {
            setIsSending(false);
        }
    };

    // Step 2 -> Step 3
    const handleOtpNext = () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < 4) {
            Alert.alert("Incomplete Code", "Please enter the complete 4-digit verification code.");
            return;
        }
        setStep(3);
    };

    // Step 3 submission — verification and the actual write both happen here,
    // in one call to reset-pin, the same way HomeSewa's set-pin checks the OTP
    // and writes the new PIN together rather than as two separate steps.
    const handleSave = async () => {
        const fullNewPin = newPin.join("");
        const fullConfirmPin = confirmPin.join("");
        const fullOtp = otp.join("");

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

        if (isSaving) return;
        setIsSaving(true);
        try {
            const result = await resetPinRequest(phoneNumber, fullOtp, fullNewPin);
            if (!result.success) {
                Alert.alert("Could Not Reset PIN", result.message || "Please try again.");
                // A wrong/expired code means step 3's OTP is stale — send them
                // back to re-enter it rather than letting them keep retrying
                // step 3 with a code that will never succeed.
                setStep(2);
                setOtp(["", "", "", ""]);
                return;
            }

            Alert.alert("Success", "Your PIN has been successfully reset! Please log in with your new PIN.", [
                {
                    text: "OK",
                    onPress: () => {
                        resetForm();
                        router.replace("/adminLogin");
                    },
                },
            ]);
        } catch (error) {
            Alert.alert("Could Not Reset PIN", error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackOrCancel = () => {
        if (step > 2) {
            setStep((prev) => prev - 1);
        } else {
            resetForm();
            router.back();
        }
    };

    const isTablet = screenWidth > 600;
    const cardMaxWidth = isTablet ? 480 : "100%";

    const getHeaderTitle = () => {
        if (step === 2) return "Verification";
        return "Set New PIN";
    };

    const getHeaderSubtitle = () => {
        if (step === 2) return "Enter the 4-digit code sent to your phone number.";
        return "Choose and confirm your new 4-digit security PIN.";
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
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
                    <View style={[styles.mainWrapper, { maxWidth: cardMaxWidth }]}>
                        {/* HEADER SECTION */}
                        <View style={styles.headerSection}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="build-outline" size={26} color="#FFFFFF" />
                            </View>
                            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
                            <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
                        </View>

                        {/* FORM CARD SECTION */}
                        <View style={styles.formCard}>
                            {step === 2 && (
                                <View style={styles.stepContent}>
                                    <Text style={styles.fieldLabel}>Verification Code</Text>
                                    <View style={styles.pinInputsGroupRow}>
                                        {otp.map((digit, index) => {
                                            const isFocused = focusedOtpIndex === index;
                                            const isFilled = digit.length > 0;
                                            return (
                                                <TextInput
                                                    key={`otp-${index}`}
                                                    ref={otpRefs[index]}
                                                    style={[
                                                        styles.singlePinBox,
                                                        isFilled && styles.filledPinBox,
                                                        isFocused && styles.focusedPinBox,
                                                    ]}
                                                    value={digit}
                                                    onChangeText={(text) =>
                                                        handlePinChange(text, index, otp, setOtp, otpRefs)
                                                    }
                                                    onKeyPress={(e) =>
                                                        handleKeyPress(e, index, otp, otpRefs)
                                                    }
                                                    onFocus={() => setFocusedOtpIndex(index)}
                                                    onBlur={() => setFocusedOtpIndex(null)}
                                                    keyboardType="number-pad"
                                                    maxLength={1}
                                                    textAlign="center"
                                                />
                                            );
                                        })}
                                    </View>

                                    <View style={styles.resendContainer}>
                                        {canResend ? (
                                            <TouchableOpacity onPress={handleResend} activeOpacity={0.7} disabled={isSending}>
                                                <Text style={styles.resendBtnText}>
                                                    {isSending ? "Sending..." : (
                                                        <>
                                                            Didn't get code?{" "}
                                                            <Text style={styles.resendBtnBold}>Resend Code</Text>
                                                        </>
                                                    )}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.resendText}>
                                                Resend code in{" "}
                                                <Text style={styles.timerHighlight}>{seconds}s</Text>
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.actionButtonGroup}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.cancelButton}
                                            onPress={handleBackOrCancel}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={styles.brandButton}
                                            onPress={handleOtpNext}
                                        >
                                            <Text style={styles.brandButtonText}>Next</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {step === 3 && (
                                <View style={styles.stepContent}>
                                    <Text style={styles.fieldLabel}>New PIN</Text>
                                    <View style={styles.pinInputsGroupRow}>
                                        {newPin.map((digit, index) => {
                                            const isFocused = focusedNewPinIndex === index;
                                            const isFilled = digit.length > 0;
                                            return (
                                                <TextInput
                                                    key={`new-${index}`}
                                                    ref={newPinRefs[index]}
                                                    style={[
                                                        styles.singlePinBox,
                                                        isFilled && styles.filledPinBox,
                                                        isFocused && styles.focusedPinBox,
                                                    ]}
                                                    value={digit}
                                                    onChangeText={(text) =>
                                                        handlePinChange(
                                                            text,
                                                            index,
                                                            newPin,
                                                            setNewPin,
                                                            newPinRefs,
                                                            confirmPinRefs
                                                        )
                                                    }
                                                    onKeyPress={(e) =>
                                                        handleKeyPress(e, index, newPin, newPinRefs)
                                                    }
                                                    onFocus={() => setFocusedNewPinIndex(index)}
                                                    onBlur={() => setFocusedNewPinIndex(null)}
                                                    keyboardType="number-pad"
                                                    maxLength={1}
                                                    secureTextEntry
                                                    textAlign="center"
                                                />
                                            );
                                        })}
                                    </View>

                                    <Text style={styles.fieldLabel}>Confirm New PIN</Text>
                                    <View style={styles.pinInputsGroupRow}>
                                        {confirmPin.map((digit, index) => {
                                            const isFocused = focusedConfirmPinIndex === index;
                                            const isFilled = digit.length > 0;
                                            return (
                                                <TextInput
                                                    key={`confirm-${index}`}
                                                    ref={confirmPinRefs[index]}
                                                    style={[
                                                        styles.singlePinBox,
                                                        isFilled && styles.filledPinBox,
                                                        isFocused && styles.focusedPinBox,
                                                    ]}
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
                                                        handleKeyPress(
                                                            e,
                                                            index,
                                                            confirmPin,
                                                            confirmPinRefs
                                                        )
                                                    }
                                                    onFocus={() => setFocusedConfirmPinIndex(index)}
                                                    onBlur={() => setFocusedConfirmPinIndex(null)}
                                                    keyboardType="number-pad"
                                                    maxLength={1}
                                                    secureTextEntry
                                                    textAlign="center"
                                                />
                                            );
                                        })}
                                    </View>

                                    <View style={styles.actionButtonGroup}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={styles.cancelButton}
                                            onPress={handleBackOrCancel}
                                        >
                                            <Text style={styles.cancelButtonText}>Back</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={styles.brandButton}
                                            onPress={handleSave}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.brandButtonText}>Save</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
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
        backgroundColor: "#245d5a",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    mainWrapper: {
        width: "100%",
    },
    headerSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.35)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: "400",
        color: "rgba(255, 255, 255, 0.85)",
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    formCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 28,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    stepContent: {
        flexDirection: "column",
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#384745",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 10,
        marginTop: 4,
    },
    pinInputsGroupRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginBottom: 20,
    },
    singlePinBox: {
        width: 46,
        height: 54,
        backgroundColor: "#FFFFFF",
        fontSize: 20,
        fontWeight: "600",
        color: "#000000",
        borderWidth: 1.5,
        borderColor: "#C5CEE0",
        borderRadius: 10,
        paddingVertical: 0,
    },
    filledPinBox: {
        borderColor: "#1A3B34",
    },
    focusedPinBox: {
        borderColor: "#204A46",
        borderWidth: 2,
    },
    resendContainer: {
        alignItems: "center",
        marginVertical: 4,
        marginBottom: 20,
    },
    resendText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7C79",
    },
    timerHighlight: {
        fontWeight: "700",
        color: "#204A46",
    },
    resendBtnText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7C79",
    },
    resendBtnBold: {
        fontWeight: "700",
        color: "#204A46",
        textDecorationLine: "underline",
    },
    actionButtonGroup: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#E2E8E7",
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#384745",
        fontSize: 15,
        fontWeight: "600",
    },
    brandButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#204A46",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#204A46",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    brandButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});

export default ResetPin;