import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import StatusBadge from '@/components/admin/StatusBadge';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    createAdmin,
    listAdmins,
    listCustomers,
    listGardeners,
    toggleAdminStatus,
    toggleCustomerStatus,
    toggleGardenerStatus,
    updateAdminCities,
} from '../../api/PostApiAdmin';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { categories, cityData } from '../../data/servicesList';

const TABS = [
    { key: 'professionals', label: 'Professionals' },
    { key: 'customers', label: 'Customers' },
    { key: 'admins', label: 'Admins' },
];

const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'bdm', label: 'Business Development Manager' },
    { value: 'call_center', label: 'Call Center' },
];
const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || role;
const CITY_NAMES = cityData.map((c) => c.name);
const SERVICE_NAMES = categories.map((c) => c.title);
const emptyForm = { findPhone: '', phone: '', fullName: '', pin: '', role: 'admin', allowedCities: [] };

const formatDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${month} ${d.getFullYear()}, ${time}`;
};

// Stable, gap-free reference numbers (W1, W2, … / C1, C2, …) based on absolute
// signup order — independent of the list's current sort/filter/search state,
// so a gardener/customer's number never changes as new people sign up around
// them. Neither table has a real sequential id to show instead (see
// 0004_admin_roles_and_customer.sql — customer is a minimal OTP-only row).
const rankById = (items) => {
    const sorted = [...items].sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
    const map = new Map();
    sorted.forEach((item, i) => map.set(item.id, i + 1));
    return map;
};

const Avatar = ({ label, colors, size = 44 }) => (
    <View style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceMuted,
        alignItems: 'center', justifyContent: 'center',
    }}>
        <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: colors.brand }}>{(label || '?').charAt(0).toUpperCase()}</Text>
    </View>
);

export default function UserManagement() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);

    const [tab, setTab] = useState('professionals');
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('All');
    const [cityFilterOpen, setCityFilterOpen] = useState(false);
    const [serviceFilter, setServiceFilter] = useState('All');
    const [serviceFilterOpen, setServiceFilterOpen] = useState(false);

    const [gardeners, setGardeners] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const [gardenerDetail, setGardenerDetail] = useState(null);
    const [customerDetail, setCustomerDetail] = useState(null);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [foundMatch, setFoundMatch] = useState(null); // { label, type } | null
    const [submitting, setSubmitting] = useState(false);
    const [citiesTarget, setCitiesTarget] = useState(null);
    const [citiesDraft, setCitiesDraft] = useState([]);

    useEffect(() => {
        if (isAdminAuthLoading) return;
        if (adminRole !== 'super_admin') {
            router.replace('/(admin)/gardenerApplications');
        }
    }, [isAdminAuthLoading, adminRole]);

    const load = useCallback(async () => {
        try {
            const [g, c, a] = await Promise.all([listGardeners(), listCustomers(), listAdmins()]);
            if (g.success) setGardeners(g.gardeners || []);
            if (c.success) setCustomers(c.customers || []);
            if (a.success) setAdmins(a.admins || []);
            const authError = [g, c, a].find((r) => !r.success && r.message === 'Please log in again.');
            if (authError) { router.replace('/adminLogin'); return; }
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load users');
        }
    }, []);

    useEffect(() => {
        if (isAdminAuthLoading || adminRole !== 'super_admin') return;
        setLoading(true);
        load().finally(() => setLoading(false));
    }, [isAdminAuthLoading, adminRole, load]);

    const gardenerRanks = useMemo(() => rankById(gardeners), [gardeners]);
    const customerRanks = useMemo(() => rankById(customers), [customers]);

    if (isAdminAuthLoading || adminRole !== 'super_admin') return null;

    const handleToggleGardener = async (item) => {
        const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
        setBusyId(item.id);
        try {
            const result = await toggleGardenerStatus(item.id, nextStatus);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not update status'); return; }
            setGardenerDetail(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not update status');
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleCustomer = (item) => {
        const blocking = item.status === 'Active';
        Alert.alert(
            blocking ? 'Block Customer' : 'Unblock Customer',
            blocking ? `${item.full_name || item.phone} won't be able to submit new bookings until unblocked.` : `${item.full_name || item.phone} will be able to submit bookings again.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: blocking ? 'Block' : 'Unblock',
                    style: blocking ? 'destructive' : 'default',
                    onPress: async () => {
                        setBusyId(item.id);
                        try {
                            const result = await toggleCustomerStatus(item.id, blocking ? 'Blocked' : 'Active');
                            if (!result.success) { Alert.alert('Error', result.message || 'Could not update status'); return; }
                            setCustomerDetail(null);
                            await load();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Could not update status');
                        } finally {
                            setBusyId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleToggleAdmin = async (item) => {
        const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
        setBusyId(item.id);
        try {
            const result = await toggleAdminStatus(item.id, nextStatus);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not update status'); return; }
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
    const toggleCity = (city) => setCitiesDraft((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
    const handleSaveCities = async () => {
        const target = citiesTarget;
        setCitiesTarget(null);
        setBusyId(target.id);
        try {
            const result = await updateAdminCities(target.id, citiesDraft);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not save'); return; }
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save');
        } finally {
            setBusyId(null);
        }
    };

    // Client-side only — matches against the gardener/customer lists already
    // loaded for this screen. Pre-fills the name as a convenience; it does
    // NOT merge or upgrade that account, since admin-create is deliberately a
    // brand-new-account flow (see its own comment) and this app's login
    // already resolves a phone against `admin` before `gardener_account`, so
    // silently inserting a same-phone admin row would quietly change which
    // account that phone logs into.
    const handleFindExisting = (text) => {
        setForm((f) => ({ ...f, findPhone: text }));
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length < 10) { setFoundMatch(null); return; }
        const gardener = gardeners.find((g) => g.phone === cleaned);
        const customer = customers.find((c) => c.phone === cleaned);
        if (gardener) {
            setFoundMatch({ label: gardener.fullName, type: 'Professional' });
            setForm((f) => ({ ...f, fullName: gardener.fullName, phone: cleaned }));
        } else if (customer) {
            setFoundMatch({ label: customer.full_name || cleaned, type: 'Customer' });
            setForm((f) => ({ ...f, fullName: customer.full_name || '', phone: cleaned }));
        } else {
            setFoundMatch(null);
        }
    };

    const handleAddAdmin = async () => {
        if (!form.phone || form.phone.length < 10) return Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
        if (!form.fullName.trim()) return Alert.alert('Missing Name', 'Please enter a full name.');
        if (!form.pin || form.pin.length !== 4) return Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');

        setSubmitting(true);
        try {
            const result = await createAdmin(form.phone, form.fullName.trim(), form.pin, form.role, form.allowedCities);
            if (!result.success) { Alert.alert('Error', result.message || 'Could not create account'); return; }
            setAddModalOpen(false);
            setForm(emptyForm);
            setFoundMatch(null);
            await load();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not create account');
        } finally {
            setSubmitting(false);
        }
    };

    const q = search.trim().toLowerCase();

    const filteredGardeners = gardeners.filter((g) => {
        if (q && !((g.fullName || '').toLowerCase().includes(q) || (g.phone || '').includes(q))) return false;
        if (cityFilter !== 'All' && !(g.expectedWorkingCity || []).includes(cityFilter)) return false;
        if (serviceFilter !== 'All' && !(g.areaOfExpertise || []).includes(serviceFilter)) return false;
        return true;
    });
    const filteredCustomers = customers.filter((c) => !q || (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
    const filteredAdmins = admins.filter((a) => !q || (a.full_name || '').toLowerCase().includes(q) || (a.phone || '').includes(q));

    const renderGardener = ({ item }) => (
        <TouchableOpacity onPress={() => setGardenerDetail(item)}>
            <View style={styles.row}>
                <Avatar label={item.fullName} colors={colors} />
                <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{item.fullName}</Text>
                        <View style={styles.idPill}><Text style={styles.idPillText}>W{gardenerRanks.get(item.id)}</Text></View>
                    </View>
                    <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <StatusBadge label={item.status} variant={item.status === 'Active' ? 'success' : 'danger'} />
            </View>
        </TouchableOpacity>
    );

    const renderCustomer = ({ item }) => (
        <TouchableOpacity onPress={() => setCustomerDetail(item)}>
            <View style={styles.row}>
                <Avatar label={item.full_name || item.phone} colors={colors} />
                <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{item.full_name || 'Unnamed Customer'}</Text>
                        <View style={styles.idPill}><Text style={styles.idPillText}>C{customerRanks.get(item.id)}</Text></View>
                    </View>
                    <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <StatusBadge label={item.status} variant={item.status === 'Active' ? 'success' : 'danger'} />
            </View>
        </TouchableOpacity>
    );

    const renderAdmin = ({ item }) => (
        <View style={styles.row}>
            <Avatar label={item.full_name} colors={colors} />
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
                <Text style={styles.roleText}>{roleLabel(item.role)}{item.role !== 'super_admin' ? ` · ${(item.allowed_cities || []).length ? item.allowed_cities.join(', ') : 'All Cities'}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <StatusBadge label={item.status} variant={item.status === 'Active' ? 'success' : 'danger'} />
                {item.role !== 'super_admin' && (
                    busyId === item.id ? <ActivityIndicator size="small" color={colors.brand} /> : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={styles.citiesPill} onPress={() => openCitiesEditor(item)}>
                                <Text style={styles.citiesPillText}>Cities</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={item.status === 'Active' ? styles.disablePill : styles.enablePill}
                                onPress={() => handleToggleAdmin(item)}
                            >
                                <Text style={item.status === 'Active' ? styles.disablePillText : styles.enablePillText}>
                                    {item.status === 'Active' ? 'Disable' : 'Enable'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}
            </View>
        </View>
    );

    const listProps = { keyExtractor: (item) => item.id, contentContainerStyle: styles.listContent };

    return (
        <View style={styles.container}>
            <Header4Admin />

            <View style={styles.subHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.brand} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
            </View>

            <View style={styles.tabsRow}>
                {TABS.map((t) => (
                    <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                        {tab === t.key && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.filtersArea}>
                {tab === 'admins' && (
                    <AdminButton
                        variant="brand"
                        label="+  Add Admin"
                        onPress={() => setAddModalOpen(true)}
                        style={{ marginBottom: 12 }}
                    />
                )}

                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or phone"
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {tab === 'professionals' && (
                    <View style={styles.filtersRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.filterLabel}>City</Text>
                            <TouchableOpacity style={styles.filterTrigger} onPress={() => setCityFilterOpen(true)}>
                                <Text style={styles.filterTriggerText}>{cityFilter}</Text>
                                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.filterLabel}>Service</Text>
                            <TouchableOpacity style={styles.filterTrigger} onPress={() => setServiceFilterOpen(true)}>
                                <Text style={styles.filterTriggerText} numberOfLines={1}>{serviceFilter}</Text>
                                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            ) : tab === 'professionals' ? (
                <FlatList {...listProps} data={filteredGardeners} renderItem={renderGardener} ListEmptyComponent={<Text style={styles.emptyText}>No gardeners found.</Text>} />
            ) : tab === 'customers' ? (
                <FlatList {...listProps} data={filteredCustomers} renderItem={renderCustomer} ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>} />
            ) : (
                <FlatList {...listProps} data={filteredAdmins} renderItem={renderAdmin} ListEmptyComponent={<Text style={styles.emptyText}>No accounts yet.</Text>} />
            )}

            {/* City filter dropdown */}
            <Modal visible={cityFilterOpen} transparent animationType="fade" onRequestClose={() => setCityFilterOpen(false)}>
                <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setCityFilterOpen(false)}>
                    <View style={styles.dropdownMenu}>
                        {['All', ...CITY_NAMES].map((c) => (
                            <TouchableOpacity key={c} style={styles.dropdownOption} onPress={() => { setCityFilter(c); setCityFilterOpen(false); }}>
                                <Text style={[styles.dropdownOptionText, c === cityFilter && styles.dropdownOptionTextActive]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Service filter dropdown */}
            <Modal visible={serviceFilterOpen} transparent animationType="fade" onRequestClose={() => setServiceFilterOpen(false)}>
                <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setServiceFilterOpen(false)}>
                    <View style={styles.dropdownMenu}>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {['All', ...SERVICE_NAMES].map((s) => (
                                <TouchableOpacity key={s} style={styles.dropdownOption} onPress={() => { setServiceFilter(s); setServiceFilterOpen(false); }}>
                                    <Text style={[styles.dropdownOptionText, s === serviceFilter && styles.dropdownOptionTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Professional detail sheet */}
            <Modal visible={!!gardenerDetail} transparent animationType="slide" onRequestClose={() => setGardenerDetail(null)}>
                <View style={styles.detailOverlay}>
                    <View style={styles.detailSheet}>
                        <View style={styles.sheetHandle} />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setGardenerDetail(null)}>
                            <Ionicons name="close" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
                            <Avatar label={gardenerDetail?.fullName} colors={colors} size={90} />
                            <Text style={styles.detailName}>{gardenerDetail?.fullName}</Text>
                            <View style={styles.idPillLarge}><Text style={styles.idPillText}>W{gardenerDetail && gardenerRanks.get(gardenerDetail.id)}</Text></View>
                            <StatusBadge label={gardenerDetail?.status} variant={gardenerDetail?.status === 'Active' ? 'success' : 'danger'} />

                            <View style={styles.detailCard}>
                                <Text style={styles.sectionLabel}>Phone Number</Text>
                                <View style={styles.phoneRow}>
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${gardenerDetail?.phone}`)}>
                                        <Text style={styles.phoneText}>+977 {gardenerDetail?.phone}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/977${gardenerDetail?.phone}`)}>
                                        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.detailCard}>
                                <Text style={styles.sectionLabel}>City</Text>
                                <Text style={styles.plainValue}>{(gardenerDetail?.expectedWorkingCity || []).join(', ') || '—'}</Text>
                            </View>

                            <View style={styles.detailCard}>
                                <Text style={styles.sectionLabel}>Services</Text>
                                <View style={styles.chipRow}>
                                    {(gardenerDetail?.areaOfExpertise || []).length > 0
                                        ? gardenerDetail.areaOfExpertise.map((s) => <View key={s} style={styles.serviceChip}><Text style={styles.serviceChipText}>{s}</Text></View>)
                                        : <Text style={styles.plainValue}>—</Text>}
                                </View>
                            </View>

                            <View style={styles.detailCard}>
                                <Text style={styles.sectionLabel}>Joined</Text>
                                <Text style={styles.plainValue}>{formatDateTime(gardenerDetail?.createdAt)}</Text>
                            </View>

                            {busyId === gardenerDetail?.id ? (
                                <ActivityIndicator size="small" color={colors.brand} style={{ marginTop: 8 }} />
                            ) : (
                                <TouchableOpacity
                                    style={[styles.fullWidthActionBtn, gardenerDetail?.status === 'Active' ? styles.dangerActionBtn : styles.successActionBtn]}
                                    onPress={() => handleToggleGardener(gardenerDetail)}
                                >
                                    <Text style={[styles.actionBtnText, gardenerDetail?.status === 'Active' ? styles.dangerActionText : styles.successActionText]}>
                                        {gardenerDetail?.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Customer detail sheet */}
            <Modal visible={!!customerDetail} transparent animationType="slide" onRequestClose={() => setCustomerDetail(null)}>
                <View style={styles.detailOverlay}>
                    <View style={styles.detailSheet}>
                        <View style={styles.sheetHandle} />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setCustomerDetail(null)}>
                            <Ionicons name="close" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center', paddingBottom: 20 }}>
                            <Avatar label={customerDetail?.full_name || customerDetail?.phone} colors={colors} size={90} />
                            <Text style={styles.detailName}>{customerDetail?.full_name || 'Unnamed Customer'}</Text>
                            <View style={styles.idPillLarge}><Text style={styles.idPillText}>C{customerDetail && customerRanks.get(customerDetail.id)}</Text></View>
                            <StatusBadge label={customerDetail?.status} variant={customerDetail?.status === 'Active' ? 'success' : 'danger'} />

                            <View style={styles.detailCard}>
                                <Text style={styles.sectionLabel}>Phone Number</Text>
                                <View style={styles.phoneRow}>
                                    <TouchableOpacity onPress={() => Linking.openURL(`tel:+977${customerDetail?.phone}`)}>
                                        <Text style={styles.phoneText}>+977 {customerDetail?.phone}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/977${customerDetail?.phone}`)}>
                                        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {busyId === customerDetail?.id ? (
                                <ActivityIndicator size="small" color={colors.brand} style={{ marginTop: 8 }} />
                            ) : (
                                <TouchableOpacity
                                    style={[styles.fullWidthActionBtn, customerDetail?.status === 'Active' ? styles.dangerActionBtn : styles.successActionBtn]}
                                    onPress={() => handleToggleCustomer(customerDetail)}
                                >
                                    <Text style={[styles.actionBtnText, customerDetail?.status === 'Active' ? styles.dangerActionText : styles.successActionText]}>
                                        {customerDetail?.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Admin */}
            <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
                <View style={styles.detailOverlay}>
                    <View style={styles.detailSheet}>
                        <View style={styles.sheetHandle} />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => { setAddModalOpen(false); setForm(emptyForm); setFoundMatch(null); }}>
                            <Ionicons name="close" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                            <Text style={styles.addAdminTitle}>Add Admin</Text>

                            <Text style={styles.fieldLabel}>Find Existing Professional or Customer</Text>
                            <View style={styles.searchWrap}>
                                <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search by phone number"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    value={form.findPhone}
                                    onChangeText={handleFindExisting}
                                />
                            </View>
                            {foundMatch && (
                                <Text style={styles.foundText}>Found: {foundMatch.label} ({foundMatch.type})</Text>
                            )}

                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor={colors.textMuted} value={form.fullName} onChangeText={(t) => setForm((f) => ({ ...f, fullName: t }))} />

                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <TextInput style={styles.input} placeholder="98XXXXXXXX" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={10} value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t.replace(/[^0-9]/g, '') }))} />
                            <Text style={styles.helperText}>If this phone number already has an account (e.g. a Professional), a separate admin account is created for it — name and PIN below are used either way.</Text>

                            <Text style={styles.fieldLabel}>4-Digit PIN</Text>
                            <TextInput style={styles.input} placeholder="1234" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={4} secureTextEntry value={form.pin} onChangeText={(t) => setForm((f) => ({ ...f, pin: t.replace(/[^0-9]/g, '') }))} />

                            <Text style={styles.fieldLabel}>Role</Text>
                            <View style={styles.chipGrid}>
                                {ROLES.map((r) => (
                                    <TouchableOpacity key={r.value} style={[styles.chip, form.role === r.value && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, role: r.value }))}>
                                        <Text style={[styles.chipText, form.role === r.value && styles.chipTextActive]}>{r.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.fieldLabel}>City Access</Text>
                            <Text style={styles.helperText}>Choose which cities this admin can operate in, or leave &quot;All Cities&quot; for unrestricted access.</Text>
                            <View style={styles.chipGrid}>
                                <TouchableOpacity
                                    style={[styles.chip, form.allowedCities.length === 0 && styles.chipActive]}
                                    onPress={() => setForm((f) => ({ ...f, allowedCities: [] }))}
                                >
                                    <Text style={[styles.chipText, form.allowedCities.length === 0 && styles.chipTextActive]}>All Cities</Text>
                                </TouchableOpacity>
                                {CITY_NAMES.map((city) => {
                                    const selected = form.allowedCities.includes(city);
                                    return (
                                        <TouchableOpacity key={city} style={[styles.chip, selected && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, allowedCities: selected ? f.allowedCities.filter((c) => c !== city) : [...f.allowedCities, city] }))}>
                                            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{city}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <AdminButton variant="brand" label="Create Admin Account" onPress={handleAddAdmin} loading={submitting} style={{ marginTop: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit admin cities */}
            <Modal visible={!!citiesTarget} transparent animationType="fade" onRequestClose={() => setCitiesTarget(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Allowed Cities</Text>
                        <Text style={styles.modalSubtitle}>{citiesTarget?.full_name}</Text>
                        <View style={styles.chipGrid}>
                            {CITY_NAMES.map((city) => {
                                const selected = citiesDraft.includes(city);
                                return (
                                    <TouchableOpacity key={city} style={[styles.chip, selected && styles.chipActive]} onPress={() => toggleCity(city)}>
                                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{city}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.modalButtonsRow}>
                            <Pressable style={styles.modalCancelButton} onPress={() => setCitiesTarget(null)}>
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <AdminButton variant="brand" label="Save" onPress={handleSaveCities} />
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
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    headerTitle: { color: colors.brand, fontSize: 18, fontWeight: '700', flex: 1 },
    tabsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    tabText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
    tabTextActive: { color: colors.brand },
    tabUnderline: { height: 2, backgroundColor: colors.brand, width: '60%', marginTop: 8, borderRadius: 1 },
    filtersArea: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.background },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    filtersRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
    filterLabel: { fontSize: 11, fontWeight: '800', color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    filterTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface },
    filterTriggerText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', flexShrink: 1 },
    listContent: { padding: 16, gap: 10 },
    emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    phone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    roleText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    idPill: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    idPillLarge: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8, marginBottom: 8 },
    idPillText: { fontSize: 12, fontWeight: '700', color: colors.brand },
    citiesPill: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    citiesPillText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
    disablePill: { backgroundColor: colors.dangerBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    disablePillText: { fontSize: 12, fontWeight: '700', color: colors.danger },
    enablePill: { backgroundColor: colors.successBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    enablePillText: { fontSize: 12, fontWeight: '700', color: colors.success },
    dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', padding: 24 },
    dropdownMenu: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 6, maxHeight: 400 },
    dropdownOption: { paddingVertical: 12, paddingHorizontal: 18 },
    dropdownOptionText: { fontSize: 14, color: colors.textSecondary },
    dropdownOptionTextActive: { color: colors.brand, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, gap: 10, maxHeight: '85%' },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    modalSubtitle: { fontSize: 12, color: colors.textMuted },
    detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    detailSheet: { backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingTop: 14, maxHeight: '90%' },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 8 },
    closeBtn: { position: 'absolute', top: 14, right: 16, zIndex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 6 },
    addAdminTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 16 },
    detailName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 12 },
    detailCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, width: '100%', marginTop: 12 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    phoneText: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textDecorationLine: 'underline' },
    plainValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    serviceChip: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    serviceChipText: { fontSize: 12, fontWeight: '600', color: colors.brand },
    fullWidthActionBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 20 },
    dangerActionBtn: { backgroundColor: colors.dangerBg },
    successActionBtn: { backgroundColor: colors.successBg },
    actionBtnText: { fontSize: 15, fontWeight: '800' },
    dangerActionText: { color: colors.danger },
    successActionText: { color: colors.success },
    fieldLabel: { fontSize: 11, fontWeight: '800', color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
    helperText: { fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 17 },
    foundText: { fontSize: 12, color: colors.success, fontWeight: '700', marginTop: 6 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.textPrimary, backgroundColor: colors.surface },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8, alignItems: 'center' },
    modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
    modalCancelButtonText: { color: colors.textSecondary, fontWeight: '600' },
});
