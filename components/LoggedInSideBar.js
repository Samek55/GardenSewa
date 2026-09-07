import { AuthContext } from '@/context/AuthContext';
import { Feather, Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(width * 0.75, 300);

const SideBarModalLoggedIn = ({ onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useContext(AuthContext);

    const handleNavigation = (path) => {
        onClose();
        router.push(path);
    };

    const handleLogout = async () => {
        onClose();
        await logout();
        router.replace('/(tabs)');
    };

    const isActive = (targetPath) => {
        if (!pathname) return false;

        if (targetPath === '/(tabs)' || targetPath === '/') {
            return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
        }

        if (targetPath === '/(tabs)/services') {
            return pathname.startsWith('/services') || pathname.startsWith('/(tabs)/services');
        }

        if (targetPath === '/myBookings') {
            return pathname.startsWith('/myBookings') || pathname.startsWith('/myBookingDetail');
        }

        return pathname === targetPath || pathname === `/(tabs)${targetPath}`;
    };

    const renderMenuItem = (path, iconComponent, label) => {
        const active = isActive(path);

        return (
            <TouchableOpacity
                key={path}
                style={[
                    styles.linkRow,
                    active && styles.activeLinkRow
                ]}
                activeOpacity={0.7}
                onPress={() => handleNavigation(path)}
            >
                <View style={[styles.iconBadge, active && styles.activeIconBadge]}>
                    {React.cloneElement(iconComponent, {
                        color: active ? '#245d5a' : '#245d5a',
                        size: 18,
                    })}
                </View>

                <Text
                    style={[
                        styles.linkItem,
                        active && styles.activeLinkText
                    ]}
                >
                    {label}
                </Text>

                {active && <View style={styles.activeBorderRight} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Profile / Header Section */}
            <View style={styles.profileContainer}>
                <Image
                    source={require('@/assets/images/gardensewa.webp')}
                    style={styles.avatarPlaceholder}
                    resizeMode="cover"
                />
                <View style={styles.profileDetails}>
                    <Text style={styles.profileName}>{user?.name || 'Garden Sewa Customer'}</Text>
                    <Text style={styles.profilePhone}>+977 {user?.phone || ''}</Text>
                </View>
            </View>

            {/* Navigation Menu List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.primaryLinks}>
                    {renderMenuItem('/(tabs)', <SimpleLineIcons name="home" />, 'Home')}
                    {renderMenuItem('/(tabs)/services', <Feather name="tool" />, 'Services')}
                    {renderMenuItem('/myBookings', <Ionicons name="time-outline" />, 'My Bookings')}
                    {renderMenuItem('/notifications', <Ionicons name="notifications-outline" />, 'Notifications')}
                    {renderMenuItem('/faq', <Ionicons name="help-circle-outline" />, 'FAQs')}
                    {renderMenuItem('/glossary', <Ionicons name="book-outline" />, 'Glossary')}
                    {renderMenuItem('/favorites', <Ionicons name="heart-outline" />, 'Favorites')}
                </View>
            </ScrollView>

            {/* Bottom Logout Button */}
            <View style={styles.bottomButtonWrapper}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={18} color="#245d5a" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
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
        bottom: 30,
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
        gap: 6,
        backgroundColor: "#245d5a",
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileDetails: {
        alignItems: 'center',
        width: '100%',
    },
    profileName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profilePhone: {
        fontSize: 12,
        color: '#D0E4E2',
        marginTop: 2,
    },
    scrollContent: {
        paddingVertical: 12,
    },
    primaryLinks: {
        gap: 6,
        paddingHorizontal: 12,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 16,
        position: 'relative',
    },
    activeLinkRow: {
        backgroundColor: '#E8F4F3',
    },
    iconBadge: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EDF6F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIconBadge: {
        backgroundColor: '#D1EAE7',
    },
    linkItem: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4A5568',
        flex: 1,
    },
    activeLinkText: {
        color: '#245d5a',
        fontWeight: '700',
    },
    activeBorderRight: {
        position: 'absolute',
        right: 0,
        top: 10,
        bottom: 10,
        width: 4,
        backgroundColor: '#245d5a',
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    bottomButtonWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 8,
        backgroundColor: '#ffffff',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0F0F0',
        paddingVertical: 12,
        borderRadius: 25,
        width: '100%',
    },
    logoutButtonText: {
        color: '#245d5a',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default SideBarModalLoggedIn;