import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(width * 0.75, 300);

const SideBarModal = ({ onClose }) => {
    const router = useRouter();
    const pathname = usePathname();

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

    const renderMenuItem = (path, iconName, label, isSecondary = false) => {
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
                <Ionicons
                    name={iconName}
                    size={isSecondary ? 18 : 20}
                    color={active ? "#245d5a" : (isSecondary ? "#6B7280" : "#374151")}
                />
                <Text
                    style={[
                        isSecondary ? styles.linkItemSecondary : styles.linkItem,
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
            <View style={styles.profileContainer}>
                <Image
                    source={require('@/assets/images/gardensewa.webp')}
                    style={styles.avatarPlaceholder}
                    resizeMode="cover"
                />
                <View style={styles.profileDetails}>
                    <Text style={styles.profileName}>Garden Sewa</Text>
                    <Text style={styles.profileEmail}>gardensewa@sriyog.com</Text>
                </View>
            </View>

            <View style={styles.adminButtonWrapper}>
                <TouchableOpacity
                    style={[
                        styles.adminLoginButton,
                        isActive('/adminLogin') && styles.adminActiveButton
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleNavigation('/adminLogin')}
                >
                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.adminButtonText}>Admin Login</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.primaryLinks}>
                    {/* <Text style={styles.sectionTitle}>Menu</Text> */}

                    {renderMenuItem('/(tabs)', 'home-outline', 'Home')}
                    {renderMenuItem('/(tabs)/services', 'grid-outline', 'Services')}
                    {/* {renderMenuItem('/notifications', 'notifications-outline', 'Notifications')} */}
                    {renderMenuItem('/book', 'calendar-outline', 'Book a Service')}
                    {renderMenuItem('/joinasaprofessional', 'person-add-outline', 'Join as a Professional')}
                </View>

                <View style={styles.secondaryLinks}>
                    {renderMenuItem('/about', 'information-circle-outline', 'About Us', true)}
                    {renderMenuItem('/contact', 'mail-outline', 'Contact', true)}
                    {renderMenuItem('/faq', 'help-circle-outline', 'FAQs', true)}
                    {renderMenuItem('/glossary', 'book-outline', 'Glossary', true)}
                    {renderMenuItem('/becomeAPartner', 'shield-checkmark-outline', 'Become a Partner', true)}
                    {renderMenuItem('/favorites', "heart-outline",'Favorites', true)}
                </View>
            </ScrollView>
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
        gap: 4,
        backgroundColor: "#245d5a",
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    profileDetails: {
        alignItems: 'center',
        width: '100%',
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileEmail: {
        fontSize: 12,
        color: '#E0F2FE',
        marginTop: 2,
    },
    scrollContent: {
        paddingVertical: 4,
    },
    primaryLinks: {
        gap: 4,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9CA3AF',
        fontWeight: '700',
        marginBottom: 4,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        position: 'relative',
    },
    activeLinkRow: {
        backgroundColor: 'rgba(36, 93, 90, 0.06)',
    },
    linkItem: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
    },
    linkItemSecondary: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    activeLinkText: {
        color: '#245d5a',
        fontWeight: '700',
    },
    activeBorderRight: {
        position: 'absolute',
        right: 0,
        top: 6,
        bottom: 6,
        width: 4,
        backgroundColor: '#245d5a',
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
    },
    secondaryLinks: {
        gap: 4,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
        paddingHorizontal: 20,
        marginTop: 12,
    },
    adminButtonWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        paddingTop: 16,
        backgroundColor: '#ffffff',
    },
    adminLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#245d5a',
        paddingVertical: 12,
        borderRadius: 14,
        width: '70%'
    },
    adminActiveButton: {
        borderWidth: 2,
        borderColor: '#10B981',
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default SideBarModal;