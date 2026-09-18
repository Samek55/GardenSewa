import { AdminAuthContext } from '@/context/AdminAuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useContext, useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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

// Matches HomeSewa's real drawer order: Home/Booking History/Notifications/
// Popup Banner/Help Box general to every back-office role, a Super Admin
// section below the divider — plus Lead Unlock Requests and Submit Booking
// for Customer, which have no HomeSewa equivalent but are real GardenSewa
// capabilities kept general rather than dropped. Notifications here is the
// personal inbox (app/(all)/notifications.js, via listMyNotificationsAsStaff)
// which every admin role already has — distinct from the super-admin-only
// broadcast composer below.
const MENU_ITEMS = [
    { path: '/(tabs)', icon: 'home-outline', label: 'Home' },
    { path: '/(admin)/bookings', icon: 'time-outline', label: 'Booking History' },
    { path: '/notifications', icon: 'notifications-outline', label: 'Notifications' },
    { path: '/(admin)/popupBanner', icon: 'pricetag-outline', label: 'Popup Banner' },
    { path: '/(admin)/helpboxRequests', icon: 'chatbubble-ellipses-outline', label: 'Help Box' },
    { path: '/(admin)/submitBookingForCustomer', icon: 'create-outline', label: 'Submit Booking for Customer', roles: ['bdm', 'call_center'] },
];

const SUPER_ADMIN_ITEMS = [
    { path: '/(admin)/userManagement', icon: 'people-outline', label: 'User Management' },
    { path: '/(admin)/gardenerApplications', icon: 'shield-checkmark-outline', label: 'Verification' },
    { path: '/(admin)/partnershipApplications', icon: 'briefcase-outline', label: 'Partnerships' },
    { path: '/(admin)/sendNotification', icon: 'megaphone-outline', label: 'Send Notification' },
    { path: '/(admin)/changePin', icon: 'key-outline', label: 'Change PIN' },
];

const PANEL_TOP_OFFSET = 50;
const PANEL_BOTTOM_MARGIN = 16;

export default function AdminSideBar({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    // Every row (11-13 depending on role) has to fit without scrolling, so the
    // panel's height is capped to whatever vertical space is actually
    // available instead of stretching to a fixed top/bottom — with a fixed
    // height, content taller than the box used to render past it and get
    // painted under the Update Profile button instead of pushing it down.
    const maxPanelHeight = windowHeight - insets.top - PANEL_TOP_OFFSET - PANEL_BOTTOM_MARGIN;
    const styles = useMemo(
        () => createStyles(COLORS, insets.top, maxPanelHeight),
        [insets.top, maxPanelHeight]
    );
    const { adminRole, adminDisplayName, adminPhone } = useContext(AdminAuthContext);
    const pathname = usePathname();

    if (!visible) return null;

    const goTo = (path) => {
        onClose();
        router.push(path);
    };

    const visibleExtras = MENU_ITEMS.filter((item) => !item.roles || item.roles.includes(adminRole));
    const isSuperAdmin = adminRole === 'super_admin';

    const renderItem = (item, locked = false) => {
        const active = !locked && pathname === item.path.replace('/(admin)', '');
        return (
            <TouchableOpacity
                key={item.path}
                style={[styles.linkRow, active && styles.activeLinkRow]}
                activeOpacity={locked ? 1 : 0.7}
                onPress={() => {
                    if (locked) {
                        Alert.alert('Super Admin Only', 'This section is only available to Super Admin accounts.');
                        return;
                    }
                    goTo(item.path);
                }}
            >
                <View style={[styles.iconBadge, active && styles.activeIconBadge, locked && styles.lockedIconBadge]}>
                    <Ionicons name={locked ? 'lock-closed-outline' : item.icon} size={16} color={locked ? COLORS.textMuted : COLORS.brand} />
                </View>
                <Text style={[styles.linkText, active && styles.activeLinkText, locked && styles.lockedLinkText]}>{item.label}</Text>
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

                <View style={styles.menuContent}>
                    {visibleExtras.map((item) => renderItem(item))}

                    <View style={styles.sectionDivider} />
                    <Text style={styles.sectionLabel}>Super Admin</Text>
                    {SUPER_ADMIN_ITEMS.map((item) => renderItem(item, !isSuperAdmin))}
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

const createStyles = (colors, topInset, maxPanelHeight) => StyleSheet.create({
    overlayRoot: { zIndex: 9999, elevation: 16 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    panel: {
        position: 'absolute',
        top: topInset + PANEL_TOP_OFFSET,
        left: 16,
        maxHeight: maxPanelHeight,
        width: 300,
        maxWidth: '80%',
        backgroundColor: colors.background,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
        // Sized to content (not stretched via a fixed bottom) so every row
        // fits without a scroll view; overflow:hidden is just a last-resort
        // clip on very short screens instead of the button overlapping rows.
        overflow: 'hidden',
    },
    profileHeader: {
        alignItems: 'center',
        gap: 2,
        backgroundColor: colors.brand,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    profileName: { fontSize: 15, fontWeight: '700', color: '#fff' },
    profileRole: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
    profilePhone: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    // Sized to its content (no flex:1) so the column lays out honestly:
    // header, then exactly as much space as the rows need, then the button —
    // never overlapping, never needing a scroll view.
    menuContent: {
        gap: 2,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    sectionDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: 8, marginVertical: 2 },
    sectionLabel: {
        fontSize: 10, fontWeight: '800', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginLeft: 8, marginBottom: 1, marginTop: 1,
    },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 4, paddingHorizontal: 8,
        borderRadius: 14, position: 'relative',
    },
    activeLinkRow: { backgroundColor: colors.activeSurface },
    iconBadge: {
        width: 30, height: 30, borderRadius: 10,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center', justifyContent: 'center',
    },
    activeIconBadge: { backgroundColor: colors.activeIconBg },
    lockedIconBadge: { backgroundColor: colors.divider },
    linkText: { fontSize: 13.5, fontWeight: '600', color: colors.textSecondary, flex: 1 },
    activeLinkText: { color: colors.brand, fontWeight: '700' },
    lockedLinkText: { color: colors.textMuted, fontWeight: '600' },
    activeBar: {
        position: 'absolute', right: 0, top: 7, bottom: 7, width: 4,
        backgroundColor: colors.brand, borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: 16, paddingBottom: 14, paddingTop: 6,
    },
    updateProfileButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.brand, paddingVertical: 10, borderRadius: 25,
    },
    updateProfileButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
