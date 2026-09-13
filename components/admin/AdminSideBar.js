import { AdminAuthContext } from '@/context/AdminAuthContext';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useContext, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const roleLabel = (role) => ({
    super_admin: 'Super Admin',
    admin: 'Admin',
    bdm: 'Business Development Manager',
    call_center: 'Call Center',
}[role] || role);

// Matches HomeSewa's real drawer exactly: Home/Booking History/Popup
// Banner/Help Box general to every back-office role, a Super Admin section
// below the divider — plus Lead Unlock Requests and Submit Booking for
// Customer, which have no HomeSewa equivalent but are real GardenSewa
// capabilities kept general rather than dropped.
const MENU_ITEMS = [
    { path: '/(tabs)', icon: 'home-outline', label: 'Home' },
    { path: '/(admin)/bookings', icon: 'time-outline', label: 'Booking History' },
    { path: '/(admin)/popupBanner', icon: 'pricetag-outline', label: 'Popup Banner' },
    { path: '/(admin)/helpboxRequests', icon: 'chatbubble-ellipses-outline', label: 'Help Box' },
    { path: '/(admin)/leadUnlockRequests', icon: 'cash-outline', label: 'Lead Unlock Requests' },
    { path: '/(admin)/submitBookingForCustomer', icon: 'create-outline', label: 'Submit Booking for Customer', roles: ['bdm', 'call_center'] },
];

// Notifications lives here rather than in the general section like HomeSewa's
// own drawer — sendNotification.js itself is still gated to super_admin only
// (GardenSewa has no personal "my notifications" inbox for other roles the
// way HomeSewa does), so showing it generally would just be a dead-end tap
// for admin/bdm/call_center.
const SUPER_ADMIN_ITEMS = [
    { path: '/(admin)/userManagement', icon: 'people-outline', label: 'User Management' },
    { path: '/(admin)/gardenerApplications', icon: 'shield-checkmark-outline', label: 'Verification' },
    { path: '/(admin)/partnershipApplications', icon: 'briefcase-outline', label: 'Partnerships' },
    { path: '/(admin)/sendNotification', icon: 'notifications-outline', label: 'Notifications' },
    { path: '/(admin)/changePin', icon: 'key-outline', label: 'Change PIN' },
];

export default function AdminSideBar({ visible, onClose }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
    const { adminRole, adminDisplayName, adminPhone } = useContext(AdminAuthContext);
    const pathname = usePathname();

    if (!visible) return null;

    const goTo = (path) => {
        onClose();
        router.push(path);
    };

    const visibleExtras = MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(adminRole));
    const showSuperAdminSection = adminRole === 'super_admin';

    const renderItem = (item) => {
        const active = pathname === item.path.replace('/(admin)', '');
        return (
            <TouchableOpacity
                key={item.path}
                style={[styles.linkRow, active && styles.activeLinkRow]}
                activeOpacity={0.7}
                onPress={() => goTo(item.path)}
            >
                <View style={[styles.iconBadge, active && styles.activeIconBadge]}>
                    <Ionicons name={item.icon} size={16} color={colors.brand} />
                </View>
                <Text style={[styles.linkText, active && styles.activeLinkText]}>{item.label}</Text>
                {active && <View style={styles.activeBar} />}
            </TouchableOpacity>
        );
    };

    return (
        // Header4Admin (which mounts this) is the first child of every admin
        // screen, so without an explicit zIndex this absolute overlay paints
        // in DOM order — i.e. *underneath* the screen's later siblings
        // (subheader, tabs, list) instead of on top of them.
        <View style={[StyleSheet.absoluteFillObject, styles.overlayRoot]} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
                <View style={styles.backdrop} />
            </Pressable>

            <View style={styles.panel}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Image source={require('@/assets/images/gardensewa.webp')} style={styles.avatarImage} />
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>{adminDisplayName || 'Admin'}</Text>
                    <Text style={styles.profileRole}>{roleLabel(adminRole)}</Text>
                    {adminPhone ? <Text style={styles.profilePhone}>+977 {adminPhone}</Text> : null}
                </View>

                <View style={styles.menu}>
                    {visibleExtras.map(renderItem)}

                    {showSuperAdminSection && (
                        <>
                            <View style={styles.sectionDivider} />
                            <Text style={styles.sectionLabel}>Super Admin</Text>
                            {SUPER_ADMIN_ITEMS.map(renderItem)}
                        </>
                    )}
                </View>

                <View style={styles.bottomSection}>
                    <TouchableOpacity style={styles.updateProfileButton} activeOpacity={0.8} onPress={() => goTo('/updateProfile')}>
                        <Ionicons name="person-outline" size={18} color="#fff" />
                        <Text style={styles.updateProfileButtonText}>Update Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const createStyles = (colors, topInset) => StyleSheet.create({
    overlayRoot: { zIndex: 9999, elevation: 16 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    panel: {
        position: 'absolute',
        top: topInset + 60,
        left: 16,
        bottom: 30,
        width: 300,
        maxWidth: '80%',
        backgroundColor: colors.surface,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
        overflow: 'hidden',
    },
    profileHeader: {
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.brand,
        paddingVertical: 22,
        paddingHorizontal: 16,
    },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    profileName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    profileRole: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    // HomeSewa's real drawer never scrolls — every item is laid out with
    // space-evenly so it always fits the panel's fixed height instead
    // (mirrors the same recipe components/SideBarModal.js already uses for
    // the customer-facing drawer). A ScrollView here would be an easy
    // default, but it's not what the reference actually does.
    menu: {
        flex: 1,
        justifyContent: 'space-evenly',
        paddingHorizontal: 12,
    },
    sectionDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 8 },
    sectionLabel: {
        fontSize: 10, fontWeight: '800', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginLeft: 8,
    },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 3, paddingHorizontal: 8,
        borderRadius: 14, position: 'relative',
    },
    activeLinkRow: { backgroundColor: colors.surfaceMuted },
    iconBadge: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center', justifyContent: 'center',
    },
    activeIconBadge: { backgroundColor: colors.background },
    linkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, flex: 1 },
    activeLinkText: { color: colors.brand, fontWeight: '700' },
    activeBar: {
        position: 'absolute', right: 0, top: 10, bottom: 10, width: 3,
        backgroundColor: colors.brand, borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10, gap: 12,
        borderTopWidth: 1, borderTopColor: colors.divider,
    },
    updateProfileButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.brand, paddingVertical: 12, borderRadius: 25,
    },
    updateProfileButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
