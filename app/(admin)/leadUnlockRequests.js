import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
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
    const { adminRole, adminLogoutLocal } = useContext(AdminAuthContext);

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
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Booking #{item.booking_id}</Text>
                    <Text style={styles.phone}>{item.gardener_phone}</Text>
                </View>
                <View style={[styles.statusBadge, statusBadgeStyle(item.status)]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={() => Linking.openURL(item.proof_url)}>
                <Image source={{ uri: item.proof_url }} style={styles.proofImage} resizeMode="cover" />
            </TouchableOpacity>

            {item.reference_note ? (
                <Text style={styles.note}>{item.reference_note}</Text>
            ) : null}

            {item.status === 'Pending' && (
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(item.id)}
                        disabled={actioningId === item.id}
                    >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(item.id)}
                        disabled={actioningId === item.id}
                    >
                        {actioningId === item.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.approveButtonText}>Approve</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lead Payment Requests</Text>
                <View style={{ width: 24 }} />
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
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#245d5a" />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No requests in &quot;{activeTab}&quot;.</Text>
                    }
                />
            )}
        </View>
    );
}

const statusBadgeStyle = (status) => {
    if (status === 'Approved') return { backgroundColor: '#DFF5E1' };
    if (status === 'Rejected') return { backgroundColor: '#FCE1E1' };
    return { backgroundColor: '#FFF3D6' };
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F7' },
    header: {
        backgroundColor: '#245d5a',
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    tabsRow: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#F0F0F0' },
    tabActive: { backgroundColor: '#245d5a' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' },
    tabTextActive: { color: '#fff' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, gap: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 15, fontWeight: '700', color: '#222' },
    phone: { fontSize: 13, color: '#666' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
    proofImage: { width: '100%', height: 180, borderRadius: 8, backgroundColor: '#eee' },
    note: { fontSize: 13, color: '#555' },
    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
    rejectButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d9534f' },
    rejectButtonText: { color: '#d9534f', fontWeight: '700', fontSize: 13 },
    approveButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#245d5a', minWidth: 76, alignItems: 'center' },
    approveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
