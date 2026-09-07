import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
    TouchableOpacity,
    View,
} from 'react-native';

import { listPartnershipApplications, updatePartnershipStatus } from '../../api/PostApiAdmin';

const STATUS_TABS = ['New', 'Reviewed'];

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
);

export default function PartnershipApplications() {
    const [activeTab, setActiveTab] = useState('New');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [detail, setDetail] = useState(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const result = await listPartnershipApplications();
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load partnership applications');
                return;
            }
            setApplications(result.applications || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load partnership applications');
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

    const handleMarkReviewed = async () => {
        setSaving(true);
        try {
            const result = await updatePartnershipStatus(detail.id, 'Reviewed');
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save');
                return;
            }
            setDetail(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    const filtered = applications.filter((a) => a.status === activeTab);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => setDetail(item)}>
            <View style={{ flex: 1 }}>
                <Text style={styles.orgName}>{item.organization}</Text>
                <Text style={styles.contactName}>{item.full_name} · {item.phone}</Text>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'Reviewed' ? styles.badgeReviewed : styles.badgeNew]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Partnership Applications</Text>
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
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab.toLowerCase()} applications.</Text>}
                />
            )}

            <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => !saving && setDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{detail?.organization}</Text>

                            <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${detail?.phone}`)}>
                                <Text style={styles.phoneLink}>📞 {detail?.full_name} · +977 {detail?.phone}</Text>
                            </TouchableOpacity>

                            <DetailRow label="Email" value={detail?.email} />
                            <DetailRow label="Area" value={detail?.area} />
                            <DetailRow label="No. of Employees" value={detail?.no_of_employees} />
                            <DetailRow label="Business Type" value={detail?.business_type} />
                            <DetailRow label="Services Offered" value={(detail?.services_offered || []).join(', ')} />
                            <DetailRow label="Partnership Interest" value={detail?.partnership_interest} />
                            <DetailRow label="Heard About Us Via" value={detail?.hear_about_us} />
                            {detail?.message ? <DetailRow label="Message" value={detail.message} /> : null}

                            {detail?.company_photos?.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Company Photos</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                        {detail.company_photos.map((url) => (
                                            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
                                                <Image source={{ uri: url }} style={styles.thumb} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {detail?.registration_documents?.length > 0 && (
                                <>
                                    <Text style={styles.fieldLabel}>Registration Documents</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                        {detail.registration_documents.map((url) => (
                                            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
                                                <Image source={{ uri: url }} style={styles.thumb} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setDetail(null)} disabled={saving}>
                                    <Text style={styles.cancelButtonText}>Close</Text>
                                </TouchableOpacity>
                                {detail?.status === 'New' && (
                                    <TouchableOpacity style={styles.reviewButton} onPress={handleMarkReviewed} disabled={saving}>
                                        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.reviewButtonText}>Mark Reviewed</Text>}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F7' },
    header: {
        backgroundColor: '#245d5a', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    tabsRow: { flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#F0F0F0' },
    tabActive: { backgroundColor: '#245d5a' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#555' },
    tabTextActive: { color: '#fff' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    orgName: { fontSize: 15, fontWeight: '700', color: '#222' },
    contactName: { fontSize: 13, color: '#555', marginTop: 2 },
    date: { fontSize: 12, color: '#888', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeNew: { backgroundColor: '#FFF3D6' },
    badgeReviewed: { backgroundColor: '#DFF5E1' },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 8 },
    phoneLink: { fontSize: 15, fontWeight: '700', color: '#245d5a', marginBottom: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    detailLabel: { fontSize: 13, color: '#666', fontWeight: '600' },
    detailValue: { fontSize: 13, color: '#222', fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 6 },
    thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 8, backgroundColor: '#eee' },
    modalButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
    cancelButtonText: { color: '#555', fontWeight: '600' },
    reviewButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#245d5a', alignItems: 'center' },
    reviewButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
