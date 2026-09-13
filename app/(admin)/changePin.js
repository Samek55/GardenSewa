import { changePin } from '@/api/PostApiAdmin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const emptyPin = () => ['', '', '', ''];

function PinBoxes({ value, onChange, secure, colors, styles }) {
    const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const handleChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const next = [...value];
        next[index] = cleaned.slice(-1);
        onChange(next);
        if (cleaned.length > 0 && index < 3) refs[index + 1].current?.focus();
    };
    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && value[index] === '' && index > 0) refs[index - 1].current?.focus();
    };
    return (
        <View style={styles.pinRow}>
            {value.map((digit, index) => (
                <TextInput
                    key={index}
                    ref={refs[index]}
                    style={styles.pinBox}
                    value={digit}
                    onChangeText={(t) => handleChange(t, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry={secure}
                    textAlign="center"
                />
            ))}
        </View>
    );
}

export default function ChangePin() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(colors, insets.top);

    const [currentPin, setCurrentPin] = useState(emptyPin());
    const [newPin, setNewPin] = useState(emptyPin());
    const [confirmPin, setConfirmPin] = useState(emptyPin());
    const [showPins, setShowPins] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const current = currentPin.join('');
        const next = newPin.join('');
        const confirm = confirmPin.join('');

        if (current.length < 4) return Alert.alert('Invalid PIN', 'Please enter your current 4-digit PIN.');
        if (next.length < 4) return Alert.alert('Invalid PIN', 'Please enter a new 4-digit PIN.');
        if (next !== confirm) return Alert.alert('PINs Don’t Match', 'New PIN and confirmation do not match.');

        setSaving(true);
        try {
            const result = await changePin(current, next);
            if (!result.success) {
                Alert.alert('Could Not Change PIN', result.message || 'Please try again.');
                return;
            }
            Alert.alert('PIN Updated', 'Your PIN has been changed successfully.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.hero}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.iconCircle}>
                        <Ionicons name="key-outline" size={30} color="#fff" />
                    </View>
                    <Text style={styles.heroTitle}>Change PIN</Text>
                    <Text style={styles.heroSubtitle}>Update your 4-digit login PIN</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.fieldHeaderRow}>
                        <Text style={styles.label}>Current PIN</Text>
                        <TouchableOpacity onPress={() => setShowPins((v) => !v)}>
                            <Ionicons name={showPins ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <PinBoxes value={currentPin} onChange={setCurrentPin} secure={!showPins} colors={colors} styles={styles} />

                    <TouchableOpacity onPress={() => router.push('/resetPin')}>
                        <Text style={styles.forgotLink}>Forgot your PIN? <Text style={styles.forgotLinkBold}>Reset via OTP</Text></Text>
                    </TouchableOpacity>

                    <Text style={[styles.label, { marginTop: 20 }]}>New PIN</Text>
                    <PinBoxes value={newPin} onChange={setNewPin} secure={!showPins} colors={colors} styles={styles} />

                    <Text style={[styles.label, { marginTop: 20 }]}>Confirm New PIN</Text>
                    <PinBoxes value={confirmPin} onChange={setConfirmPin} secure={!showPins} colors={colors} styles={styles} />

                    <View style={styles.buttonsRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors, topInset) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.brand },
    hero: { alignItems: 'center', paddingTop: topInset + 24, paddingBottom: 32 },
    backButton: { position: 'absolute', top: topInset + 20, left: 16 },
    iconCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
    heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
    card: {
        flex: 1, backgroundColor: colors.background,
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 24, paddingTop: 28,
    },
    fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    pinRow: { flexDirection: 'row', gap: 14, marginTop: 14, marginBottom: 12 },
    pinBox: {
        width: 54, height: 58, borderRadius: 12,
        backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
        fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    },
    forgotLink: { fontSize: 13, color: colors.textSecondary },
    forgotLinkBold: { color: colors.brand, fontWeight: '700' },
    buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
    cancelButton: {
        flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    cancelButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
    saveButton: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
