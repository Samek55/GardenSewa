import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { listAllNotifications, sendAdminBroadcast } from '../../api/PostApiNotification';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { categories, cityData } from '../../data/servicesList';

const BROADCAST_ROLES = new Set(['super_admin']);

const SERVICES = categories.map((c) => c.title);
const CITIES = cityData.map((c) => c.name);

const TAB_CONFIG = [
    { key: 'admin', label: 'Admin', icon: 'shield-checkmark-outline', description: 'Flash a notification to every back-office (Admin, BDM, Call Center) account.' },
    { key: 'customer', label: 'Customer', icon: 'people-outline', description: 'Send to all customers, or target only those who booked a specific service.' },
    { key: 'professional', label: 'Professional', icon: 'construct-outline', description: 'Target gardeners by their service type and city.' },
    { key: 'public', label: 'Public', icon: 'megaphone-outline', description: 'Reach installs that have not registered as a customer or gardener yet.' },
    { key: 'all', label: 'All', icon: 'globe-outline', description: 'Send to every app install — customers, gardeners, staff & public.' },
    { key: 'history', label: 'All Notifications', icon: 'time-outline', description: 'Every notification sent so far, across every category.' },
];

const formatDate = (iso) => {
    try {
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${day} ${month} ${d.getFullYear()}, ${time}`;
    } catch {
        return '';
    }
};

export default function SendNotification() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);

    const [tab, setTab] = useState('all');
    const [tabPickerOpen, setTabPickerOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [selectedCustomerServices, setSelectedCustomerServices] = useState([]);
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (isAdminAuthLoading) return;
        if (!BROADCAST_ROLES.has(adminRole)) {
            router.replace('/(admin)/gardenerApplications');
        }
    }, [isAdminAuthLoading, adminRole]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const result = await listAllNotifications();
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load notifications');
                return;
            }
            setHistory(result.notifications || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load notifications');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'history') loadHistory();
    }, [tab]);

    if (isAdminAuthLoading || !BROADCAST_ROLES.has(adminRole)) return null;

    const activeTab = TAB_CONFIG.find((t) => t.key === tab);

    const resetFields = () => {
        setTitle('');
        setMessage('');
        setSelectedServices([]);
        setSelectedCities([]);
        setSelectedCustomerServices([]);
    };

    const handleSend = () => {
        if (tab === 'professional') {
            if (!selectedServices.length) return Alert.alert('Missing Field', 'Please select at least one service type.');
            if (!selectedCities.length) return Alert.alert('Missing Field', 'Please select at least one city.');
            if (!message.trim()) return Alert.alert('Missing Field', 'Please enter a message.');
        } else {
            if (!title.trim()) return Alert.alert('Missing Field', 'Please enter a title.');
            if (!message.trim()) return Alert.alert('Missing Field', 'Please enter a message.');
        }

        const preview = tab === 'professional'
            ? `To: ${selectedServices.join(', ')} gardeners in ${selectedCities.join(', ')}\n\n${message}`
            : tab === 'customer' && selectedCustomerServices.length > 0
                ? `${title}\nTo: customers who booked ${selectedCustomerServices.join(', ')}\n\n${message}`
                : `${title}\n\n${message}`;

        Alert.alert('Confirm Send', preview, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Send Now',
                onPress: async () => {
                    setSending(true);
                    try {
                        const payload = tab === 'professional'
                            ? { audience: 'professional', title: title.trim(), body: message.trim(), serviceTypes: selectedServices, cities: selectedCities }
                            : tab === 'customer'
                                ? { audience: 'customer', title: title.trim(), body: message.trim(), serviceTypes: selectedCustomerServices }
                                : { audience: tab, title: title.trim(), body: message.trim() };

                        const result = await sendAdminBroadcast(payload);
                        if (!result.success) {
                            if (result.message === 'Please log in again.') {
                                router.replace('/adminLogin');
                                return;
                            }
                            Alert.alert('Error', result.message || 'Failed to send notification.');
                            return;
                        }
                        if (!result.sent) {
                            Alert.alert('Nobody to Notify', 'No devices matched this audience right now.');
                            return;
                        }
                        Alert.alert('Sent!', 'Notification sent successfully.');
                        resetFields();
                    } catch (error) {
                        Alert.alert('Error', error.message || 'Failed to send notification.');
                    } finally {
                        setSending(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.screen}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <Text style={styles.headerTitle}>Send Notification</Text>
            </View>

            <View style={styles.tabDropdownWrap}>
                <TouchableOpacity style={styles.tabDropdownBtn} onPress={() => setTabPickerOpen(true)} activeOpacity={0.8}>
                    <Ionicons name={activeTab.icon} size={18} color={colors.brand} />
                    <Text style={styles.tabDropdownValue}>{activeTab.label}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                <Modal visible={tabPickerOpen} transparent animationType="slide" onRequestClose={() => setTabPickerOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTabPickerOpen(false)}>
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Send To</Text>
                                <TouchableOpacity onPress={() => setTabPickerOpen(false)}>
                                    <Ionicons name="close" size={22} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {TAB_CONFIG.map((t) => {
                                const selected = t.key === tab;
                                return (
                                    <TouchableOpacity
                                        key={t.key}
                                        style={styles.optionRow}
                                        onPress={() => { setTab(t.key); resetFields(); setTabPickerOpen(false); }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name={t.icon} size={18} color={selected ? colors.brand : colors.textMuted} />
                                        <Text style={[styles.optionText, selected && styles.optionTextChecked]}>{t.label}</Text>
                                        {selected && <Ionicons name="checkmark" size={18} color={colors.brand} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>

            {tab === 'history' ? (
                historyLoading ? (
                    <View style={styles.historyCenter}>
                        <ActivityIndicator size="large" color={colors.brand} />
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.historyCenter}>
                        <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No notifications sent yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.historyList}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.historyCard}>
                                <Text style={styles.historyCardTitle}>{item.title}</Text>
                                <Text style={styles.historyCardBody}>{item.body}</Text>
                                <Text style={styles.historyCardDate}>{formatDate(item.created_at)}</Text>
                            </View>
                        )}
                    />
                )
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={styles.infoBanner}>
                            <Ionicons name={activeTab.icon} size={18} color={colors.brand} />
                            <Text style={styles.infoText}>{activeTab.description}</Text>
                        </View>

                        {tab === 'professional' ? (
                            <>
                                <MultiSelectDropdown
                                    label="Service Type"
                                    options={SERVICES}
                                    selected={selectedServices}
                                    onChange={setSelectedServices}
                                    placeholder="Select service types..."
                                />
                                <MultiSelectDropdown
                                    label="City"
                                    options={CITIES}
                                    selected={selectedCities}
                                    onChange={setSelectedCities}
                                    placeholder="Select cities..."
                                />
                                <Text style={styles.label}>Message</Text>
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    placeholder="Type your message to gardeners..."
                                    placeholderTextColor={colors.textMuted}
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </>
                        ) : (
                            <>
                                {tab === 'customer' && (
                                    <MultiSelectDropdown
                                        label="Service Type (optional)"
                                        options={SERVICES}
                                        selected={selectedCustomerServices}
                                        onChange={setSelectedCustomerServices}
                                        placeholder="All customers, or select service types..."
                                    />
                                )}
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Notification title"
                                    placeholderTextColor={colors.textMuted}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                                <Text style={styles.label}>Message</Text>
                                <TextInput
                                    style={[styles.input, styles.textarea]}
                                    placeholder={
                                        tab === 'customer'
                                            ? 'Type your offer or message to customers...'
                                            : tab === 'admin'
                                                ? 'Type your message to staff...'
                                                : tab === 'public'
                                                    ? 'Type your message to public installs...'
                                                    : 'Type your announcement or notice...'
                                    }
                                    placeholderTextColor={colors.textMuted}
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </>
                        )}

                        <AdminButton
                            variant="brand"
                            label="Send Notification"
                            onPress={handleSend}
                            loading={sending}
                            style={{ marginTop: 24 }}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    subHeader: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    tabDropdownWrap: {
        backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    tabDropdownBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.surface, borderRadius: 14,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: 16, paddingVertical: 13,
    },
    tabDropdownValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '700', flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: colors.surfaceMuted, borderRadius: 14,
        padding: 16, marginBottom: 20,
    },
    infoText: { flex: 1, fontSize: 13, color: colors.brand, fontWeight: '500', lineHeight: 20 },
    label: {
        fontSize: 11, fontWeight: '800', color: colors.brand,
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginBottom: 8, marginTop: 16,
    },
    input: {
        backgroundColor: colors.surface, borderRadius: 14,
        borderWidth: 1.5, borderColor: colors.border,
        paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: colors.textPrimary,
    },
    textarea: { minHeight: 130, paddingTop: 12 },
    historyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
    historyList: { padding: 16, paddingBottom: 40 },
    historyCard: {
        backgroundColor: colors.surface, borderRadius: 14,
        borderWidth: 1, borderColor: colors.border,
        padding: 16, marginBottom: 12,
    },
    historyCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    historyCardBody: { fontSize: 13.5, fontWeight: '500', color: colors.textSecondary, lineHeight: 19, marginBottom: 6 },
    historyCardDate: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, maxHeight: '75%' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
    optionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    optionText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    optionTextChecked: { color: colors.textPrimary, fontWeight: '600' },
});
