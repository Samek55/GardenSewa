import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useRef, useState } from "react";
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
    View
} from "react-native";
import { NP } from "react-native-country-flag-icons";

import { adminLogin as adminLoginRequest } from "../../api/PostApiAdmin";
import { AdminAuthContext } from "../../context/AdminAuthContext";

const AdminLogin = () => {
    const [rawPhone, setRawPhone] = useState("");
    const [pin, setPin] = useState(["", "", "", ""]);
    const [showPin, setShowPin] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const { adminLoginSuccess } = useContext(AdminAuthContext);

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const formatPhone = (text) => {
        const digitsOnly = (text || "").replace(/[^0-9]/g, "");
        if (digitsOnly.length === 10) {
            return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 10)}`;
        }
        return text;
    };

    const handlePhoneChange = (text) => {
        const digitsOnly = text.replace(/[^0-9]/g, "").slice(0, 10);
        setRawPhone(digitsOnly);
        if (digitsOnly.length === 10) {
            pinRefs[0].current?.focus();
        }
    };

    const handlePinChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        const newPin = [...pin];
        newPin[index] = cleaned.slice(-1);
        setPin(newPin);

        if (cleaned.length > 0 && index < 3) {
            pinRefs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
            pinRefs[index - 1].current?.focus();
        }
    };

    const handleLogin = async () => {
        const fullPin = pin.join("");

        if (!rawPhone || rawPhone.length < 10) {
            Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }

        if (fullPin.length < 4) {
            Alert.alert("Invalid PIN", "Please enter your complete 4-digit PIN.");
            return;
        }

        setIsLoggingIn(true);
        try {
            const result = await adminLoginRequest(rawPhone, fullPin);

            if (!result.success) {
                Alert.alert(
                    "Access Denied",
                    result.message || "Invalid phone number or PIN. Please check your credentials and try again."
                );
                return;
            }

            await adminLoginSuccess({
                sessionToken: result.sessionToken,
                role: result.role,
                displayName: result.displayName,
                phone: rawPhone,
            });

            router.replace("/(admin)/gardenerApplications");
        } catch (error) {
            Alert.alert("Login Failed", error.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleResetPinPress = () => {
        router.push({
            pathname: '/resetPin',
            params: { phone: rawPhone },
        });
    };

    const isTablet = screenWidth > 600;
    const cardMaxWidth = isTablet ? 500 : "100%";
    const dynamicPadding = screenHeight < 700 ? 16 : 32;

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContainer,
                        { alignItems: isTablet ? 'center' : 'stretch' }
                    ]}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.brandingHeaderContainer, {
                        paddingTop: screenHeight * 0.04,
                        paddingBottom: screenHeight * 0.03
                    }]}>
                        <View style={styles.outerLockCircle}>
                            <View style={styles.innerLockCircle}>
                                <Ionicons name="lock-closed" size={38} color="#FFD54F" />
                            </View>
                        </View>
                        <Text style={styles.brandTitleText}>Garden Sewa</Text>
                        <Text style={styles.adminLoginText}>ADMIN LOGIN</Text>
                    </View>

                    <View style={[
                        styles.whitePanelCard,
                        {
                            maxWidth: cardMaxWidth,
                            paddingHorizontal: dynamicPadding,
                            paddingTop: dynamicPadding,
                            borderTopLeftRadius: isTablet ? 36 : 36,
                            borderTopRightRadius: isTablet ? 36 : 36,
                            borderBottomLeftRadius: isTablet ? 36 : 0,
                            borderBottomRightRadius: isTablet ? 36 : 0,
                            marginBottom: isTablet ? 40 : 0
                        }
                    ]}>
                        <Text style={styles.signInTitle}>Sign In</Text>

                        <View style={styles.phoneInputRow}>
                            <View style={styles.iconWrapper}>
                                <NP width={30} height={30} />
                            </View>
                            <TextInput
                                style={styles.phoneTextInput}
                                value={formatPhone(rawPhone)}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                placeholder="Enter your phone number"
                                placeholderTextColor="#999"
                                maxLength={12}
                            />
                        </View>

                        <View style={[styles.pinHeaderContainer, { marginTop: screenHeight * 0.025 }]}>
                            <Text style={styles.pinLabel}>PIN</Text>
                            <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                                <Ionicons
                                    name={showPin ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#333"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pinInputsGroupRow}>
                            {pin.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={pinRefs[index]}
                                    style={styles.singlePinBox}
                                    value={digit}
                                    onChangeText={(text) => handlePinChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    secureTextEntry={!showPin}
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <View style={{ width: '100%', alignItems: "center" }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.loginSubmitButton}
                                onPress={handleLogin}
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Login</Text>
                                )}
                            </TouchableOpacity>
                        </View>


                        <View style={[styles.horizontalDivider, { marginVertical: screenHeight * 0.03 }]} />

                        <View style={styles.panelFooterActionContainer}>
                            <TouchableOpacity
                                style={styles.footerLinkAction}
                                onPress={() => router.push('/joinasaprofessional')}
                            >
                                <Text style={styles.professionalJoinText}>Join as Professional : Join Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.footerLinkAction}
                                onPress={handleResetPinPress}
                            >
                                <Text style={styles.resetPinText}>Reset PIN</Text>
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
        backgroundColor: "#235A55",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    brandingHeaderContainer: {
        alignItems: "center",
        width: '100%',
    },
    outerLockCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    innerLockCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#E57373",
        justifyContent: "center",
        alignItems: "center",
    },
    brandTitleText: {
        color: "#FFF",
        fontSize: 26,
        fontWeight: "600",
        marginTop: 10,
    },
    adminLoginText: {
        color: "#BCE5E1",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.5,
        marginTop: 4,
    },
    whitePanelCard: {
        flex: 1,
        width: '100%',
        backgroundColor: "#F7FAFA",
        paddingBottom: 28,
    },
    signInTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#000",
        marginBottom: 16,
    },
    phoneInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#D2E3E1",
        borderRadius: 14,
        height: 50,
        paddingHorizontal: 16,
    },
    iconWrapper: {
        paddingRight: 8,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        height: '60%',
        justifyContent: 'center',
        marginRight: 10,
    },
    nepalFlag: {
        marginRight: 4,
    },
    phoneTextInput: {
        flex: 1,
        fontSize: 14,
        color: "#000",
        fontWeight: "400",
        paddingVertical: 0,
        height: '80%',
        marginLeft: 4
    },
    pinHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    pinLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#000",
    },
    pinInputsGroupRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginBottom: 24,
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
        borderRadius: 10,
        paddingVertical: 0,
    },
    loginSubmitButton: {
        backgroundColor: "#2C5E5A",
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        width: '60%'
    },
    loginButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    horizontalDivider: {
        height: 1,
        backgroundColor: "#E4ECEB",
    },
    panelFooterActionContainer: {
        alignItems: "center",
        gap: 14,
    },
    footerLinkAction: {
        paddingVertical: 2,
    },
    professionalJoinText: {
        color: "#000",
        fontSize: 14,
        fontWeight: "700",
    },
    resetPinText: {
        color: "#000",
        fontSize: 14,
        fontWeight: "700",
    },
});

export default AdminLogin;