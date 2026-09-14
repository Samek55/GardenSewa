import { AdminAuthContext } from '@/context/AdminAuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useContext, useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Hardcoded rather than pulled from ThemeContext, same as the customer
// drawer (components/SideBarModal.js / LoggedInSideBar.js) — admin has no
// dark-mode toggle of its own, so if a customer session on the same device
// had previously switched to dark mode, useTheme() would silently carry
// that into the admin drawer with no way for an admin to switch it back.
const COLORS = {
    background: '#FFFFFF',
    surfaceMuted: '#EDF6F5',
    activeSurface: '#E8F4F3',
    activeIconBg: '#D1EAE7',
    brand: '#245d5a',
    textSecondary: '#4A5568',
    textMuted: '#9BBAB8',
    divider: '#F0F7F6',
};

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
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(COLORS, insets.top), [insets.top]);
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
                    <Ionicons name={item.icon} size={18} color={COLORS.brand} />
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

                <ScrollView
                    style={styles.menu}
                    contentContainerStyle={styles.menuContent}
                    showsVerticalScrollIndicator={false}
                >
                    {visibleExtras.map(renderItem)}

                    {showSuperAdminSection && (
                        <>
                            <View style={styles.sectionDivider} />
                            <Text style={styles.sectionLabel}>Super Admin</Text>
                            {SUPER_ADMIN_ITEMS.map(renderItem)}
                        </>
                    )}
                </ScrollView>

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
        backgroundColor: colors.background,
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
    profileName: { fontSize: 17, fontWeight: '700', color: '#fff' },
    profileRole: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    // Tightly packed like the customer drawer (components/LoggedInSideBar.js)
    // instead of space-evenly spreading items across the full panel height —
    // wrapped in a ScrollView since the Super Admin section can push the
    // total item count past what fits on shorter screens.
    menu: {
        flex: 1,
    },
    menuContent: {
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    sectionDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 8, marginVertical: 4 },
    sectionLabel: {
        fontSize: 10, fontWeight: '800', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginLeft: 8, marginBottom: 2,
    },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 6, paddingHorizontal: 8,
        borderRadius: 16, position: 'relative',
    },
    activeLinkRow: { backgroundColor: colors.activeSurface },
    iconBadge: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center', justifyContent: 'center',
    },
    activeIconBadge: { backgroundColor: colors.activeIconBg },
    linkText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, flex: 1 },
    activeLinkText: { color: colors.brand, fontWeight: '700' },
    activeBar: {
        position: 'absolute', right: 0, top: 10, bottom: 10, width: 4,
        backgroundColor: colors.brand, borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8,
    },
    updateProfileButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.brand, paddingVertical: 12, borderRadius: 25,
    },
    updateProfileButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
