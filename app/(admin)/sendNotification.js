import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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

function TabDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const active = TAB_CONFIG.find((t) => t.key === value);

    return (
        <>
            <TouchableOpacity style={styles.tabDropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
                <Ionicons name={active.icon} size={18} color="#245d5a" />
                <Text style={styles.tabDropdownValue}>{active.label}</Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send To</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <Ionicons name="close" size={22} color="#222" />
                            </TouchableOpacity>
                        </View>

                        {TAB_CONFIG.map((t) => {
                            const selected = t.key === value;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    style={styles.optionRow}
                                    onPress={() => { onChange(t.key); setOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={t.icon} size={18} color={selected ? '#245d5a' : '#9CA3AF'} />
                                    <Text style={[styles.optionText, selected && styles.optionTextChecked]}>{t.label}</Text>
                                    {selected && <Ionicons name="checkmark" size={18} color="#245d5a" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

export default function SendNotification() {
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);

    const [tab, setTab] = useState('all');
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Notification</Text>
                <View style={{ width: 22 }} />
            </View>

            <View style={styles.tabDropdownWrap}>
                <TabDropdown value={tab} onChange={(t) => { setTab(t); resetFields(); }} />
            </View>

            {tab === 'history' ? (
                historyLoading ? (
                    <View style={styles.historyCenter}>
                        <ActivityIndicator size="large" color="#245d5a" />
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.historyCenter}>
                        <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
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
                            <Ionicons name={activeTab.icon} size={18} color="#245d5a" />
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
                                    placeholderTextColor="#999"
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
                                    placeholderTextColor="#999"
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
                                    placeholderTextColor="#999"
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </>
                        )}

                        <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
                            {sending ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={18} color="#fff" />
                                    <Text style={styles.sendBtnText}>Send Notification</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F5F7F7' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#245d5a',
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
    tabDropdownWrap: {
        backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    tabDropdownBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1.5, borderColor: '#E0E0E0',
        paddingHorizontal: 16, paddingVertical: 13,
    },
    tabDropdownValue: { fontSize: 14, color: '#222', fontWeight: '700', flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: '#EAF6F4', borderRadius: 14,
        padding: 16, marginBottom: 20,
    },
    infoText: { flex: 1, fontSize: 13, color: '#245d5a', fontWeight: '500', lineHeight: 20 },
    label: {
        fontSize: 11, fontWeight: '800', color: '#245d5a',
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginBottom: 8, marginTop: 16,
    },
    input: {
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1.5, borderColor: '#E0E0E0',
        paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 14, color: '#000',
    },
    textarea: { minHeight: 130, paddingTop: 12 },
    historyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
    historyList: { padding: 16, paddingBottom: 40 },
    historyCard: {
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1, borderColor: '#E0E0E0',
        padding: 16, marginBottom: 12,
    },
    historyCardTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 4 },
    historyCardBody: { fontSize: 13.5, fontWeight: '500', color: '#555', lineHeight: 19, marginBottom: 6 },
    historyCardDate: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, maxHeight: '75%' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
    optionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    optionText: { fontSize: 14, color: '#555', flex: 1 },
    optionTextChecked: { color: '#222', fontWeight: '600' },
    sendBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#245d5a', borderRadius: 16,
        paddingVertical: 16, marginTop: 24, gap: 8,
    },
    sendBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
