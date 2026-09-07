import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    approveGardener,
    getGardenerDocumentUrl,
    listGardenerApplications,
    rejectGardener,
} from '../../api/PostApiAdmin';
import { AdminAuthContext } from '../../context/AdminAuthContext';

const STATUS_TABS = ['Waiting for Verification', 'Approved', 'Rejected'];
const CAN_REVIEW_ROLES = new Set(['super_admin', 'admin', 'bdm']);

export default function GardenerApplications() {
    const { adminRole, adminDisplayName, adminLogoutLocal } = useContext(AdminAuthContext);

    const [activeTab, setActiveTab] = useState(STATUS_TABS[0]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actioningId, setActioningId] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const canReview = CAN_REVIEW_ROLES.has(adminRole);

    const loadApplications = useCallback(async (status) => {
        try {
            const result = await listGardenerApplications(status);
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    await adminLogoutLocal();
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load applications');
                return;
            }
            setApplications(result.applications || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load applications');
        }
    }, [adminLogoutLocal]);

    useEffect(() => {
        setLoading(true);
        loadApplications(activeTab).finally(() => setLoading(false));
    }, [activeTab, loadApplications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadApplications(activeTab);
        setRefreshing(false);
    };

    const handleViewId = async (id) => {
        try {
            const result = await getGardenerDocumentUrl(id);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not open document');
                return;
            }
            Linking.openURL(result.url);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not open document');
        }
    };

    const handleApprove = async (id) => {
        setActioningId(id);
        try {
            const result = await approveGardener(id);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not approve this application');
                return;
            }
            await loadApplications(activeTab);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not approve this application');
        } finally {
            setActioningId(null);
        }
    };

    const openRejectModal = (id) => {
        setRejectTarget(id);
        setRejectReason('');
    };

    const handleConfirmReject = async () => {
        const id = rejectTarget;
        setRejectTarget(null);
        setActioningId(id);
        try {
            const result = await rejectGardener(id, rejectReason.trim() || null);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not reject this application');
                return;
            }
            await loadApplications(activeTab);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not reject this application');
        } finally {
            setActioningId(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                {item.profile_picture_url ? (
                    <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={24} color="#999" />
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <View style={[styles.statusBadge, statusBadgeStyle(item.status)]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender / Blood Group</Text>
                <Text style={styles.detailValue}>{item.gender} · {item.blood_group}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Citizenship No.</Text>
                <Text style={styles.detailValue}>{item.citizenship_number} ({item.issued_district})</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expertise</Text>
                <Text style={styles.detailValue}>{(item.area_of_expertise || []).join(', ') || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Work Preference</Text>
                <Text style={styles.detailValue}>{item.work_preference || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expected City</Text>
                <Text style={styles.detailValue}>{(item.expected_working_city || []).join(', ') || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{item.years_experience ?? '—'} years</Text>
            </View>
            {item.status === 'Rejected' && item.rejection_reason ? (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <Text style={styles.detailValue}>{item.rejection_reason}</Text>
                </View>
            ) : null}

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.viewIdButton} onPress={() => handleViewId(item.id)}>
                    <Ionicons name="document-text-outline" size={16} color="#245d5a" />
                    <Text style={styles.viewIdButtonText}>View ID</Text>
                </TouchableOpacity>

                {canReview && item.status === 'Waiting for Verification' && (
                    <View style={styles.reviewButtons}>
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => openRejectModal(item.id)}
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
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Gardener Applications</Text>
                    <Text style={styles.headerSubtitle}>{adminDisplayName} · {roleLabel(adminRole)}</Text>
                </View>
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
                    data={applications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No applications in &quot;{activeTab}&quot;.</Text>
                    }
                />
            )}

            <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Reject Application</Text>
                        <Text style={styles.modalSubtitle}>Optionally add a reason (visible to reviewers only).</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Reason for rejection"
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                        />
                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.modalCancelButton} onPress={() => setRejectTarget(null)}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.modalConfirmButton} onPress={handleConfirmReject}>
                                <Text style={styles.modalConfirmButtonText}>Reject</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const roleLabel = (role) => ({
    super_admin: 'Super Admin',
    admin: 'Admin',
    bdm: 'Business Development Manager',
    call_center: 'Call Center',
}[role] || role);

const statusBadgeStyle = (status) => {
    if (status === 'Approved') return { backgroundColor: '#DFF5E1' };
    if (status === 'Rejected') return { backgroundColor: '#FCE1E1' };
    return { backgroundColor: '#FFF3D6' };
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F7' },
    header: {
        backgroundColor: '#245d5a',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
    headerSubtitle: { color: '#BCE5E1', fontSize: 12, marginTop: 2 },
    tabsRow: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#F0F0F0' },
    tabActive: { backgroundColor: '#245d5a' },
    tabText: { fontSize: 11, fontWeight: '600', color: '#555', textAlign: 'center' },
    tabTextActive: { color: '#fff' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#222' },
    phone: { fontSize: 13, color: '#666' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    detailLabel: { fontSize: 12, color: '#888', flex: 1 },
    detailValue: { fontSize: 12, color: '#333', flex: 1.5, textAlign: 'right' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    viewIdButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewIdButtonText: { color: '#245d5a', fontWeight: '600', fontSize: 13 },
    reviewButtons: { flexDirection: 'row', gap: 8 },
    rejectButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d9534f' },
    rejectButtonText: { color: '#d9534f', fontWeight: '700', fontSize: 13 },
    approveButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#245d5a', minWidth: 76, alignItems: 'center' },
    approveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, gap: 10 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
    modalSubtitle: { fontSize: 12, color: '#777' },
    modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top' },
    modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
    modalCancelButtonText: { color: '#555', fontWeight: '600' },
    modalConfirmButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#d9534f', borderRadius: 8 },
    modalConfirmButtonText: { color: '#fff', fontWeight: '700' },
});
