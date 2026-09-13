import { AdminAuthContext } from '@/context/AdminAuthContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useContext } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mirrors HomeSewa's own logged-in drawer exactly (light theme, same item
// set/order) rather than GardenSewa's AdminSideBar -- a gardener isn't an
// office admin and has no use for Popup Banner, Help Box, or Lead Unlock
// Requests, which is what they saw before this existed (AdminSideBar is
// shown to anyone with isAdminLoggedIn true, gardener included).
const MENU_ITEMS = [
    { path: '/(tabs)', icon: 'home-outline', label: 'Home' },
    { path: '/(tabs)/services', icon: null, label: 'Services' },
    { path: '/(professional)/booking', icon: 'time-outline', label: 'Booking History' },
    { path: '/notifications', icon: 'notifications-outline', label: 'Notifications' },
    { path: '/faq', icon: 'help-circle-outline', label: 'FAQs' },
    { path: '/glossary', icon: 'book-outline', label: 'Glossary' },
    { path: '/favorites', icon: 'heart-outline', label: 'Favorites' },
    { path: '/(admin)/changePin', icon: 'key-outline', label: 'Change PIN' },
];

const isActivePath = (pathname, path) => {
    if (path === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    if (path === '/(tabs)/services') return pathname.startsWith('/services');
    if (path === '/(professional)/booking') return pathname.startsWith('/booking');
    if (path === '/(admin)/changePin') return pathname.startsWith('/changePin');
    return pathname === path;
};

export default function ProfessionalSideBar({ visible, onClose }) {
    const insets = useSafeAreaInsets();
    const { adminDisplayName, adminPhone } = useContext(AdminAuthContext);
    const pathname = usePathname();

    if (!visible) return null;

    const goTo = (path) => {
        onClose();
        router.push(path);
    };

    return (
        // Header4Admin/root header mount this alongside other screen content,
        // so without an explicit zIndex this absolute overlay paints in DOM
        // order instead of on top of it (same reasoning as AdminSideBar).
        <View style={[StyleSheet.absoluteFillObject, styles.overlayRoot]} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}>
                <View style={styles.backdrop} />
            </Pressable>

            <View style={[styles.panel, { top: insets.top + 60 }]}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Image source={require('@/assets/images/gardensewa.webp')} style={styles.avatarImage} />
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>{adminDisplayName || 'Gardener'}</Text>
                    {adminPhone ? <Text style={styles.profilePhone}>+977 {adminPhone}</Text> : null}
                </View>

                <View style={styles.menu}>
                    {MENU_ITEMS.map((item) => {
                        const active = isActivePath(pathname, item.path);
                        return (
                            <TouchableOpacity
                                key={item.path}
                                style={[styles.linkRow, active && styles.activeLinkRow]}
                                activeOpacity={0.7}
                                onPress={() => goTo(item.path)}
                            >
                                <View style={[styles.iconBadge, active && styles.activeIconBadge]}>
                                    {item.icon ? (
                                        <Ionicons name={item.icon} size={16} color="#245d5a" />
                                    ) : (
                                        <Feather name="tool" size={16} color="#245d5a" />
                                    )}
                                </View>
                                <Text style={[styles.linkText, active && styles.activeLinkText]}>{item.label}</Text>
                                {active && <View style={styles.activeBar} />}
                            </TouchableOpacity>
                        );
                    })}
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

const styles = StyleSheet.create({
    overlayRoot: { zIndex: 9999, elevation: 16 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    panel: {
        position: 'absolute',
        left: 16,
        bottom: 30,
        width: 300,
        maxWidth: '80%',
        backgroundColor: '#ffffff',
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
        backgroundColor: '#245d5a',
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
    profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    // HomeSewa's real drawer never scrolls -- every item is laid out with
    // space-evenly so it always fits the panel's fixed height instead
    // (matches AdminSideBar/SideBarModal's own recipe).
    menu: {
        flex: 1,
        justifyContent: 'space-evenly',
        paddingHorizontal: 12,
    },
    linkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 3, paddingHorizontal: 8,
        borderRadius: 14, position: 'relative',
    },
    activeLinkRow: { backgroundColor: '#E8F4F3' },
    iconBadge: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: '#EDF6F5',
        alignItems: 'center', justifyContent: 'center',
    },
    activeIconBadge: { backgroundColor: '#D1EAE7' },
    linkText: { fontSize: 13, fontWeight: '600', color: '#4A5568', flex: 1 },
    activeLinkText: { color: '#245d5a', fontWeight: '700' },
    activeBar: {
        position: 'absolute', right: 0, top: 10, bottom: 10, width: 3,
        backgroundColor: '#245d5a', borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
    },
    bottomSection: {
        paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10, gap: 12,
        borderTopWidth: 1, borderTopColor: '#EEF1F0',
    },
    updateProfileButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#245d5a', paddingVertical: 12, borderRadius: 25,
    },
    updateProfileButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
