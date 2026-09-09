import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { listHelpboxRequests, updateHelpboxRequest } from '../../api/PostApiAdmin';

const STATUS_TABS = ['Open', 'Solved'];
const ISSUE_OPTIONS = ['Service Enquiry', 'Booking Issue', 'Gardener Complaint', 'Partnership', 'Other'];

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function HelpboxRequests() {
    const [activeTab, setActiveTab] = useState('Open');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [detail, setDetail] = useState(null);
    const [issue, setIssue] = useState('');
    const [reply, setReply] = useState('');
    const [issueDropOpen, setIssueDropOpen] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const openDetail = (item) => {
        setDetail(item);
        setIssue(item.issue || '');
        setReply(item.reply || '');
        setIssueDropOpen(false);
    };

    const persist = async (status) => {
        setSaving(true);
        try {
            const result = await updateHelpboxRequest(detail.id, status, issue || null, reply || null);
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

    const filtered = requests.filter((r) => (activeTab === 'Open' ? r.status === 'open' : r.status === 'solved'));

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
            <View style={{ flex: 1 }}>
                <Text style={styles.phone}>{item.phone}</Text>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                {item.issue ? <Text style={styles.issueTag}>{item.issue}</Text> : null}
            </View>
            <View style={[styles.statusBadge, item.status === 'solved' ? styles.badgeSolved : styles.badgeOpen]}>
                <Text style={styles.statusBadgeText}>{item.status === 'solved' ? 'Solved' : 'Open'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Requests</Text>
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
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab.toLowerCase()} requests.</Text>}
                />
            )}

            <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => !saving && setDetail(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Request #{detail?.id}</Text>

                        <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${detail?.phone}`)}>
                            <Text style={styles.phoneLink}>📞 +977 {detail?.phone}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/977${detail?.phone}`)}>
                            <Text style={styles.whatsappLink}>💬 Open WhatsApp</Text>
                        </TouchableOpacity>

                        <Text style={styles.fieldLabel}>Issue Type</Text>
                        <TouchableOpacity style={styles.selectTrigger} onPress={() => setIssueDropOpen((v) => !v)}>
                            <Text style={issue ? styles.selectValue : styles.selectPlaceholder}>{issue || 'Select issue type'}</Text>
                            <Ionicons name={issueDropOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#245d5a" />
                        </TouchableOpacity>
                        {issueDropOpen && (
                            <View style={styles.dropMenu}>
                                {ISSUE_OPTIONS.map((opt) => (
                                    <TouchableOpacity key={opt} style={styles.dropItem} onPress={() => { setIssue(opt); setIssueDropOpen(false); }}>
                                        <Text style={styles.dropItemText}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.fieldLabel}>Note</Text>
                        <TextInput
                            style={styles.noteInput}
                            value={reply}
                            onChangeText={setReply}
                            placeholder="Add a note about this call…"
                            multiline
                        />

                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setDetail(null)} disabled={saving}>
                                <Text style={styles.cancelButtonText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={() => persist('open')} disabled={saving}>
                                <Text style={styles.saveButtonText}>Save Note</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.solveButton} onPress={() => persist('solved')} disabled={saving}>
                                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.solveButtonText}>Mark Solved</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F7' },
    header: {
        backgroundColor: '#245d5a', paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16,
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
    phone: { fontSize: 15, fontWeight: '700', color: '#222' },
    date: { fontSize: 12, color: '#888', marginTop: 2 },
    issueTag: { fontSize: 11, color: '#245d5a', fontWeight: '600', marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeOpen: { backgroundColor: '#FFF3D6' },
    badgeSolved: { backgroundColor: '#DFF5E1' },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 4 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 8 },
    phoneLink: { fontSize: 16, fontWeight: '700', color: '#245d5a', marginBottom: 4 },
    whatsappLink: { fontSize: 14, color: '#25D366', fontWeight: '600', marginBottom: 12 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 8, marginBottom: 6 },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
    selectValue: { fontSize: 14, color: '#000' },
    selectPlaceholder: { fontSize: 14, color: '#999' },
    dropMenu: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 4 },
    dropItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    dropItemText: { fontSize: 14, color: '#333' },
    noteInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, minHeight: 70, textAlignVertical: 'top' },
    modalButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
    cancelButton: { paddingHorizontal: 14, paddingVertical: 10 },
    cancelButtonText: { color: '#555', fontWeight: '600' },
    saveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#245d5a', alignItems: 'center' },
    saveButtonText: { color: '#245d5a', fontWeight: '700', fontSize: 13 },
    solveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#245d5a', alignItems: 'center' },
    solveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
