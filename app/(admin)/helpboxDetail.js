import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { updateHelpboxRequest } from '../../api/PostApiAdmin';

const ISSUE_OPTIONS = ['Service Enquiry', 'Booking Issue', 'Gardener Complaint', 'Partnership', 'Other'];

const formatUid = (id) => `H${String(id).padStart(4, '0')}`;

const formatDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${month} ${d.getFullYear()}, ${time}`;
};

export default function HelpBoxDetail() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const params = useLocalSearchParams();
    const item = useMemo(() => {
        try {
            return JSON.parse(params.item);
        } catch {
            return null;
        }
    }, [params.item]);

    const [status, setStatus] = useState(item?.status || 'open');
    const [issue, setIssue] = useState(item?.issue || '');
    const [reply, setReply] = useState(item?.reply || '');
    const [issueDropOpen, setIssueDropOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!item) {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <Text style={styles.emptyText}>Request not found.</Text>
            </View>
        );
    }

    const persist = async (newStatus) => {
        setSaving(true);
        try {
            const result = await updateHelpboxRequest(item.id, newStatus, issue || null, reply || null);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save');
                return;
            }
            setStatus(newStatus);
            if (newStatus === 'solved') {
                Alert.alert('Marked as Solved', 'This request has been resolved.', [{ text: 'OK', onPress: () => router.back() }]);
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    const isSolved = status === 'solved';

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{formatUid(item.id)}</Text>
                    <Text style={styles.headerSubtitle}>{formatDateTime(item.created_at)}</Text>
                </View>
                <View style={[styles.statusPill, isSolved ? styles.statusPillSolved : styles.statusPillOpen]}>
                    <Text style={[styles.statusPillText, isSolved ? styles.statusTextSolved : styles.statusTextOpen]}>
                        {isSolved ? 'Solved' : 'Open'}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Phone Number</Text>
                    <View style={styles.phoneRow}>
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${item.phone}`)}>
                            <Text style={styles.phoneText}>+977 {item.phone}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/977${item.phone}`)}>
                            <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Request Date</Text>
                    <Text style={styles.plainValue}>{formatDateTime(item.created_at)}</Text>
                </View>

                {item.modified_at && item.modified_at !== item.created_at && (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Last Updated</Text>
                        <Text style={styles.plainValue}>{formatDateTime(item.modified_at)}</Text>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Issue</Text>
                    <TouchableOpacity style={styles.selectTrigger} onPress={() => setIssueDropOpen((v) => !v)} disabled={isSolved}>
                        <Text style={issue ? styles.selectValue : styles.selectPlaceholder}>{issue || 'Select issue type'}</Text>
                        {!isSolved && <Ionicons name={issueDropOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.brand} />}
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
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Note</Text>
                    <TextInput
                        style={styles.noteInput}
                        value={reply}
                        onChangeText={setReply}
                        placeholder="Add a note or reply…"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        editable={!isSolved}
                    />
                </View>

                {isSolved ? (
                    <View style={styles.solvedBanner}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={styles.solvedBannerText}>This request has been marked as solved.</Text>
                    </View>
                ) : (
                    <View style={styles.buttonsRow}>
                        <AdminButton variant="outline" label="Save Note" onPress={() => persist(status)} disabled={saving} style={{ flex: 1 }} />
                        <AdminButton variant="brand" label="✓  Mark as Solved" onPress={() => persist('solved')} loading={saving} style={{ flex: 1 }} />
                    </View>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
        backgroundColor: colors.brand, paddingHorizontal: 16, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
    statusPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    statusPillOpen: { backgroundColor: colors.dangerBg },
    statusPillSolved: { backgroundColor: colors.successBg },
    statusPillText: { fontSize: 14, fontWeight: '800' },
    statusTextOpen: { color: colors.danger },
    statusTextSolved: { color: colors.success },
    content: { padding: 16, gap: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16 },
    sectionLabel: {
        fontSize: 12, fontWeight: '800', color: colors.brand,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
    },
    phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    phoneText: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textDecorationLine: 'underline' },
    plainValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.background },
    selectValue: { fontSize: 14, color: colors.textPrimary },
    selectPlaceholder: { fontSize: 14, color: colors.textMuted },
    dropMenu: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginTop: 8 },
    dropItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
    dropItemText: { fontSize: 14, color: colors.textSecondary },
    noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 90, textAlignVertical: 'top', color: colors.textPrimary, backgroundColor: colors.background },
    buttonsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    solvedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.successBg, borderRadius: 14, padding: 16, marginTop: 4,
    },
    solvedBannerText: { color: colors.success, fontWeight: '700', fontSize: 13, flex: 1 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
