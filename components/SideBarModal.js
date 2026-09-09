import { AdminAuthContext } from '@/context/AdminAuthContext';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(width * 0.75, 300);

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    bdm: 'Business Development Manager',
    call_center: 'Call Center',
    gardener: 'Gardener',
};

// Mirrors each screen's own server-side role gate (see their Edge Functions'
// CAN_VIEW/CAN_REVIEW/ALLOWED_ROLES sets) so the drawer only ever offers a
// link a role can actually use.
const BACK_OFFICE_ROLES = new Set(['super_admin', 'admin', 'bdm', 'call_center']);
const LEAD_REVIEW_ROLES = new Set(['super_admin', 'admin', 'bdm']);
const BOOKING_SUBMIT_ROLES = new Set(['bdm', 'call_center']);
const BROADCAST_ROLES = new Set(['super_admin']);

const SideBarModal = ({ onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminLoggedIn, adminRole, adminDisplayName, adminPhone } = useContext(AdminAuthContext);

    const handleNavigation = (path) => {
        onClose();
        router.push(path);
    };

    const isActive = (targetPath) => {
        if (!pathname) return false;

        if (targetPath === '/(tabs)' || targetPath === '/') {
            return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
        }

        if (targetPath === '/(tabs)/services') {
            return pathname.startsWith('/services') || pathname.startsWith('/(tabs)/services');
        }

        if (targetPath === '/notifications') {
            return pathname.startsWith('/notifications') || pathname.startsWith('/(tabs)/notifications');
        }

        return pathname === targetPath || pathname === `/(tabs)${targetPath}`;
    };

    const renderMenuItem = (path, iconName, label) => {
        const active = isActive(path);

        return (
            <TouchableOpacity
                key={path}
                style={[styles.item, active && styles.itemActive]}
                activeOpacity={0.7}
                onPress={() => handleNavigation(path)}
            >
                <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                    <Ionicons
                        name={iconName}
                        size={17}
                        color={active ? '#245d5a' : '#6B7280'}
                    />
                </View>
                <Text style={[styles.label, active && styles.labelActive]}>
                    {label}
                </Text>
                {active && <View style={styles.activeBar} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.profileContainer}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={require('@/assets/images/gardensewa.webp')}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                </View>
                {isAdminLoggedIn ? (
                    <>
                        <Text style={styles.brandName}>{adminDisplayName || ROLE_LABELS[adminRole] || 'Staff'}</Text>
                        <Text style={styles.brandTagline}>{adminPhone ? `+977 ${adminPhone}` : (ROLE_LABELS[adminRole] || adminRole)}</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.brandName}>Garden Sewa</Text>
                        <Text style={styles.brandTagline}>gardensewa@sriyog.com</Text>
                    </>
                )}
            </View>

            <View style={styles.menu}>
                {isAdminLoggedIn ? (
                    <>
                        {renderMenuItem('/(tabs)', 'home-outline', 'Home')}
                        {adminRole === 'gardener' && (
                            renderMenuItem('/booking', 'leaf-outline', 'My Leads & Bookings')
                        )}
                        {renderMenuItem(
                            BROADCAST_ROLES.has(adminRole) ? '/sendNotification' : '/notifications',
                            'notifications-outline',
                            'Notifications'
                        )}
                        {BACK_OFFICE_ROLES.has(adminRole) && (
                            renderMenuItem('/popupBanner', 'pricetags-outline', 'Popup Banner')
                        )}
                        {BACK_OFFICE_ROLES.has(adminRole) && (
                            renderMenuItem('/gardenerApplications', 'checkmark-done-outline', 'Gardener Applications')
                        )}
                        {LEAD_REVIEW_ROLES.has(adminRole) && (
                            renderMenuItem('/leadUnlockRequests', 'cash-outline', 'Lead Unlock Requests')
                        )}
                        {BOOKING_SUBMIT_ROLES.has(adminRole) && (
                            renderMenuItem('/submitBookingForCustomer', 'call-outline', 'Submit Booking for Customer')
                        )}
                        {BACK_OFFICE_ROLES.has(adminRole) && (
                            renderMenuItem('/helpboxRequests', 'help-buoy-outline', 'Help Box Requests')
                        )}
                        {BACK_OFFICE_ROLES.has(adminRole) && (
                            renderMenuItem('/partnershipApplications', 'briefcase-outline', 'Partnership Applications')
                        )}
                        {adminRole === 'super_admin' && (
                            <>
                                <Text style={styles.sectionLabel}>Super Admin</Text>
                                {renderMenuItem('/manageStaff', 'people-outline', 'Manage Staff')}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {renderMenuItem('/(tabs)', 'home-outline', 'Home')}
                        {renderMenuItem('/(tabs)/services', 'grid-outline', 'Services')}
                        {renderMenuItem('/book', 'calendar-outline', 'Book a Service')}
                        {renderMenuItem('/joinasaprofessional', 'person-add-outline', 'Join as a Professional')}

                        <View style={styles.divider} />

                        {renderMenuItem('/about', 'information-circle-outline', 'About Us')}
                        {renderMenuItem('/contact', 'mail-outline', 'Contact')}
                        {renderMenuItem('/faq', 'help-circle-outline', 'FAQs')}
                        {renderMenuItem('/glossary', 'book-outline', 'Glossary')}
                        {renderMenuItem('/becomeAPartner', 'shield-checkmark-outline', 'Become a Partner')}
                        {renderMenuItem('/favorites', 'heart-outline', 'Favorites')}
                    </>
                )}
            </View>

            <View style={styles.adminWrapper}>
                <TouchableOpacity
                    style={styles.adminBtn}
                    activeOpacity={0.85}
                    onPress={() => handleNavigation(isAdminLoggedIn ? '/updateProfile' : '/adminLogin')}
                >
                    <Ionicons
                        name={isAdminLoggedIn ? 'person-outline' : 'shield-checkmark-outline'}
                        size={16}
                        color="#fff"
                    />
                    <Text style={styles.adminBtnText}>{isAdminLoggedIn ? 'Update Profile' : 'Admin Login'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        bottom: 60,
        width: SIDEBAR_WIDTH,
        backgroundColor: 'white',
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 16,
        zIndex: 10000,
        overflow: 'hidden',
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#245d5a',
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.6)',
        overflow: 'hidden',
        marginBottom: 6,
        backgroundColor: '#E5E7EB',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    brandName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    brandTagline: {
        fontSize: 10,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    menu: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 2,
        justifyContent: 'space-evenly',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    divider: {
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 14,
        position: 'relative',
    },
    itemActive: {
        backgroundColor: 'rgba(36, 93, 90, 0.06)',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 9,
    },
    iconBoxActive: {
        backgroundColor: '#C9E8E6',
    },
    label: {
        fontSize: 13.5,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
    },
    labelActive: {
        color: '#245d5a',
        fontWeight: '700',
    },
    activeBar: {
        width: 3,
        height: 20,
        borderRadius: 2,
        backgroundColor: '#245d5a',
    },
    adminWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    adminBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: '#245d5a',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    adminBtnText: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
});

export default SideBarModal;
