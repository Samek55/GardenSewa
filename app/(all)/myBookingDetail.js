import { listBookingMessages, listMyBookings, listRatingsForBooking, sendBookingMessage, submitRating } from '@/api/PostApiBookingCustomer';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useContext, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const STATUS_LABELS = {
    'New / Open': 'Awaiting a Gardener',
    Pending: 'Gardener Assigned',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
};

const STATUS_COLORS = {
    'New / Open': '#245d5a',
    Pending: '#2B6CB0',
    Completed: '#15803D',
    Cancelled: '#B91C1C',
};

const MESSAGE_POLL_MS = 10000;

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
);

const StarPicker = ({ value, onChange }) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => onChange(n)}>
                <Ionicons name={n <= value ? 'star' : 'star-outline'} size={30} color="#F59E0B" />
            </TouchableOpacity>
        ))}
    </View>
);

const MyBookingDetail = () => {
    const { id } = useLocalSearchParams();
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [myRating, setMyRating] = useState(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const pollRef = useRef(null);

    const loadBooking = useCallback(async () => {
        if (!user?.phone || !id) return;
        const result = await listMyBookings(user.phone);
        if (result.success) {
            const match = (result.bookings || []).find((b) => String(b.bookingId) === String(id));
            setBooking(match || null);
        }
    }, [user?.phone, id]);

    const loadMessages = useCallback(async () => {
        if (!user?.phone || !id) return;
        const result = await listBookingMessages(id, user.phone);
        if (result.success) setMessages(result.messages || []);
    }, [user?.phone, id]);

    const loadRating = useCallback(async () => {
        if (!id) return;
        const result = await listRatingsForBooking(id);
        if (result.success) {
            const mine = (result.ratings || []).find((r) => r.rater_role === 'customer');
            setMyRating(mine || null);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            setLoading(true);
            Promise.all([loadBooking(), loadRating()]).finally(() => {
                if (active) setLoading(false);
            });

            return () => { active = false; };
        }, [loadBooking, loadRating])
    );

    useFocusEffect(
        useCallback(() => {
            if (!booking?.gardenerPhone) return;
            loadMessages();
            pollRef.current = setInterval(loadMessages, MESSAGE_POLL_MS);
            return () => clearInterval(pollRef.current);
        }, [booking?.gardenerPhone, loadMessages])
    );

    const handleSendMessage = async () => {
        const body = messageText.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const result = await sendBookingMessage(id, user.phone, body);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not send message');
                return;
            }
            setMessageText('');
            await loadMessages();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not send message');
        } finally {
            setSending(false);
        }
    };

    const handleSubmitRating = async () => {
        setSubmittingRating(true);
        try {
            const result = await submitRating(id, user.phone, ratingValue, ratingComment.trim());
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not submit rating');
                return;
            }
            await loadRating();
            Alert.alert('Thank You', 'Your rating has been submitted.');
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#245d5a" />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: '#64748B' }}>Booking not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
                    <Text style={{ color: '#245d5a', fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isAccepted = !!booking.gardenerPhone;
    const isCompleted = booking.status === 'Completed';

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#245d5a" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Booking #{booking.bookingId}</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={styles.statusBanner}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] || '#245d5a' }]}>
                        {STATUS_LABELS[booking.status] || booking.status}
                    </Text>
                </View>

                <View style={styles.card}>
                    <DetailRow label="Service" value={booking.service} />
                    <DetailRow label="Location" value={[booking.area, booking.city].filter(Boolean).join(', ')}  />
                    <DetailRow label="Budget" value={booking.budget} />
                    <DetailRow label="Shift" value={booking.shift} />
                    <DetailRow label="Starting Date" value={booking.startingDate} />
                    {booking.workDescription ? <DetailRow label="Details" value={booking.workDescription} /> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Gardener</Text>
                    {isAccepted ? (
                        <View style={styles.gardenerCard}>
                            <View style={styles.gardenerAvatar}>
                                <Ionicons name="person" size={22} color="#245d5a" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.gardenerName}>{booking.gardenerName || 'Assigned Gardener'}</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.gardenerPhone}`)}>
                                    <Text style={styles.gardenerPhone}>+977 {booking.gardenerPhone}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.gardenerPhone}`)}>
                                <Ionicons name="call" size={22} color="#245d5a" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.pendingText}>
                            No gardener has accepted this job yet. We&apos;ll notify you as soon as one does.
                        </Text>
                    )}
                </View>

                {isAccepted && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Chat with Gardener</Text>
                        <View style={styles.chatBox}>
                            {messages.length === 0 ? (
                                <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
                            ) : (
                                messages.map((m) => (
                                    <View
                                        key={m.id}
                                        style={[
                                            styles.messageBubble,
                                            m.sender_role === 'customer' ? styles.myBubble : styles.theirBubble,
                                        ]}
                                    >
                                        <Text style={m.sender_role === 'customer' ? styles.myBubbleText : styles.theirBubbleText}>
                                            {m.body}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                        <View style={styles.chatInputRow}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Type a message..."
                                value={messageText}
                                onChangeText={setMessageText}
                            />
                            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={sending}>
                                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {isCompleted && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Rate Your Gardener</Text>
                        {myRating ? (
                            <View>
                                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Ionicons key={n} name={n <= myRating.rating ? 'star' : 'star-outline'} size={20} color="#F59E0B" />
                                    ))}
                                </View>
                                {myRating.comment ? <Text style={styles.pendingText}>&quot;{myRating.comment}&quot;</Text> : null}
                                <Text style={styles.thanksText}>Thanks for your feedback!</Text>
                            </View>
                        ) : (
                            <View>
                                <StarPicker value={ratingValue} onChange={setRatingValue} />
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Add a comment (optional)"
                                    value={ratingComment}
                                    onChangeText={setRatingComment}
                                    multiline
                                />
                                <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitRating} disabled={submittingRating}>
                                    {submittingRating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitRatingText}>Submit Rating</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    backButton: { paddingRight: 4 },
    pageTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    statusBanner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
    statusText: { fontSize: 15, fontWeight: '700' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        margin: 16,
        marginTop: 8,
        gap: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#245d5a', marginBottom: 2 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    detailValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    gardenerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    gardenerAvatar: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F4F3',
        alignItems: 'center', justifyContent: 'center',
    },
    gardenerName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    gardenerPhone: { fontSize: 13, color: '#245d5a', fontWeight: '600', marginTop: 2 },
    pendingText: { fontSize: 13, color: '#64748B', lineHeight: 19 },
    chatBox: { gap: 8, maxHeight: 260 },
    emptyChatText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingVertical: 12 },
    messageBubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
    myBubble: { backgroundColor: '#245d5a', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    myBubbleText: { color: '#fff', fontSize: 13 },
    theirBubbleText: { color: '#1E293B', fontSize: 13 },
    chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
    chatInput: {
        flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 14,
        paddingVertical: 10, fontSize: 13,
    },
    sendButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#245d5a',
        alignItems: 'center', justifyContent: 'center',
    },
    commentInput: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10,
        fontSize: 13, marginTop: 10, minHeight: 60, textAlignVertical: 'top',
    },
    submitRatingBtn: {
        backgroundColor: '#245d5a', borderRadius: 10, paddingVertical: 12,
        alignItems: 'center', marginTop: 10,
    },
    submitRatingText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    thanksText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});

export default MyBookingDetail;
