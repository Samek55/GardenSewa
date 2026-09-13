import AdminButton from '@/components/admin/AdminButton';
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

import { listPartnershipApplications, updatePartnershipStatus } from '../../api/PostApiAdmin';

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const DetailRow = ({ label, value, styles }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
);

export default function PartnershipApplications() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [applications, setApplications] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

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

    const handleMarkReviewed = async () => {
        setSaving(true);
        try {
            const result = await updatePartnershipStatus(detail.id, 'Reviewed');
            if (!result.success) { Alert.alert('Error', result.message || 'Could not save'); return; }
            setDetail(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    const q = search.trim().toLowerCase();
    const filtered = applications.filter((a) => !q
        || (a.organization || '').toLowerCase().includes(q)
        || (a.full_name || '').toLowerCase().includes(q)
        || (a.phone || '').includes(q));

    const renderItem = ({ item, index }) => (
        <TouchableOpacity onPress={() => setDetail(item)}>
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.organization || item.full_name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                    <Text style={styles.orgLine}>{item.organization} · {item.area}</Text>
                </View>
                <View style={styles.idPill}>
                    <Text style={styles.idPillText}>P{applications.length - index}</Text>
                </View>
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
                <Text style={styles.headerTitle}>Partnership Applications</Text>
            </View>

            <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, phone, or organisation"
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No applications found.</Text>}
                />
            )}

            <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => !saving && setDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{detail?.organization}</Text>
                            <Text style={styles.modalDate}>{formatDate(detail?.created_at)} · {detail?.status}</Text>

                            <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${detail?.phone}`)}>
                                <Text style={styles.phoneLink}>📞 {detail?.full_name} · +977 {detail?.phone}</Text>
                            </TouchableOpacity>

                            <DetailRow label="Email" value={detail?.email} styles={styles} />
                            <DetailRow label="Area" value={detail?.area} styles={styles} />
                            <DetailRow label="No. of Employees" value={detail?.no_of_employees} styles={styles} />
                            <DetailRow label="Business Type" value={detail?.business_type} styles={styles} />
                            <DetailRow label="Services Offered" value={(detail?.services_offered || []).join(', ')} styles={styles} />
                            <DetailRow label="Partnership Interest" value={detail?.partnership_interest} styles={styles} />
                            <DetailRow label="Heard About Us Via" value={detail?.hear_about_us} styles={styles} />
                            {detail?.message ? <DetailRow label="Message" value={detail.message} styles={styles} /> : null}

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
                                    <AdminButton variant="brand" label="Mark Reviewed" onPress={handleMarkReviewed} loading={saving} style={{ flex: 1 }} />
                                )}
                            </View>
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
    },
    headerTitle: { color: colors.brand, fontSize: 18, fontWeight: '700' },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border, borderRadius: 12,
        marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    listContent: { padding: 16, gap: 10 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 17, fontWeight: '700', color: colors.brand },
    name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    phone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    orgLine: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    idPill: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    idPillText: { fontSize: 13, fontWeight: '700', color: colors.brand },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, maxHeight: '85%' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    modalDate: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 10 },
    phoneLink: { fontSize: 15, fontWeight: '700', color: colors.brand, marginBottom: 12 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider },
    detailLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    detailValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
    thumb: { width: 70, height: 70, borderRadius: 10, marginRight: 8, backgroundColor: colors.surfaceMuted },
    modalButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 16, alignItems: 'center' },
    cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
    cancelButtonText: { color: colors.textSecondary, fontWeight: '600' },
});
