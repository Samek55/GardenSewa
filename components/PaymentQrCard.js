import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Same static SRIYOG Consulting payment QR the app used before the Khalti
// lead-unlock integration replaced it for lead fees — HR wants it back for the
// end-of-job payment, display-only with no in-app confirmation.
const SRIYOG_PAYMENT_URL = 'https://sriyog.com/payment';

export default function PaymentQrCard({ amount }) {
    const hasAmount = amount !== null && amount !== undefined && Number(amount) > 0;
    return (
        <View style={styles.card}>
            <Text style={styles.title}>
                {hasAmount ? `Please pay NPR ${Number(amount).toLocaleString('en-US')}` : 'Please complete the payment'}
            </Text>
            <View style={styles.qrWrap}>
                <QRCode value={SRIYOG_PAYMENT_URL} size={180} />
            </View>
            <Text style={styles.hint}>Scan with any wallet or bank app — SRIYOG Consulting</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: '#F0F7F6', borderRadius: 14, padding: 16, marginTop: 4 },
    title: { fontSize: 16, fontWeight: '700', color: '#245d5a', marginBottom: 12, textAlign: 'center' },
    qrWrap: { backgroundColor: '#fff', padding: 12, borderRadius: 12 },
    hint: { fontSize: 12, color: '#64748B', marginTop: 10, textAlign: 'center' },
});
