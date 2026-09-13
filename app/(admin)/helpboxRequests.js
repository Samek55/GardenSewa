import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { listHelpboxRequests } from '../../api/PostApiAdmin';

const DURATION_OPTIONS = ['All', 'Today', 'Yesterday', 'This Week', 'This Month'];
const STATUS_OPTIONS = ['All', 'Open', 'Solved'];
const PAGE_SIZE = 15;

const formatUid = (id) => `H${String(id).padStart(4, '0')}`;

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const isInDuration = (iso, duration) => {
    if (duration === 'All') return true;
    const created = new Date(iso);
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = startOfDay(now);
    if (duration === 'Today') return startOfDay(created).getTime() === today.getTime();
    if (duration === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return startOfDay(created).getTime() === yesterday.getTime();
    }
    if (duration === 'This Week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
    }
    if (duration === 'This Month') {
        return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }
    return true;
};

function FilterDropdown({ label, value, options, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <View style={{ flex: 1 }}>
            <Text style={dropdownStyles.label}>{label}</Text>
            <TouchableOpacity style={dropdownStyles.trigger} onPress={() => setOpen(true)}>
                <Text style={dropdownStyles.triggerText}>{value}</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={dropdownStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
                    <View style={dropdownStyles.menu}>
                        {options.map((opt) => (
                            <TouchableOpacity key={opt} style={dropdownStyles.option} onPress={() => { onChange(opt); setOpen(false); }}>
                                <Text style={[dropdownStyles.optionText, opt === value && dropdownStyles.optionTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
const dropdownStyles = StyleSheet.create({
    label: { fontSize: 11, fontWeight: '800', color: '#245d5a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    triggerText: { fontSize: 14, color: '#000', fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', padding: 24 },
    menu: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 6 },
    option: { paddingVertical: 12, paddingHorizontal: 18 },
    optionText: { fontSize: 14, color: '#555' },
    optionTextActive: { color: '#245d5a', fontWeight: '700' },
});

export default function HelpboxRequests() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [duration, setDuration] = useState('All');
    const [status, setStatus] = useState('All');
    const [page, setPage] = useState(0);

    const load = useCallback(async () => {
        try {
            const result = await listHelpboxRequests();
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load help requests');
                return;
            }
            setRequests(result.requests || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load help requests');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [load]);

    useEffect(() => { setPage(0); }, [search, duration, status]);

    const openDetail = (item) => {
        router.push({ pathname: '/helpboxDetail', params: { item: JSON.stringify(item) } });
    };

    const filtered = requests.filter((r) => {
        if (status !== 'All' && r.status !== status.toLowerCase()) return false;
        if (!isInDuration(r.created_at, duration)) return false;
        if (search.trim() && !r.phone.includes(search.trim())) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.content}>
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by phone number"
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.filtersRow}>
                    <FilterDropdown label="Duration" value={duration} options={DURATION_OPTIONS} onChange={setDuration} />
                    <FilterDropdown label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
                ) : (
                    <>
                        <View style={styles.table}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>UID</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Phone</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Status</Text>
                            </View>
                            {paged.map((item, idx) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                                    onPress={() => openDetail(item)}
                                >
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{formatUid(item.id)}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.4 }]}>{item.phone}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDate(item.created_at)}</Text>
                                    <Text style={{ flex: 0.8, textAlign: 'right' }}>
                                        {item.status === 'solved' ? (
                                            <Ionicons name="checkmark" size={16} color={colors.success} />
                                        ) : (
                                            <Text style={{ color: colors.warning, fontWeight: '800' }}>!?</Text>
                                        )}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {paged.length === 0 && <Text style={styles.emptyText}>No requests found.</Text>}
                        </View>

                        {filtered.length > 0 && (
                            <View style={styles.pagerRow}>
                                <TouchableOpacity onPress={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                                    <Ionicons name="chevron-back" size={20} color={page === 0 ? colors.textMuted : colors.brand} />
                                </TouchableOpacity>
                                <Text style={styles.pagerText}>Page {page + 1} of {totalPages}</Text>
                                <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages - 1 ? colors.textMuted : colors.brand} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.countText}>{filtered.length} request{filtered.length === 1 ? '' : 's'}</Text>
                    </>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, padding: 16 },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    filtersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    table: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: colors.brand, paddingVertical: 10, paddingHorizontal: 12 },
    tableHeaderCell: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
    tableRowAlt: { backgroundColor: colors.surfaceMuted },
    tableCell: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: colors.textMuted, padding: 20 },
    pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 },
    pagerText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    countText: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 8 },
});
