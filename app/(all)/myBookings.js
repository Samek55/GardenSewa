import { listMyBookings } from '@/api/PostApiBookingCustomer';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const getStatusBadgeStyle = (status) => {
    switch (status) {
        case 'Pending':
            return { bg: '#EBF8FF', text: '#2B6CB0', border: '#3182CE' };
        case 'Completed':
            return { bg: '#F0FDF4', text: '#15803D', border: '#22C55E' };
        case 'Cancelled':
            return { bg: '#FEF2F2', text: '#B91C1C', border: '#EF4444' };
        default: // 'New / Open'
            return { bg: '#E8F4F3', text: '#245d5a', border: '#245d5a' };
    }
};

const STATUS_LABELS = {
    'New / Open': 'Awaiting a Gardener',
    Pending: 'Gardener Assigned',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
};

const MyBookings = () => {
    const { user, isLoggedIn } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBookings = useCallback(async () => {
        if (!user?.phone) return;
        try {
            const result = await listMyBookings(user.phone);
            if (result.success) setBookings(result.bookings || []);
        } catch (error) {
            console.error('Could not load bookings:', error);
        }
    }, [user?.phone]);

    useFocusEffect(
        useCallback(() => {
            if (!isLoggedIn) {
                router.replace('/customerLogin');
                return;
            }
            setLoading(true);
            loadBookings().finally(() => setLoading(false));
        }, [isLoggedIn, loadBookings])
    );

    const renderItem = ({ item }) => {
        const theme = getStatusBadgeStyle(item.status);
        return (
            <TouchableOpacity
                style={[styles.card, { borderLeftColor: theme.border }]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/myBookingDetail', params: { id: item.bookingId } })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.service} numberOfLines={1}>{item.service}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                            {STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.location}>{[item.area, item.city].filter(Boolean).join(', ')}</Text>
                {item.gardenerName && (
                    <View style={styles.gardenerRow}>
                        <Ionicons name="person-circle-outline" size={14} color="#245d5a" />
                        <Text style={styles.gardenerText}>{item.gardenerName}</Text>
                    </View>
                )}
                <View style={styles.footerRow}>
                    <Text style={styles.dateText}>{item.startingDate}</Text>
                    <Text style={styles.viewMore}>View Details</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#245d5a" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>My Bookings</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#245d5a" />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.bookingId.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={loadBookings}
                    refreshing={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={40} color="#94A3B8" />
                            <Text style={styles.emptyText}>You haven&apos;t booked a service yet.</Text>
                            <TouchableOpacity style={styles.bookNowBtn} onPress={() => router.push('/book')}>
                                <Text style={styles.bookNowText}>Book a Service</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
    listContent: { padding: 16, gap: 12 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        gap: 6,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    service: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    location: { fontSize: 13, color: '#64748B' },
    gardenerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    gardenerText: { fontSize: 13, color: '#245d5a', fontWeight: '600' },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    dateText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    viewMore: { fontSize: 12, fontWeight: '700', color: '#245d5a' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
    emptyText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    bookNowBtn: { backgroundColor: '#245d5a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
    bookNowText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default MyBookings;
