import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { listOpenBookings } from '../../api/PostApiBookingGardener';

const RANGE_OPTIONS = ['Today', 'Yesterday', 'This Week', 'This Month', '3 Months', '6 Months', '1 Year', 'All'];

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const day = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    return `${day},\n${weekday}`;
};

const statusColor = (status, colors) => {
    if (status === 'Completed') return colors.success;
    if (status === 'Cancelled') return colors.danger;
    if (status === 'Pending') return colors.warning;
    return colors.textPrimary;
};

const isInRange = (iso, range) => {
    if (range === 'All') return true;
    const created = new Date(iso);
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(now);
    if (range === 'Today') return startOfDay(created).getTime() === today.getTime();
    if (range === 'Yesterday') {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        return startOfDay(created).getTime() === y.getTime();
    }
    const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
    if (range === 'This Week') return created >= daysAgo(7);
    if (range === 'This Month') return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    if (range === '3 Months') return created >= daysAgo(90);
    if (range === '6 Months') return created >= daysAgo(180);
    if (range === '1 Year') return created >= daysAgo(365);
    return true;
};

export default function SuperAdminHistory() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [range, setRange] = useState('All');
    const [search, setSearch] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);

    const DetailRow = ({ label, value }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || '—'}</Text>
        </View>
    );

    const load = useCallback(async () => {
        try {
            const result = await listOpenBookings();
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load bookings');
                return;
            }
            setBookings(result.bookings || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load bookings');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [load]);

    // Lightweight polling so a global audit view stays current without a
    // manual refresh, matching HomeSewa's own BookingHistory/SuperAdminHistory.
    useEffect(() => {
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, [load]);

    const q = search.trim().toLowerCase();
    const filtered = bookings.filter((b) => {
        if (!isInRange(b.createdAt, range)) return false;
        if (!q) return true;
        return (b.fullName || '').toLowerCase().includes(q) || (b.phone || '').includes(q) || (b.service || '').toLowerCase().includes(q);
    });

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.service}>{item.service}</Text>
                <Text style={styles.budget}>{item.budget}</Text>
                <Text style={[styles.status, { color: statusColor(item.status, colors) }]}>{item.status}</Text>
            </View>
            <View style={styles.rowRight}>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <TouchableOpacity style={styles.viewButton} onPress={() => setDetail(item)}>
                    <Text style={styles.viewButtonText}>View</Text>
                    <Ionicons name="reader-outline" size={14} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.brand} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Super Admin</Text>
                    <Text style={styles.headerSubtitle}>All Bookings</Text>
                </View>
                <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    <Text style={styles.badgeText}>Super Admin</Text>
                </View>
            </View>

            <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, phone, or service"
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsRow}>
                {RANGE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.pill, range === opt && styles.pillActive]}
                        onPress={() => setRange(opt)}
                    >
                        <Text style={[styles.pillText, range === opt && styles.pillTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.countText}>{filtered.length} booking{filtered.length === 1 ? '' : 's'}</Text>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.bookingId)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
                />
            )}

            <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalTitleRow}>
                                <Text style={styles.modalTitle}>Booking #{detail?.bookingId}</Text>
                                <Text style={[styles.status, { color: statusColor(detail?.status, colors) }]}>{detail?.status}</Text>
                            </View>

                            {detail?.phone ? (
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${detail.phone}`)}>
                                    <Text style={styles.phoneLink}>📞 {detail?.fullName} · +977 {detail.phone}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.phoneLink}>{detail?.fullName}</Text>
                            )}

                            <DetailRow label="Service" value={detail?.service} />
                            <DetailRow label="Location" value={`${detail?.city || ''}, ${detail?.area || ''}`} />
                            <DetailRow label="Budget" value={detail?.budget} />
                            <DetailRow label="Priority" value={detail?.priority} />
                            <DetailRow label="Preferred Shift" value={detail?.shift} />
                            <DetailRow label="Starting Date" value={detail?.startingDate} />
                            <DetailRow label="Completion Date" value={detail?.completionDate} />
                            <DetailRow label="Accepted By" value={detail?.acceptedByPhone} />
                            {detail?.dealAmount != null && <DetailRow label="Deal Amount" value={`NPR ${detail.dealAmount}`} />}
                            {detail?.dealNote ? <DetailRow label="Deal Note" value={detail.dealNote} /> : null}
                            {detail?.workDescription ? <DetailRow label="Description" value={detail.workDescription} /> : null}

                            {detail?.photos?.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Photos</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                        {detail.photos.map((url) => (
                                            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
                                                <Image source={{ uri: url }} style={styles.thumb} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {detail?.completionPhotos?.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Completion Photos</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                        {detail.completionPhotos.map((url) => (
                                            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
                                                <Image source={{ uri: url }} style={styles.thumb} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            <TouchableOpacity style={styles.closeButton} onPress={() => setDetail(null)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
        backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    headerTitle: { color: colors.brand, fontSize: 18, fontWeight: '700' },
    headerSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: colors.brand, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border, borderRadius: 20,
        marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    pillsScroll: { flexGrow: 0, flexShrink: 0, marginTop: 12 },
    pillsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceMuted },
    pillActive: { backgroundColor: colors.brand },
    pillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    pillTextActive: { color: '#fff' },
    countText: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.divider,
        gap: 12,
    },
    name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    service: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    budget: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    status: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    rowRight: { alignItems: 'flex-end', gap: 8 },
    date: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'right' },
    viewButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.brand, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    viewButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
    detailLabel: { fontSize: 12, color: colors.textMuted, flex: 1 },
    detailValue: { fontSize: 12, color: colors.textPrimary, flex: 1.5, textAlign: 'right' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '85%' },
    modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    phoneLink: { fontSize: 15, fontWeight: '700', color: colors.brand, marginBottom: 12 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
    thumb: { width: 70, height: 70, borderRadius: 10, marginRight: 8, backgroundColor: colors.surfaceMuted },
    closeButton: { paddingVertical: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 },
    closeButtonText: { color: colors.textSecondary, fontWeight: '600' },
});
