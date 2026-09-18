import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { initiateLeadPayment, verifyLeadPayment } from '../../../api/PostApiKhalti';

const LEAD_FEE_NPR = 100;
const VERIFY_MAX_ATTEMPTS = 5;
const VERIFY_RETRY_DELAY_MS = 2500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Pay = () => {
    const { bookingId, fullName } = useLocalSearchParams();
    // 'idle' | 'paying' | 'verifying' | 'failed'
    const [stage, setStage] = useState('idle');

    const goToUnlockedBooking = () => {
        Alert.alert(
            'Payment Verified',
            "You can now view the customer's contact details.",
            [{ text: 'OK', onPress: () => router.replace(`/booking/${bookingId}`) }]
        );
    };

    const handleVerify = async () => {
        setStage('verifying');
        try {
            for (let attempt = 0; attempt < VERIFY_MAX_ATTEMPTS; attempt++) {
                const result = await verifyLeadPayment(bookingId);
                if (result.success && result.status === 'Completed') {
                    goToUnlockedBooking();
                    return;
                }
                if (result.status !== 'Pending') {
                    Alert.alert('Payment Not Completed', result.message || 'Please try again.');
                    setStage('failed');
                    return;
                }
                if (attempt < VERIFY_MAX_ATTEMPTS - 1) await sleep(VERIFY_RETRY_DELAY_MS);
            }
            // Still Pending after all attempts — let the gardener check again manually.
            Alert.alert('Still Processing', "Khalti hasn't confirmed this payment yet. Please check again shortly.");
            setStage('failed');
        } catch (error) {
            Alert.alert('Could Not Verify', error.message || 'Please try again.');
            setStage('failed');
        }
    };

    const handlePay = async () => {
        setStage('paying');
        try {
            const returnUrl = Linking.createURL('booking/pay');
            const result = await initiateLeadPayment(bookingId, returnUrl);

            if (!result.success) {
                Alert.alert('Could Not Start Payment', result.message || 'Please try again.');
                setStage('failed');
                return;
            }
            if (result.alreadyUnlocked) {
                goToUnlockedBooking();
                return;
            }

            // Regardless of how the browser session ends (completed, cancelled,
            // or dismissed), the redirect URL is never trusted as proof of
            // payment — verify-lead-payment always re-checks with Khalti
            // server-side before anything unlocks.
            await WebBrowser.openAuthSessionAsync(result.paymentUrl, returnUrl);
            await handleVerify();
        } catch (error) {
            Alert.alert('Could Not Start Payment', error.message || 'Please try again.');
            setStage('failed');
        }
    };

    if (stage === 'verifying') {
        return (
            <View style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color="#245d5a" />
                <Text style={styles.verifyingText}>Verifying payment…</Text>
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#1E293B" />
                </TouchableOpacity>

                <Ionicons name="lock-open-outline" size={48} color="#245d5a" style={styles.headerIcon} />
                <Text style={styles.title}>Pay to View Contact</Text>
                <Text style={styles.subtitle}>
                    Pay via Khalti to unlock {fullName ? `${fullName}'s` : "this customer's"} contact details
                </Text>

                <Text style={styles.feeText}>Lead Fee: NPR {LEAD_FEE_NPR}</Text>

                <TouchableOpacity
                    style={[styles.submitBtn, stage === 'paying' && styles.submitBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handlePay}
                    disabled={stage === 'paying'}
                >
                    {stage === 'paying' ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>
                            {stage === 'failed' ? 'Try Again' : 'Pay with Khalti'}
                        </Text>
                    )}
                </TouchableOpacity>

                {stage === 'failed' && (
                    <TouchableOpacity style={styles.checkAgainBtn} onPress={handleVerify}>
                        <Text style={styles.checkAgainText}>Already Paid? Check Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    centered: { alignItems: 'center', justifyContent: 'center' },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
    backButton: { position: 'absolute', top: 50, left: 16, padding: 4 },
    headerIcon: { marginBottom: 12 },
    title: { fontSize: 20, fontWeight: '700', color: '#1A202C', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#718096', textAlign: 'center', marginBottom: 20 },
    feeText: { fontSize: 16, fontWeight: '700', color: '#245d5a', marginBottom: 32 },
    submitBtn: { backgroundColor: '#245d5a', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', elevation: 2 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    checkAgainBtn: { marginTop: 16, padding: 8 },
    checkAgainText: { color: '#245d5a', fontWeight: '600', fontSize: 14 },
    verifyingText: { marginTop: 16, fontSize: 15, color: '#245d5a', fontWeight: '600' },
});

export default Pay;
