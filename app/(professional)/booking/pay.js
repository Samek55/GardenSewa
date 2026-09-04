import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { submitLeadUnlockProof } from '../../../api/PostApiBookingGardener';
import { uploadPublicFile } from '../../../api/uploadToStorage';

// Same static QR every gardener pays into — SRIYOG Consulting collects
// lead-unlock fees the same way for GardenSewa as it does for HomeSewa,
// confirmed rather than assumed. No payment gateway involved; a human
// reviews the screenshot on the admin side (see approve-lead-unlock).
const SRIYOG_PAYMENT_URL = 'https://sriyog.com/payment';
const LEAD_FEE_NPR = 100;

const Pay = () => {
    const { bookingId, fullName } = useLocalSearchParams();
    const [proof, setProof] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handlePickProof = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });
        if (!result.canceled) {
            setProof(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!proof) {
            Alert.alert('Screenshot Required', 'Please upload a screenshot of your payment before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            const proofUrl = await uploadPublicFile(proof.uri, proof.fileName);
            const result = await submitLeadUnlockProof(bookingId, proofUrl);
            if (!result.success) {
                Alert.alert('Could Not Submit', result.message || 'Please try again.');
                return;
            }
            Alert.alert(
                'Proof Submitted',
                'An admin will review your payment shortly. You\'ll be able to see the customer\'s contact details once approved.',
                [{ text: 'OK', onPress: () => router.replace(`/booking/${bookingId}`) }]
            );
        } catch (error) {
            Alert.alert('Could Not Submit', error.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#1E293B" />
                </TouchableOpacity>

                <Text style={styles.title}>Pay to View Contact</Text>
                <Text style={styles.subtitle}>
                    Scan and pay via SRIYOG Consulting to unlock {fullName ? `${fullName}'s` : "this customer's"} contact details
                </Text>

                <View style={styles.qrCard}>
                    <QRCode value={SRIYOG_PAYMENT_URL} size={200} />
                </View>

                <Text style={styles.feeText}>Lead Fee: NPR {LEAD_FEE_NPR}</Text>

                <TouchableOpacity style={styles.proofPicker} onPress={handlePickProof}>
                    {proof ? (
                        <Image source={{ uri: proof.uri }} style={styles.proofPreview} resizeMode="cover" />
                    ) : (
                        <>
                            <Ionicons name="camera-outline" size={28} color="#245d5a" />
                            <Text style={styles.proofPickerText}>Upload Payment Screenshot</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit for Review</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60 },
    backButton: { position: 'absolute', top: 50, left: 16, padding: 4 },
    title: { fontSize: 20, fontWeight: '700', color: '#1A202C', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#718096', textAlign: 'center', marginBottom: 20 },
    qrCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, marginBottom: 12 },
    feeText: { fontSize: 16, fontWeight: '700', color: '#245d5a', marginBottom: 24 },
    proofPicker: { width: '100%', minHeight: 120, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#245d5a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
    proofPickerText: { color: '#245d5a', fontWeight: '600', marginTop: 8 },
    proofPreview: { width: '100%', height: 160 },
    submitBtn: { backgroundColor: '#245d5a', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', elevation: 2 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default Pay;
