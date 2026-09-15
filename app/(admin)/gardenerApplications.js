import AdminButton from '@/components/admin/AdminButton';
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
    Modal,
    Pressable,
    ScrollView,
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

const CAN_REVIEW_ROLES = new Set(['super_admin', 'admin', 'bdm']);

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function GardenerApplications() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole, adminLogoutLocal } = useContext(AdminAuthContext);

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [actioning, setActioning] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [docViewer, setDocViewer] = useState({ visible: false, loading: false, url: null });

    const canReview = CAN_REVIEW_ROLES.has(adminRole);

    const load = useCallback(async () => {
        try {
            const result = await listGardenerApplications('Waiting for Verification');
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
        load().finally(() => setLoading(false));
    }, [load]);

    const handleViewId = async (id) => {
        setDocViewer({ visible: true, loading: true, url: null });
        try {
            const result = await getGardenerDocumentUrl(id);
            if (!result.success) {
                setDocViewer({ visible: false, loading: false, url: null });
                Alert.alert('Error', result.message || 'Could not open document');
                return;
            }
            setDocViewer({ visible: true, loading: false, url: result.url });
        } catch (error) {
            setDocViewer({ visible: false, loading: false, url: null });
            Alert.alert('Error', error.message || 'Could not open document');
        }
    };

    const handleApprove = async () => {
        setActioning(true);
        try {
            const result = await approveGardener(detail.id);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not approve this application'); return; }
            setDetail(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not approve this application');
        } finally {
            setActioning(false);
        }
    };

    const handleConfirmReject = async () => {
        setActioning(true);
        try {
            const result = await rejectGardener(detail.id, rejectReason.trim() || null);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not reject this application'); return; }
            setRejectOpen(false);
            setDetail(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not reject this application');
        } finally {
            setActioning(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => setDetail(item)}>
            <View style={styles.row}>
                {item.profile_picture_url ? (
                    <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.applied}>Applied: {formatDate(item.created_at)}</Text>
                    <Text style={styles.expertise} numberOfLines={1}>{(item.area_of_expertise || []).join(', ') || '—'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.brand} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Professional Verification</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{applications.length}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : (
                <FlatList
                    data={applications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending applications.</Text>}
                />
            )}

            <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeaderRow}>
                                {detail?.profile_picture_url ? (
                                    <Image source={{ uri: detail.profile_picture_url }} style={styles.modalAvatar} />
                                ) : (
                                    <View style={[styles.modalAvatar, styles.avatarPlaceholder]}>
                                        <Ionicons name="person" size={26} color={colors.textMuted} />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalTitle}>{detail?.full_name}</Text>
                                    <Text style={styles.modalSubtitle}>{detail?.phone}</Text>
                                </View>
                            </View>

                            <InfoRow icon="male-female-outline" label="Gender / Blood Group" value={`${detail?.gender || '—'} · ${detail?.blood_group || '—'}`} colors={colors} />
                            <InfoRow icon="card-outline" label="Citizenship No." value={`${detail?.citizenship_number || '—'} (${detail?.issued_district || '—'})`} colors={colors} />
                            <InfoRow icon="briefcase-outline" label="Work Preference" value={detail?.work_preference} colors={colors} />
                            <InfoRow icon="location-outline" label="Expected City" value={(detail?.expected_working_city || []).join(', ')} colors={colors} />
                            <InfoRow icon="time-outline" label="Experience" value={detail?.years_experience != null ? `${detail.years_experience} years` : null} colors={colors} />
                            <InfoRow icon="call-outline" label="Emergency Contact" value={`${detail?.emergency_contact_number || '—'} (${detail?.emergency_contact_relation || '—'})`} colors={colors} />

                            {detail?.area_of_expertise?.length > 0 && (
                                <>
                                    <Text style={styles.sectionLabel}>Expertise</Text>
                                    <View style={styles.chipRow}>
                                        {detail.area_of_expertise.map((e) => (
                                            <View key={e} style={styles.chip}><Text style={styles.chipText}>{e}</Text></View>
                                        ))}
                                    </View>
                                </>
                            )}

                            <TouchableOpacity style={styles.viewIdButton} onPress={() => handleViewId(detail.id)}>
                                <Ionicons name="document-text-outline" size={16} color={colors.brand} />
                                <Text style={styles.viewIdButtonText}>View ID / Document</Text>
                            </TouchableOpacity>

                            {canReview && (
                                <View style={styles.modalButtonsRow}>
                                    <AdminButton variant="dangerOutline" label="Reject" onPress={() => { setRejectReason(''); setRejectOpen(true); }} disabled={actioning} style={{ flex: 1 }} />
                                    <AdminButton variant="brand" label="Approve" onPress={handleApprove} loading={actioning} style={{ flex: 1 }} />
                                </View>
                            )}
                            <TouchableOpacity style={styles.closeButton} onPress={() => setDetail(null)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={rejectOpen} transparent animationType="fade" onRequestClose={() => setRejectOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.reasonCard}>
                        <Text style={styles.modalTitle}>Reject Application</Text>
                        <Text style={styles.modalSubtitle}>Optionally add a reason (visible to reviewers only).</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Reason for rejection"
                            placeholderTextColor={colors.textMuted}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                        />
                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.modalCancelButton} onPress={() => setRejectOpen(false)}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <AdminButton variant="danger" label="Reject" onPress={handleConfirmReject} loading={actioning} />
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={docViewer.visible} transparent animationType="fade" onRequestClose={() => setDocViewer({ visible: false, loading: false, url: null })}>
                <View style={styles.docViewerOverlay}>
                    <TouchableOpacity style={styles.docViewerClose} onPress={() => setDocViewer({ visible: false, loading: false, url: null })}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    {docViewer.loading ? (
                        <ActivityIndicator size="large" color="#fff" />
                    ) : docViewer.url ? (
                        <Image source={{ uri: docViewer.url }} style={styles.docViewerImage} resizeMode="contain" />
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}

function InfoRow({ icon, label, value, colors }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
                <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginTop: 2 }}>{value || '—'}</Text>
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
        backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    headerTitle: { color: colors.brand, fontSize: 18, fontWeight: '700', flex: 1 },
    countBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    listContent: { padding: 16, gap: 10 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    applied: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    expertise: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '88%' },
    modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    modalAvatar: { width: 56, height: 56, borderRadius: 28 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    chipText: { fontSize: 12, color: colors.success, fontWeight: '600' },
    viewIdButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 },
    viewIdButtonText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
    modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
    closeButton: { paddingVertical: 12, alignItems: 'center', marginTop: 12, marginBottom: 4 },
    closeButtonText: { color: colors.textSecondary, fontWeight: '600' },
    docViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
    docViewerImage: { width: '100%', height: '85%' },
    docViewerClose: { position: 'absolute', top: 48, right: 20, zIndex: 1, padding: 8 },
    reasonCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, gap: 10, margin: 24 },
    reasonInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, minHeight: 70, textAlignVertical: 'top', color: colors.textPrimary },
    modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
    modalCancelButtonText: { color: colors.textSecondary, fontWeight: '600' },
});
