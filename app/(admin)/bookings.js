import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import { getBookingDocumentUrl, listOpenBookings } from '../../api/PostApiBookingGardener';
import { AdminAuthContext } from '../../context/AdminAuthContext';

const STATUS_OPTIONS = ['All', 'Draft', 'New / Open', 'Pending', 'Completed', 'Cancelled'];

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
    if (status === 'Draft') return colors.textSecondary;
    return colors.textPrimary;
};

export default function Bookings() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole } = useContext(AdminAuthContext);

    const [statusFilter, setStatusFilter] = useState('New / Open');
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [selectedDate, setSelectedDate] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleViewDocument = async (bookingId, path) => {
        try {
            const result = await getBookingDocumentUrl(bookingId, path);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not open document');
                return;
            }
            Linking.openURL(result.url);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not open document');
        }
    };

    const filtered = bookings.filter((b) => {
        if (statusFilter !== 'All' && b.status !== statusFilter) return false;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            return (b.fullName || '').toLowerCase().includes(q) || (b.phone || '').includes(q) || (b.service || '').toLowerCase().includes(q);
        }
        return true;
    });

    // Calendar mode shows every booking made on the selected day regardless
    // of the status filter — a date is a stronger, more specific filter than
    // status, matching HomeSewa's own calendar behavior.
    const markedDates = useMemo(() => {
        const marks = {};
        bookings.forEach((b) => {
            const d = (b.createdAt || '').split('T')[0];
            if (!d) return;
            marks[d] = { marked: true, dotColor: colors.brand };
        });
        if (selectedDate) {
            marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: colors.brand };
        }
        return marks;
    }, [bookings, selectedDate, colors.brand]);

    const dayBookings = selectedDate
        ? bookings.filter((b) => (b.createdAt || '').split('T')[0] === selectedDate)
        : [];

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
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => (
                        item.status === 'Draft'
                            ? router.push({ pathname: '/reviewBooking', params: { bookingId: item.bookingId } })
                            : setDetail(item)
                    )}
                >
                    <Text style={styles.viewButtonText}>{item.status === 'Draft' ? 'Review' : 'View'}</Text>
                    <Ionicons name="reader-outline" size={14} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                {searchOpen ? (
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, phone, or service"
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        autoFocus
                    />
                ) : (
                    <>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={colors.brand} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Booking History</Text>
                    </>
                )}

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => { setSearchOpen((v) => !v); setSearch(''); }}>
                        <Ionicons name={searchOpen ? 'close' : 'search'} size={20} color={colors.brand} />
                    </TouchableOpacity>
                    {!searchOpen && adminRole === 'super_admin' && (
                        <TouchableOpacity onPress={() => router.push('/(admin)/superAdminHistory')}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand} />
                        </TouchableOpacity>
                    )}
                    {!searchOpen && (
                        <TouchableOpacity onPress={() => { setViewMode((v) => (v === 'list' ? 'calendar' : 'list')); setSelectedDate(null); }}>
                            <Ionicons name={viewMode === 'calendar' ? 'list-outline' : 'calendar-outline'} size={20} color={colors.brand} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {viewMode === 'list' && (
                <View style={styles.filterWrap}>
                    <TouchableOpacity style={styles.filterButton} onPress={() => setFilterOpen(true)}>
                        <Text style={styles.filterButtonText}>{statusFilter}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.brand} />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : viewMode === 'calendar' ? (
                <ScrollView>
                    <Calendar
                        markedDates={markedDates}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        theme={{
                            todayTextColor: colors.brand,
                            arrowColor: colors.brand,
                            selectedDayBackgroundColor: colors.brand,
                            dotColor: colors.brand,
                        }}
                    />
                    {selectedDate && (
                        <View style={styles.clearDateRow}>
                            <Text style={styles.clearDateText}>Showing bookings for {selectedDate}</Text>
                            <TouchableOpacity onPress={() => setSelectedDate(null)}>
                                <Text style={styles.clearDateLink}>Clear date filter</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {selectedDate && dayBookings.length === 0 && (
                        <Text style={styles.emptyText}>No bookings on this date.</Text>
                    )}
                    {selectedDate && dayBookings.map((item) => (
                        <View key={item.bookingId}>{renderItem({ item })}</View>
                    ))}
                </ScrollView>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.bookingId)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
                />
            )}

            <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
                <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
                    <View style={styles.filterMenu}>
                        {STATUS_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt} style={styles.filterOption} onPress={() => { setStatusFilter(opt); setFilterOpen(false); }}>
                                <Text style={[styles.filterOptionText, opt === statusFilter && styles.filterOptionTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

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

                            {detail?.workDocuments?.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Work Documents</Text>
                                    <View style={styles.docChipRow}>
                                        {detail.workDocuments.map((path, index) => (
                                            <TouchableOpacity
                                                key={path}
                                                style={styles.docChip}
                                                onPress={() => handleViewDocument(detail.bookingId, path)}
                                            >
                                                <Ionicons name="document-text-outline" size={16} color={colors.brand} />
                                                <Text style={styles.docChipText}>Document {index + 1}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
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
    headerTitle: { color: colors.brand, fontSize: 19, fontWeight: '700', flex: 1 },
    searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 4 },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    clearDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    clearDateText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
    clearDateLink: { fontSize: 12, color: colors.brand, fontWeight: '700' },
    filterWrap: { backgroundColor: colors.background, paddingHorizontal: 16, paddingVertical: 10 },
    filterButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'flex-start',
        backgroundColor: colors.surfaceMuted, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 10, gap: 8, minWidth: 140,
    },
    filterButtonText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', paddingTop: 130, paddingLeft: 16 },
    filterMenu: { backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 6, width: 200, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 },
    filterOption: { paddingVertical: 12, paddingHorizontal: 16 },
    filterOptionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    filterOptionTextActive: { color: colors.brand, fontWeight: '800' },
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
    docChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    docChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    docChipText: { fontSize: 12, fontWeight: '600', color: colors.brand },
    closeButton: { paddingVertical: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 },
    closeButtonText: { color: colors.textSecondary, fontWeight: '600' },
});
