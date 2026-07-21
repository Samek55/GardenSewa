import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";
import { NP } from "react-native-country-flag-icons";

const AdminLogin = () => {
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState(["", "", "", ""]);
    const [showPin, setShowPin] = useState(false);
    
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const handlePinChange = (text, index) => {
        const newPin = [...pin];
        newPin[index] = text;
        setPin(newPin);

        if (text.length === 1 && index < 3) {
            pinRefs[index + 1].current.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
            pinRefs[index - 1].current.focus();
        }
    };

    const isTablet = screenWidth > 600;
    const cardMaxWidth = isTablet ? 500 : "100%";
    const dynamicPadding = screenHeight < 700 ? 16 : 32;

    return (
        <SafeAreaView style={styles.container}>
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
                            <NP  width={26} height={18} style={styles.nepalFlag} />
                            <TextInput
                                style={styles.phoneTextInput}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder="Enter your phone number"
                                placeholderTextColor="#999"
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
                                    style={[styles.singlePinBox, { height: screenHeight < 700 ? 46 : 54 }]}
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

                        <TouchableOpacity activeOpacity={0.8} style={styles.loginSubmitButton}>
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>

                        <View style={[styles.horizontalDivider, { marginVertical: screenHeight * 0.03 }]} />

                        <View style={styles.panelFooterActionContainer}>
                            <TouchableOpacity style={styles.footerLinkAction} onPress={()=>router.push('./joinasaprofessional')}>
                                <Text style={styles.professionalJoinText}>Join as Professional : Join Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.footerLinkAction}>
                                <Text style={styles.resetPinText}>Reset PIN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    nepalFlag: {
        marginRight: 14,
    },
    phoneTextInput: {
        flex: 1,
        fontSize: 14,
        color: "#000",
        fontWeight: "400",
        paddingVertical:    0,
        height:'80%'
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
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 12,
    },
    singlePinBox: {
        flex: 1,
        backgroundColor: "#FFF",
        // borderRadius: 14,
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        borderWidth: 1,
        borderColor: "#e2edeb",
        paddingVertical: 0,
    },
    loginSubmitButton: {
        backgroundColor: "#2C5E5A",
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
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
        marginTop: 'auto',
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