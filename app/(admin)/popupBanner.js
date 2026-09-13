import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import {
    createPopupBanner,
    listPopupBanners,
    setPopupBannerActive,
    updatePopupBanner,
} from '../../api/PostApiBanner';
import { uploadPublicFile } from '../../api/uploadToStorage';
import { categories, cityData, services } from '../../data/servicesList';

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDisplayDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const BUTTON_TEXT_OPTIONS = [
    'View More', 'Download Now', 'Install Now', 'Buy Now', 'Learn More',
    'Watch Video', 'Grab Offer', 'Join Now', 'Review Now', 'Suggest a Feature', 'Other',
];

const USER_TYPES = ['Public', 'Customer', 'Workforce', 'Admin'];
const CITY_NAMES = cityData.map((c) => c.name);
const PROFESSION_NAMES = categories.map((c) => c.title);

const STATIC_PAGES = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Book a Service', path: '/book' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'FAQs', path: '/faq' },
    { label: 'Glossary', path: '/glossary' },
    { label: 'Become a Partner', path: '/becomeAPartner' },
    { label: 'Join as a Professional', path: '/joinasaprofessional' },
];
const SERVICE_PAGES = services.map((s) => ({ label: s.title, path: `/services/${s.id}` }));
const BROWSE_PAGES = [...STATIC_PAGES, ...SERVICE_PAGES];

const emptyForm = {
    name: '', title: '', message: '', imageUrl: '',
    buttonText: 'View More', buttonTextCustom: '', buttonLink: '/',
    closeCountdownEnabled: true, closeCountdownSeconds: '10',
    startDate: null, endDate: null,
    targetCities: [], targetUserTypes: [], targetProfessions: [],
};

export default function PopupBanner() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [tab, setTab] = useState('compose'); // 'compose' | 'history'
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [editingId, setEditingId] = useState(null); // banner id being edited, or null for a new one
    const [form, setForm] = useState(emptyForm);
    const [pickedImage, setPickedImage] = useState(null);
    const [saving, setSaving] = useState(false);

    const [buttonTextOpen, setButtonTextOpen] = useState(false);
    const [linkPickerOpen, setLinkPickerOpen] = useState(false);
    const [linkSearch, setLinkSearch] = useState('');
    const [calendarField, setCalendarField] = useState(null); // 'startDate' | 'endDate' | null

    const load = useCallback(async () => {
        try {
            const result = await listPopupBanners();
            if (!result.success) {
                if (result.message === 'Please log in again.') {
                    router.replace('/adminLogin');
                    return;
                }
                Alert.alert('Error', result.message || 'Could not load banners');
                return;
            }
            setBanners(result.banners || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load banners');
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

    const resetForm = () => {
        setForm(emptyForm);
        setPickedImage(null);
        setEditingId(null);
    };

    const openEdit = (banner) => {
        const isPreset = BUTTON_TEXT_OPTIONS.slice(0, -1).includes(banner.button_text);
        setForm({
            name: banner.name || '',
            title: banner.title,
            message: banner.message,
            imageUrl: banner.image_url,
            buttonText: isPreset ? banner.button_text : 'Other',
            buttonTextCustom: isPreset ? '' : (banner.button_text || ''),
            buttonLink: banner.button_link,
            closeCountdownEnabled: banner.close_countdown_enabled !== false,
            closeCountdownSeconds: String(banner.close_countdown_seconds || 10),
            startDate: banner.start_date || null,
            endDate: banner.end_date || null,
            targetCities: banner.target_cities || [],
            targetUserTypes: banner.target_user_types || [],
            targetProfessions: banner.target_professions || [],
        });
        setPickedImage(null);
        setEditingId(banner.id);
        setTab('compose');
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1,
            });
            if (!result.canceled) setPickedImage(result.assets[0]);
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            Alert.alert('Missing Field', 'Please enter both a title and a message.');
            return;
        }
        if (!pickedImage && !form.imageUrl) {
            Alert.alert('Missing Field', 'Please select an image.');
            return;
        }

        setSaving(true);
        try {
            const imageUrl = pickedImage
                ? await uploadPublicFile(pickedImage.uri, pickedImage.fileName)
                : form.imageUrl;

            const buttonText = form.buttonText === 'Other'
                ? (form.buttonTextCustom.trim() || 'View More')
                : form.buttonText;

            const payload = {
                name: form.name.trim() || null,
                title: form.title.trim(),
                message: form.message.trim(),
                imageUrl,
                buttonText,
                buttonLink: form.buttonLink.trim() || '/',
                closeCountdownEnabled: form.closeCountdownEnabled,
                closeCountdownSeconds: Number(form.closeCountdownSeconds) || 10,
                startDate: form.startDate,
                endDate: form.endDate,
                targetCities: form.targetCities,
                targetUserTypes: form.targetUserTypes,
                targetProfessions: form.targetProfessions,
            };

            const result = editingId
                ? await updatePopupBanner(editingId, payload)
                : await createPopupBanner(payload);

            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save banner');
                return;
            }
            resetForm();
            setTab('history');
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save banner');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (banner, value) => {
        const previous = banners;
        setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: value } : b)));
        try {
            const result = await setPopupBannerActive(banner.id, value);
            if (!result.success) {
                setBanners(previous);
                Alert.alert('Error', result.message || 'Could not update banner');
            }
        } catch (error) {
            setBanners(previous);
            Alert.alert('Error', error.message || 'Could not update banner');
        }
    };

    const filteredPages = BROWSE_PAGES.filter((p) => p.label.toLowerCase().includes(linkSearch.trim().toLowerCase()));
    const showProfessions = form.targetUserTypes.includes('Workforce');

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
            <Switch
                value={item.is_active}
                onValueChange={(value) => handleToggleActive(item, value)}
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor="#fff"
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.brand} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Popup Banner</Text>
            </View>

            <View style={styles.tabsRow}>
                <TouchableOpacity style={styles.tab} onPress={() => setTab('compose')}>
                    <Text style={[styles.tabText, tab === 'compose' && styles.tabTextActive]}>Compose</Text>
                    {tab === 'compose' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab} onPress={() => setTab('history')}>
                    <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>All Banners</Text>
                    {tab === 'history' && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
            </View>

            {tab === 'compose' ? (
                <ScrollView contentContainerStyle={styles.composeContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.fieldLabel}>Banner Name (internal)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.name}
                        onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                        placeholder="e.g. Monsoon Plumbing Flash Offer"
                        placeholderTextColor={colors.textMuted}
                    />

                    <Text style={styles.fieldLabel}>Banner Image (square, 1080×1080)</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                        {pickedImage || form.imageUrl ? (
                            <Image source={{ uri: pickedImage?.uri || form.imageUrl }} style={styles.imagePreview} />
                        ) : (
                            <>
                                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                                <Text style={styles.imagePickerText}>Tap to upload a 1080×1080 image</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={form.title}
                        onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                        placeholder="Bold headline shown above the countdown, e.g. Flash Offer"
                        placeholderTextColor={colors.textMuted}
                    />

                    <Text style={styles.fieldLabel}>Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.message}
                        onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
                        placeholder="Shown under the image — keep it short and specific."
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />

                    <Text style={styles.fieldLabel}>Button Text</Text>
                    <TouchableOpacity style={styles.selectTrigger} onPress={() => setButtonTextOpen(true)}>
                        <Text style={styles.selectTriggerText}>{form.buttonText}</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {form.buttonText === 'Other' && (
                        <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            value={form.buttonTextCustom}
                            onChangeText={(v) => setForm((f) => ({ ...f, buttonTextCustom: v }))}
                            placeholder="Custom button text"
                            placeholderTextColor={colors.textMuted}
                        />
                    )}

                    <Text style={styles.fieldLabel}>Button Link</Text>
                    <TextInput
                        style={styles.input}
                        value={form.buttonLink}
                        onChangeText={(v) => setForm((f) => ({ ...f, buttonLink: v }))}
                        placeholder="https:// or an in-app route"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.browseLink} onPress={() => setLinkPickerOpen(true)}>
                        <Ionicons name="compass-outline" size={15} color={colors.brand} />
                        <Text style={styles.browseLinkText}>Browse app pages…</Text>
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Close Button Countdown</Text>
                    <View style={styles.countdownRow}>
                        <TouchableOpacity
                            style={[styles.toggle, form.closeCountdownEnabled && styles.toggleOn]}
                            onPress={() => setForm((f) => ({ ...f, closeCountdownEnabled: !f.closeCountdownEnabled }))}
                        >
                            <View style={[styles.toggleKnob, form.closeCountdownEnabled && styles.toggleKnobOn]} />
                        </TouchableOpacity>
                        <Text style={styles.countdownDescription}>
                            The × shows a countdown and can&apos;t be tapped until it hits 0 — like a skippable ad
                        </Text>
                    </View>
                    {form.closeCountdownEnabled && (
                        <View style={styles.secondsRow}>
                            <TextInput
                                style={styles.secondsInput}
                                value={form.closeCountdownSeconds}
                                onChangeText={(v) => setForm((f) => ({ ...f, closeCountdownSeconds: v.replace(/[^0-9]/g, '') }))}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                            <Text style={styles.secondsLabel}>seconds</Text>
                        </View>
                    )}

                    <Text style={styles.fieldLabel}>Schedule</Text>
                    <View style={styles.scheduleRow}>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarField('startDate')}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.dateButtonText}>{formatDisplayDate(form.startDate) || 'Start date'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.scheduleDash}>–</Text>
                        <TouchableOpacity style={styles.dateButton} onPress={() => setCalendarField('endDate')}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.dateButtonText}>{formatDisplayDate(form.endDate) || 'End date'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionLabel}>Audience Targeting</Text>

                    <MultiSelectDropdown
                        label="City"
                        options={CITY_NAMES}
                        selected={form.targetCities}
                        onChange={(v) => setForm((f) => ({ ...f, targetCities: v }))}
                        placeholder="All cities"
                    />
                    {form.targetCities.length > 0 && (
                        <Text style={styles.targetingHint}>
                            Not enforced yet — GardenSewa has no per-customer city data to match
                            against, so this banner will still show regardless of city.
                        </Text>
                    )}

                    <MultiSelectDropdown
                        label="User Type"
                        options={USER_TYPES}
                        selected={form.targetUserTypes}
                        onChange={(v) => setForm((f) => ({ ...f, targetUserTypes: v }))}
                        placeholder="Everyone (Public, Customer, Workforce, Admin)"
                    />

                    {showProfessions && (
                        <MultiSelectDropdown
                            label="Profession"
                            options={PROFESSION_NAMES}
                            selected={form.targetProfessions}
                            onChange={(v) => setForm((f) => ({ ...f, targetProfessions: v }))}
                            placeholder="All professions"
                        />
                    )}

                    <View style={styles.composeButtonsRow}>
                        {editingId ? (
                            <AdminButton variant="outline" label="Cancel Edit" onPress={resetForm} disabled={saving} style={{ flex: 1 }} />
                        ) : null}
                        <AdminButton
                            variant="brand"
                            label={editingId ? 'Save Changes' : 'Publish Banner'}
                            onPress={handleSave}
                            loading={saving}
                            style={{ flex: 1 }}
                        />
                    </View>
                </ScrollView>
            ) : loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand]} tintColor={colors.brand} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No banners yet.</Text>}
                />
            )}

            <Modal visible={buttonTextOpen} transparent animationType="slide" onRequestClose={() => setButtonTextOpen(false)}>
                <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setButtonTextOpen(false)}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Button Text</Text>
                            <TouchableOpacity onPress={() => setButtonTextOpen(false)}>
                                <Ionicons name="close" size={22} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {BUTTON_TEXT_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.pickerOption}
                                    onPress={() => { setForm((f) => ({ ...f, buttonText: opt })); setButtonTextOpen(false); }}
                                >
                                    <Text style={[styles.pickerOptionText, opt === form.buttonText && styles.pickerOptionTextActive]}>{opt}</Text>
                                    {opt === form.buttonText && <Ionicons name="checkmark" size={18} color={colors.brand} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={linkPickerOpen} transparent animationType="slide" onRequestClose={() => setLinkPickerOpen(false)}>
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Browse App Pages</Text>
                            <TouchableOpacity onPress={() => setLinkPickerOpen(false)}>
                                <Ionicons name="close" size={22} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.pickerSearchWrap}>
                            <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.pickerSearchInput}
                                placeholder="Search pages…"
                                placeholderTextColor={colors.textMuted}
                                value={linkSearch}
                                onChangeText={setLinkSearch}
                            />
                        </View>
                        <FlatList
                            data={filteredPages}
                            keyExtractor={(item) => item.path}
                            style={{ maxHeight: 360 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerOption}
                                    onPress={() => { setForm((f) => ({ ...f, buttonLink: item.path })); setLinkPickerOpen(false); setLinkSearch(''); }}
                                >
                                    <Text style={styles.pickerOptionText}>{item.label}</Text>
                                    <Text style={styles.pickerOptionPath}>{item.path}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <Modal visible={!!calendarField} transparent animationType="fade" onRequestClose={() => setCalendarField(null)}>
                <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setCalendarField(null)}>
                    <View style={styles.calendarCard}>
                        <Calendar
                            onDayPress={(day) => { setForm((f) => ({ ...f, [calendarField]: day.dateString })); setCalendarField(null); }}
                            markedDates={form[calendarField] ? { [form[calendarField]]: { selected: true, selectedColor: colors.brand } } : {}}
                            theme={{ todayTextColor: colors.brand, arrowColor: colors.brand, selectedDayBackgroundColor: colors.brand }}
                        />
                    </View>
                </TouchableOpacity>
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
    tabsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    tabText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
    tabTextActive: { color: colors.brand },
    tabUnderline: { height: 2, backgroundColor: colors.brand, width: '60%', marginTop: 8, borderRadius: 1 },
    composeContent: { padding: 16, paddingBottom: 40 },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 12 },
    thumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surfaceMuted },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    cardDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    fieldLabel: {
        fontSize: 11, fontWeight: '800', color: colors.brand,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginTop: 16, marginBottom: 8,
    },
    targetingHint: {
        fontSize: 11, fontStyle: 'italic', color: colors.textMuted,
        marginTop: -4, marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 13, fontWeight: '800', color: colors.textPrimary,
        marginTop: 24, marginBottom: 4,
    },
    imagePicker: {
        width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.surface, gap: 8,
    },
    imagePickerText: { color: colors.textMuted, fontSize: 13 },
    imagePreview: { width: '100%', height: '100%' },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    selectTrigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface,
    },
    selectTriggerText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    browseLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    browseLinkText: { fontSize: 13, fontWeight: '700', color: colors.brand, textDecorationLine: 'underline' },
    countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    countdownDescription: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3, justifyContent: 'center' },
    toggleOn: { backgroundColor: colors.brand },
    toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
    toggleKnobOn: { alignSelf: 'flex-end' },
    secondsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    secondsInput: {
        width: 70, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
        padding: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface, textAlign: 'center',
    },
    secondsLabel: { fontSize: 13, color: colors.textSecondary },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface,
    },
    dateButtonText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    scheduleDash: { color: colors.textMuted },
    composeButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 12, maxHeight: '75%' },
    pickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    pickerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
    pickerSearchWrap: {
        flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 4,
        borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    },
    pickerSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    pickerOptionText: { fontSize: 15, color: colors.textPrimary },
    pickerOptionTextActive: { fontWeight: '800', color: colors.brand },
    pickerOptionPath: { fontSize: 12, color: colors.textMuted },
    calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 },
    calendarCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
});
