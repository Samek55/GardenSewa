import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import { listGardeners, publishBooking, updateDraftBooking } from '../../api/PostApiAdmin';
import { listOpenBookings } from '../../api/PostApiBookingGardener';
import { notifyBookingPublished } from '../../api/PostApiNotification';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { areasByCity } from '../../data/Data';
import { budgetData, categories, cityData, priorityData, shiftsData } from '../../data/servicesList';

const today = new Date().toISOString().split('T')[0];

const ALLOWED_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);

export default function ReviewBooking() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);
    const { bookingId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(null);
    const [calendarField, setCalendarField] = useState(null); // 'startingDate' | 'serviceCompletionDate' | null
    const [publishing, setPublishing] = useState(false);

    const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
    const [visibilityChoice, setVisibilityChoice] = useState(null); // 'public' | 'private' | null
    const [gardeners, setGardeners] = useState([]);
    const [gardenerSearch, setGardenerSearch] = useState('');
    const [pickedGardener, setPickedGardener] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const result = await listOpenBookings();
                if (!result.success) {
                    Alert.alert('Error', result.message || 'Could not load this request');
                    router.back();
                    return;
                }
                const found = (result.bookings || []).find((b) => String(b.bookingId) === String(bookingId));
                if (!found) {
                    Alert.alert('Not Found', 'This request could not be found.');
                    router.back();
                    return;
                }
                setForm({
                    fullName: found.fullName || '',
                    phone: found.phone || '',
                    service: found.service || '',
                    city: found.city || '',
                    area: found.area || '',
                    priority: found.priority || '',
                    budget: found.budget || '',
                    selectShift: found.shift || '',
                    startingDate: found.startingDate || '',
                    serviceCompletionDate: found.completionDate || '',
                    workDescription: found.workDescription || '',
                });
            } catch (error) {
                Alert.alert('Error', error.message || 'Could not load this request');
                router.back();
            } finally {
                setLoading(false);
            }
        })();
    }, [bookingId]);

    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    // A compact "pick one" field — same shape as submitBookingForCustomer.js's
    // local SelectField, not shared since this screen's needs are the same
    // simple single-select-from-a-short-list case.
    const SelectField = ({ label, required, value, placeholder, options, onSelect, getLabel = (o) => o }) => {
        const [open, setOpen] = useState(false);
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{label}{required && <Text style={styles.asterisk}> *</Text>}</Text>
                <TouchableOpacity style={styles.selectTrigger} onPress={() => setOpen(true)}>
                    <Text style={[styles.selectTriggerText, !value && styles.placeholderText]}>
                        {value ? getLabel(value) : placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <FlatList
                                data={options}
                                keyExtractor={(item, i) => String(item.id ?? item ?? i)}
                                style={{ maxHeight: 350 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.optionRow}
                                        onPress={() => { onSelect(item); setOpen(false); }}
                                    >
                                        <Text style={styles.optionText}>{getLabel(item)}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    };

    const openPublishModal = () => {
        const required = ['fullName', 'phone', 'service', 'city', 'area', 'budget', 'selectShift', 'startingDate'];
        const missing = required.find((k) => !form[k]);
        if (missing) {
            Alert.alert('Missing Field', 'Please fill in all required fields before publishing.');
            return;
        }
        setVisibilityChoice(null);
        setPickedGardener(null);
        setGardenerSearch('');
        setVisibilityModalOpen(true);
    };

    const loadGardenersIfNeeded = async () => {
        if (gardeners.length > 0) return;
        try {
            const result = await listGardeners();
            if (result.success) setGardeners(result.gardeners || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load professionals');
        }
    };

    const handleChoosePrivate = () => {
        setVisibilityChoice('private');
        loadGardenersIfNeeded();
    };

    const handleConfirmPublish = async () => {
        if (!visibilityChoice) return;
        if (visibilityChoice === 'private' && !pickedGardener) {
            Alert.alert('Select a Professional', 'Please pick who this job should be assigned to.');
            return;
        }

        setPublishing(true);
        try {
            const updateResult = await updateDraftBooking(bookingId, form);
            if (!updateResult.success) {
                Alert.alert('Could Not Save', updateResult.message || 'Please try again.');
                return;
            }

            const publishResult = await publishBooking(
                bookingId,
                visibilityChoice,
                visibilityChoice === 'private' ? pickedGardener.phone : undefined
            );
            if (!publishResult.success) {
                Alert.alert('Could Not Publish', publishResult.message || 'Please try again.');
                return;
            }

            notifyBookingPublished(bookingId).catch((e) => console.error('notify publish failed:', e));
            setVisibilityModalOpen(false);
            Alert.alert('Published', `This request is now live (${visibilityChoice === 'public' ? 'Public' : 'Private'}).`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert('Could Not Publish', error.message || 'Something went wrong. Please try again.');
        } finally {
            setPublishing(false);
        }
    };

    const filteredGardeners = gardeners.filter((g) => {
        if (g.status !== 'Active') return false;
        const q = gardenerSearch.trim().toLowerCase();
        if (!q) return true;
        return (g.fullName || '').toLowerCase().includes(q) || (g.phone || '').includes(q);
    });

    if (isAdminAuthLoading || loading || !form) {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <View style={styles.subHeader}>
                    <Text style={styles.headerTitle}>Review Request</Text>
                </View>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            </View>
        );
    }

    if (!ALLOWED_ROLES.has(adminRole)) {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <View style={styles.subHeader}>
                    <Text style={styles.headerTitle}>Not Available</Text>
                </View>
                <Text style={styles.notAllowedText}>This screen is only available to Admin, BDM, and Call Center staff.</Text>
            </View>
        );
    }

    const availableAreas = form.city ? (areasByCity[form.city] || []) : [];

    return (
        <View style={styles.container}>
            <Header4Admin />
            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Request #{bookingId}</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.helperText}>
                    Review and edit this request, then publish it Public (open to every matching professional) or
                    Private (assigned to one you choose). Close just saves it here for later — nothing changes yet.
                </Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Customer Full Name<Text style={styles.asterisk}> *</Text></Text>
                    <TextInput style={styles.input} value={form.fullName} onChangeText={set('fullName')} placeholder="Customer's name" placeholderTextColor={colors.textMuted} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Customer Phone Number<Text style={styles.asterisk}> *</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        onChangeText={(t) => set('phone')(t.replace(/[^0-9]/g, '').slice(0, 10))}
                        placeholder="10-digit phone number"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                </View>

                <SelectField
                    label="Service" required
                    value={form.service} placeholder="Select a service"
                    options={categories} getLabel={(o) => o.title || o}
                    onSelect={(o) => set('service')(o.title || o)}
                />

                <SelectField
                    label="City" required
                    value={form.city} placeholder="Select city"
                    options={cityData} getLabel={(o) => o.name || o}
                    onSelect={(o) => { set('city')(o.name || o); set('area')(''); }}
                />

                <SelectField
                    label="Area" required
                    value={form.area} placeholder={form.city ? 'Select area' : 'Select a city first'}
                    options={availableAreas.map((a, i) => ({ id: i, name: a }))} getLabel={(o) => o.name}
                    onSelect={(o) => set('area')(o.name)}
                />

                <SelectField
                    label="Budget" required
                    value={form.budget} placeholder="Select budget range"
                    options={budgetData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('budget')(o.name || o)}
                />

                <SelectField
                    label="Preferred Shift" required
                    value={form.selectShift} placeholder="Select shift"
                    options={shiftsData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('selectShift')(o.name || o)}
                />

                <SelectField
                    label="Priority"
                    value={form.priority} placeholder="Select priority (optional)"
                    options={priorityData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('priority')(o.name || o)}
                />

                <View style={styles.field}>
                    <Text style={styles.label}>Starting Date<Text style={styles.asterisk}> *</Text></Text>
                    <TouchableOpacity style={styles.selectTrigger} onPress={() => setCalendarField('startingDate')}>
                        <Text style={[styles.selectTriggerText, !form.startingDate && styles.placeholderText]}>
                            {form.startingDate || 'Select date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {calendarField && (
                    <Calendar
                        minDate={today}
                        onDayPress={(day) => { set(calendarField)(day.dateString); setCalendarField(null); }}
                        markedDates={form[calendarField] ? { [form[calendarField]]: { selected: true, selectedColor: colors.brand } } : {}}
                    />
                )}

                <View style={styles.field}>
                    <Text style={styles.label}>Work Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.workDescription}
                        onChangeText={set('workDescription')}
                        placeholder="Any details the customer mentioned (optional)"
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />
                </View>

                <View style={styles.footerRow}>
                    <AdminButton variant="outline" label="Close" onPress={() => router.back()} style={styles.footerButton} />
                    <AdminButton variant="brand" label="Publish" onPress={openPublishModal} style={styles.footerButton} />
                </View>
            </ScrollView>

            <Modal visible={visibilityModalOpen} transparent animationType="slide" onRequestClose={() => !publishing && setVisibilityModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.publishModalCard}>
                        <Text style={styles.modalTitle}>Publish As</Text>

                        <View style={styles.visibilityRow}>
                            <TouchableOpacity
                                style={[styles.visibilityOption, visibilityChoice === 'public' && styles.visibilityOptionActive]}
                                onPress={() => setVisibilityChoice('public')}
                            >
                                <Ionicons name="earth-outline" size={20} color={visibilityChoice === 'public' ? '#fff' : colors.brand} />
                                <Text style={[styles.visibilityOptionText, visibilityChoice === 'public' && styles.visibilityOptionTextActive]}>Public</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.visibilityOption, visibilityChoice === 'private' && styles.visibilityOptionActive]}
                                onPress={handleChoosePrivate}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color={visibilityChoice === 'private' ? '#fff' : colors.brand} />
                                <Text style={[styles.visibilityOptionText, visibilityChoice === 'private' && styles.visibilityOptionTextActive]}>Private</Text>
                            </TouchableOpacity>
                        </View>

                        {visibilityChoice === 'public' && (
                            <Text style={styles.visibilityHint}>Every professional whose service and city match will be notified.</Text>
                        )}

                        {visibilityChoice === 'private' && (
                            <>
                                <Text style={styles.visibilityHint}>Search and pick the one professional this job goes to.</Text>
                                <TextInput
                                    style={styles.input}
                                    value={gardenerSearch}
                                    onChangeText={setGardenerSearch}
                                    placeholder="Search by name or phone"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <FlatList
                                    data={filteredGardeners}
                                    keyExtractor={(item) => String(item.phone)}
                                    style={styles.gardenerList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[styles.gardenerRow, pickedGardener?.phone === item.phone && styles.gardenerRowActive]}
                                            onPress={() => setPickedGardener(item)}
                                        >
                                            <Text style={styles.gardenerName}>{item.fullName}</Text>
                                            <Text style={styles.gardenerPhone}>{item.phone}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={<Text style={styles.emptyText}>No professionals found.</Text>}
                                />
                            </>
                        )}

                        <View style={styles.footerRow}>
                            <AdminButton
                                variant="outline"
                                label="Cancel"
                                onPress={() => setVisibilityModalOpen(false)}
                                disabled={publishing}
                                style={styles.footerButton}
                            />
                            <AdminButton
                                variant="brand"
                                label="Confirm"
                                onPress={handleConfirmPublish}
                                loading={publishing}
                                disabled={!visibilityChoice}
                                style={styles.footerButton}
                            />
                        </View>
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
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
    notAllowedText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, paddingHorizontal: 24 },
    scrollContent: { padding: 16, gap: 4 },
    helperText: { fontSize: 12, color: colors.warning, backgroundColor: colors.warningBg, padding: 10, borderRadius: 12, marginBottom: 12, lineHeight: 18 },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
    asterisk: { color: colors.danger },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
    selectTriggerText: { fontSize: 14, color: colors.textPrimary },
    placeholderText: { color: colors.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.textPrimary },
    optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
    optionText: { fontSize: 14, color: colors.textSecondary },
    footerRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 30 },
    footerButton: { flex: 1 },
    publishModalCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, maxHeight: '80%' },
    visibilityRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    visibilityOption: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: colors.brand, borderRadius: 12, paddingVertical: 14,
    },
    visibilityOptionActive: { backgroundColor: colors.brand },
    visibilityOptionText: { fontSize: 14, fontWeight: '700', color: colors.brand },
    visibilityOptionTextActive: { color: '#fff' },
    visibilityHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, lineHeight: 17 },
    gardenerList: { maxHeight: 220, marginTop: 8, marginBottom: 4 },
    gardenerRow: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
    gardenerRowActive: { backgroundColor: colors.surfaceMuted },
    gardenerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    gardenerPhone: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 20 },
});
