import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Pay = () => {
    const { bookingId, fullName } = useLocalSearchParams();

    const handlePayment = () => {
        router.dismissTo({
            pathname: `/booking/${bookingId}`,
            params: {
                fullName: fullName,
                updatedStatus: 'OnGoing',
                shouldEditSchedule: 'true',
            },
        });
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.khaltiRow}>
                    <View style={styles.khaltiBox}>
                        <Text style={styles.khaltiKText}>K</Text>
                    </View>
                    <Text style={styles.khaltiBrandText}>khalti</Text>
                </View>

                <Text style={styles.regularPriceText}>Regular Price NPR 100</Text>
                <Text style={styles.finalAmountText}>NPR 99</Text>
                <Text style={styles.subtitleText}>Pay to view contact</Text>

                <TouchableOpacity
                    style={styles.payNowBtn}
                    activeOpacity={0.85}
                    onPress={handlePayment}
                >
                    <Text style={styles.payNowBtnText}>Pay Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    khaltiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    khaltiBox: { backgroundColor: '#5C2D91', width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    khaltiKText: { color: '#FFFFFF', fontWeight: '900', fontSize: 24, fontStyle: 'italic' },
    khaltiBrandText: { color: '#5C2D91', fontWeight: '800', fontSize: 26 },
    regularPriceText: { fontSize: 13, color: '#A0AEC0', textDecorationLine: 'line-through', marginBottom: 6 },
    finalAmountText: { fontSize: 32, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
    subtitleText: { fontSize: 14, color: '#718096', marginBottom: 36 },
    payNowBtn: { backgroundColor: '#245d5a', borderRadius: 12, paddingVertical: 14, width: '60%', alignItems: 'center', elevation: 2 },
    payNowBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default Pay;