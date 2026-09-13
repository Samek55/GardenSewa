import AdminButton from '@/components/admin/AdminButton';
import AdminCard from '@/components/admin/AdminCard';
import Header4Admin from '@/components/admin/Header4Admin';
import StatusBadge from '@/components/admin/StatusBadge';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { approveLeadUnlock, listLeadUnlockRequests, rejectLeadUnlock } from '../../api/PostApiAdmin';
import { notifyLeadUnlockApproved, notifyLeadUnlockRejected } from '../../api/PostApiNotification';
import { AdminAuthContext } from '../../context/AdminAuthContext';

const STATUS_TABS = ['Pending', 'Approved', 'Rejected'];

export default function LeadUnlockRequests() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminLogoutLocal } = useContext(AdminAuthContext);

    const [activeTab, setActiveTab] = useState(STATUS_TABS[0]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actioningId, setActioningId] = useState(null);

    const loadRequests = useCallback(async (status) => {
        try {
            const result = await listLeadUnlockRequests(status);
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    await adminLogoutLocal();
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load payment requests');
                return;
            }
            setRequests(result.requests || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load payment requests');
        }
    }, [adminLogoutLocal]);

    useEffect(() => {
        setLoading(true);
        loadRequests(activeTab).finally(() => setLoading(false));
    }, [activeTab, loadRequests]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRequests(activeTab);
        setRefreshing(false);
    };

    const handleApprove = async (id) => {
        setActioningId(id);
        try {
            const result = await approveLeadUnlock(id);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not approve this request');
                // Reached whenever another admin already reviewed this request
                // (the server's compare-and-swap rejects a stale second action) —
                // refetch so the now-outdated row with live buttons doesn't just
                // sit there inviting the same failed tap again.
                await loadRequests(activeTab);
                return;
            }
            notifyLeadUnlockApproved(id).catch((e) => console.error('notify approve failed:', e));
            await loadRequests(activeTab);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not approve this request');
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async (id) => {
        setActioningId(id);
        try {
            const result = await rejectLeadUnlock(id);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not reject this request');
                // Same reasoning as handleApprove — a failed CAS means the row
                // is stale, so refetch instead of leaving dead buttons up.
                await loadRequests(activeTab);
                return;
            }
            notifyLeadUnlockRejected(id).catch((e) => console.error('notify reject failed:', e));
            await loadRequests(activeTab);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not reject this request');
        } finally {
            setActioningId(null);
        }
    };

    const renderItem = ({ item }) => (
        <AdminCard style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Booking #{item.booking_id}</Text>
                    <Text style={styles.phone}>{item.gardener_phone}</Text>
                </View>
                <StatusBadge label={item.status} variant={statusVariant(item.status)} />
            </View>

            <TouchableOpacity onPress={() => Linking.openURL(item.proof_url)}>
                <Image source={{ uri: item.proof_url }} style={styles.proofImage} resizeMode="cover" />
            </TouchableOpacity>

            {item.reference_note ? (
                <Text style={styles.note}>{item.reference_note}</Text>
            ) : null}

            {item.status === 'Pending' && (
                <View style={styles.actionsRow}>
                    <AdminButton
                        variant="dangerOutline"
                        label="Reject"
                        onPress={() => handleReject(item.id)}
                        disabled={actioningId === item.id}
                    />
                    <AdminButton
                        variant="brand"
                        label="Approve"
                        onPress={() => handleApprove(item.id)}
                        loading={actioningId === item.id}
                    />
                </View>
            )}
        </AdminCard>
    );

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <Text style={styles.headerTitle}>Lead Unlock Requests</Text>
            </View>

            <View style={styles.tabsRow}>
                {STATUS_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No requests in &quot;{activeTab}&quot;.</Text>
                    }
                />
            )}
        </View>
    );
}

const statusVariant = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'danger';
    return 'warning';
};

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
    tabsRow: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: colors.surface },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: colors.surfaceMuted },
    tabActive: { backgroundColor: colors.brand },
    tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
    tabTextActive: { color: '#fff' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    card: { marginBottom: 12, gap: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    phone: { fontSize: 13, color: colors.textSecondary },
    proofImage: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.surfaceMuted },
    note: { fontSize: 13, color: colors.textSecondary },
    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
