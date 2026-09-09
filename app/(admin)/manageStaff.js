import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { createAdmin, listAdmins, toggleAdminStatus, updateAdminCities } from '../../api/PostApiAdmin';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { cityData } from '../../data/servicesList';

const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'bdm', label: 'Business Development Manager' },
    { value: 'call_center', label: 'Call Center' },
];
const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || role;

const CITY_NAMES = cityData.map((c) => c.name);

const emptyForm = { phone: '', fullName: '', pin: '', role: 'admin', allowedCities: [] };

export default function ManageStaff() {
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const [citiesTarget, setCitiesTarget] = useState(null);
    const [citiesDraft, setCitiesDraft] = useState([]);

    const load = useCallback(async () => {
        try {
            const result = await listAdmins();
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not load admin accounts');
                return;
            }
            setAdmins(result.admins || []);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load admin accounts');
        }
    }, []);

    useEffect(() => {
        // Wait for AdminAuthContext to actually finish reading AsyncStorage first —
        // adminRole starts out null on every fresh mount (e.g. a hard page reload,
        // or a deep link straight to this route) until that read resolves, so
        // redirecting on `adminRole !== 'super_admin'` without this guard fires a
        // false-positive redirect before the real role is even known, and on web
        // that redirect can fire before the root Stack has mounted at all,
        // crashing with "navigate before mounting the Root Layout component."
        if (isAdminAuthLoading) return;
        if (adminRole !== 'super_admin') {
            router.replace('/(admin)/gardenerApplications');
            return;
        }
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [isAdminAuthLoading, adminRole, load]);

    if (isAdminAuthLoading || adminRole !== 'super_admin') return null;

    const handleRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleToggleStatus = async (item) => {
        const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
        setBusyId(item.id);
        try {
            const result = await toggleAdminStatus(item.id, nextStatus);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not update status');
                return;
            }
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update status');
        } finally {
            setBusyId(null);
        }
    };

    const openCitiesEditor = (item) => {
        setCitiesTarget(item);
        setCitiesDraft(item.allowed_cities || []);
    };

    const toggleCity = (city) => {
        setCitiesDraft((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
    };

    const handleSaveCities = async () => {
        const target = citiesTarget;
        setCitiesTarget(null);
        setBusyId(target.id);
        try {
            const result = await updateAdminCities(target.id, citiesDraft);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save');
                return;
            }
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save');
        } finally {
            setBusyId(null);
        }
    };

    const handleAddAdmin = async () => {
        if (!form.phone || form.phone.length < 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
            return;
        }
        if (!form.fullName.trim()) {
            Alert.alert('Missing Name', 'Please enter a full name.');
            return;
        }
        if (!form.pin || form.pin.length !== 4) {
            Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await createAdmin(form.phone, form.fullName.trim(), form.pin, form.role, form.allowedCities);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not create account');
                return;
            }
            setAddModalOpen(false);
            setForm(emptyForm);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not create account');
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.full_name}</Text>
                    <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{roleLabel(item.role)}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Allowed Cities</Text>
                <Text style={styles.detailValue}>{(item.allowed_cities || []).join(', ') || 'All'}</Text>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.citiesButton} onPress={() => openCitiesEditor(item)} disabled={busyId === item.id}>
                    <Ionicons name="location-outline" size={16} color="#245d5a" />
                    <Text style={styles.citiesButtonText}>Edit Cities</Text>
                </TouchableOpacity>

                <View style={styles.statusToggleRow}>
                    <Text style={styles.statusToggleLabel}>{item.status === 'Active' ? 'Active' : 'Inactive'}</Text>
                    {busyId === item.id ? (
                        <ActivityIndicator size="small" color="#245d5a" />
                    ) : (
                        <Switch
                            value={item.status === 'Active'}
                            onValueChange={() => handleToggleStatus(item)}
                            trackColor={{ true: '#245d5a' }}
                        />
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Staff</Text>
                <TouchableOpacity onPress={() => setAddModalOpen(true)}>
                    <Ionicons name="person-add-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#245d5a" />
            ) : (
                <FlatList
                    data={admins}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={<Text style={styles.emptyText}>No accounts yet. Tap the icon above to add one.</Text>}
                />
            )}

            {/* Add Admin Modal */}
            <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Add Staff Account</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={form.fullName}
                            onChangeText={(t) => setForm((f) => ({ ...f, fullName: t }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit Phone Number"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={form.phone}
                            onChangeText={(t) => setForm((f) => ({ ...f, phone: t.replace(/[^0-9]/g, '') }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="4-digit PIN"
                            keyboardType="number-pad"
                            maxLength={4}
                            secureTextEntry
                            value={form.pin}
                            onChangeText={(t) => setForm((f) => ({ ...f, pin: t.replace(/[^0-9]/g, '') }))}
                        />

                        <Text style={styles.fieldLabel}>Role</Text>
                        <View style={styles.roleGrid}>
                            {ROLES.map((r) => (
                                <TouchableOpacity
                                    key={r.value}
                                    style={[styles.roleChip, form.role === r.value && styles.roleChipActive]}
                                    onPress={() => setForm((f) => ({ ...f, role: r.value }))}
                                >
                                    <Text style={[styles.roleChipText, form.role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Allowed Cities (optional — blank means all)</Text>
                        <View style={styles.cityGrid}>
                            {CITY_NAMES.map((city) => {
                                const selected = form.allowedCities.includes(city);
                                return (
                                    <TouchableOpacity
                                        key={city}
                                        style={[styles.cityChip, selected && styles.cityChipActive]}
                                        onPress={() => setForm((f) => ({
                                            ...f,
                                            allowedCities: selected
                                                ? f.allowedCities.filter((c) => c !== city)
                                                : [...f.allowedCities, city],
                                        }))}
                                    >
                                        <Text style={[styles.cityChipText, selected && styles.cityChipTextActive]}>{city}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.modalCancelButton} onPress={() => { setAddModalOpen(false); setForm(emptyForm); }}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.modalConfirmButton} onPress={handleAddAdmin} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmButtonText}>Create</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Cities Modal */}
            <Modal visible={!!citiesTarget} transparent animationType="fade" onRequestClose={() => setCitiesTarget(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Allowed Cities</Text>
                        <Text style={styles.modalSubtitle}>{citiesTarget?.full_name}</Text>
                        <View style={styles.cityGrid}>
                            {CITY_NAMES.map((city) => {
                                const selected = citiesDraft.includes(city);
                                return (
                                    <TouchableOpacity
                                        key={city}
                                        style={[styles.cityChip, selected && styles.cityChipActive]}
                                        onPress={() => toggleCity(city)}
                                    >
                                        <Text style={[styles.cityChipText, selected && styles.cityChipTextActive]}>{city}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.modalCancelButton} onPress={() => setCitiesTarget(null)}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={styles.modalConfirmButton} onPress={handleSaveCities}>
                                <Text style={styles.modalConfirmButtonText}>Save</Text>
                            </Pressable>
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
        backgroundColor: '#245d5a',
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    listContent: { padding: 12, gap: 12 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '700', color: '#222' },
    phone: { fontSize: 13, color: '#666' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeActive: { backgroundColor: '#DFF5E1' },
    badgeInactive: { backgroundColor: '#FCE1E1' },
    statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#333' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    detailLabel: { fontSize: 12, color: '#888', flex: 1 },
    detailValue: { fontSize: 12, color: '#333', flex: 1.5, textAlign: 'right' },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    citiesButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    citiesButtonText: { color: '#245d5a', fontWeight: '600', fontSize: 13 },
    statusToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusToggleLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, gap: 10, maxHeight: '85%' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#222' },
    modalSubtitle: { fontSize: 12, color: '#777' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 4 },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#245d5a' },
    roleChipActive: { backgroundColor: '#245d5a' },
    roleChipText: { color: '#245d5a', fontSize: 12, fontWeight: '600' },
    roleChipTextActive: { color: '#fff' },
    cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cityChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
    cityChipActive: { backgroundColor: '#245d5a', borderColor: '#245d5a' },
    cityChipText: { color: '#555', fontSize: 12 },
    cityChipTextActive: { color: '#fff' },
    modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
    modalCancelButtonText: { color: '#555', fontWeight: '600' },
    modalConfirmButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#245d5a', borderRadius: 8, minWidth: 80, alignItems: 'center' },
    modalConfirmButtonText: { color: '#fff', fontWeight: '700' },
});
