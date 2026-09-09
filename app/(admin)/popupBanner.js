import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import {
    createPopupBanner,
    listPopupBanners,
    setPopupBannerActive,
    updatePopupBanner,
} from '../../api/PostApiBanner';
import { uploadPublicFile } from '../../api/uploadToStorage';

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const emptyForm = { title: '', message: '', imageUrl: '', buttonText: 'View More', buttonLink: '/' };

export default function PopupBanner() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [editing, setEditing] = useState(null); // banner being edited, or {} for a new one
    const [form, setForm] = useState(emptyForm);
    const [pickedImage, setPickedImage] = useState(null);
    const [saving, setSaving] = useState(false);

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

    const openCreate = () => {
        setForm(emptyForm);
        setPickedImage(null);
        setEditing({});
    };

    const openEdit = (banner) => {
        setForm({
            title: banner.title,
            message: banner.message,
            imageUrl: banner.image_url,
            buttonText: banner.button_text,
            buttonLink: banner.button_link,
        });
        setPickedImage(null);
        setEditing(banner);
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

            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                imageUrl,
                buttonText: form.buttonText.trim() || 'View More',
                buttonLink: form.buttonLink.trim() || '/',
            };

            const result = editing?.id
                ? await updatePopupBanner(editing.id, payload)
                : await createPopupBanner(payload);

            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save banner');
                return;
            }
            setEditing(null);
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

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </View>
            <Switch
                value={item.is_active}
                onValueChange={(value) => handleToggleActive(item, value)}
                trackColor={{ false: '#D1D5DB', true: '#245d5a' }}
                thumbColor="#fff"
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Popup Banner</Text>
                <TouchableOpacity onPress={openCreate}>
                    <Ionicons name="add-circle-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#245d5a" />
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No banners yet. Tap + to add one.</Text>}
                />
            )}

            <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => !saving && setEditing(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>{editing?.id ? 'Edit Banner' : 'New Banner'}</Text>

                            <Text style={styles.fieldLabel}>Image</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                                {pickedImage || form.imageUrl ? (
                                    <Image source={{ uri: pickedImage?.uri || form.imageUrl }} style={styles.imagePreview} />
                                ) : (
                                    <Ionicons name="image-outline" size={28} color="#999" />
                                )}
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={form.title}
                                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                                placeholder="Banner title"
                            />

                            <Text style={styles.fieldLabel}>Message</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={form.message}
                                onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
                                placeholder="Banner message"
                                multiline
                            />

                            <Text style={styles.fieldLabel}>Button Text</Text>
                            <TextInput
                                style={styles.input}
                                value={form.buttonText}
                                onChangeText={(v) => setForm((f) => ({ ...f, buttonText: v }))}
                                placeholder="View More"
                            />

                            <Text style={styles.fieldLabel}>Button Link</Text>
                            <TextInput
                                style={styles.input}
                                value={form.buttonLink}
                                onChangeText={(v) => setForm((f) => ({ ...f, buttonLink: v }))}
                                placeholder="/services/1 or https://…"
                                autoCapitalize="none"
                            />

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(null)} disabled={saving}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Save</Text>}
                                </TouchableOpacity>
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
        backgroundColor: '#245d5a', paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#E5E7EB' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
    cardDate: { fontSize: 12, color: '#888', marginTop: 2 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 8 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 6 },
    imagePicker: {
        width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderColor: '#ccc',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#F5F7F7',
    },
    imagePreview: { width: '100%', height: '100%' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 14 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    modalButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 8 },
    cancelButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#245d5a', alignItems: 'center' },
    cancelButtonText: { color: '#245d5a', fontWeight: '700', fontSize: 13 },
    saveButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#245d5a', alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
