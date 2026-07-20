import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(width * 0.75, 300);

const SideBarModal = ({ onClose }) => {
    const router = useRouter();

    const handleNavigation = (path) => {
        onClose();
        router.push(path);
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
                    <Text style={styles.profileName}>John Doe</Text>
                    <Text style={styles.profileEmail}>john.doe@example.com</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.primaryLinks}>
                    <Text style={styles.sectionTitle}>Menu</Text>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./')}>
                        <Ionicons name="home-outline" size={20} color="#374151" />
                        <Text style={styles.linkItem}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./services')}>
                        <Ionicons name="grid-outline" size={20} color="#374151" />
                        <Text style={styles.linkItem}>Services</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./notifications')}>
                        <Ionicons name="notifications-outline" size={20} color="#374151" />
                        <Text style={styles.linkItem}>Notifications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./book')}>
                        <Ionicons name="calendar-outline" size={20} color="#374151" />
                        <Text style={styles.linkItem}>Book a Service</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./joinasaprofessional')}>
                        <Ionicons name="person-add-outline" size={20} color="#374151" />
                        <Text style={styles.linkItem}>Join as a Professional</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.secondaryLinks}>
                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./about')}>
                        <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                        <Text style={styles.linkItemSecondary}>About Us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./contact')}>
                        <Ionicons name="mail-outline" size={18} color="#6B7280" />
                        <Text style={styles.linkItemSecondary}>Contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./faq')}>
                        <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
                        <Text style={styles.linkItemSecondary}>FAQs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./glossary')}>
                        <Ionicons name="book-outline" size={18} color="#6B7280" />
                        <Text style={styles.linkItemSecondary}>Glossary</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleNavigation('./becomeAPartner')}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                        <Text style={styles.linkItemSecondary}>Become a Partner</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={styles.adminButtonWrapper}>
                <TouchableOpacity style={styles.adminLoginButton} activeOpacity={0.8} onPress={() => handleNavigation('./adminLogin')}>
                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.adminButtonText}>Admin Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 80,
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
        zIndex: 10,
        overflow: 'hidden',
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        backgroundColor: "#245d5a",
        paddingVertical: 20,
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
        paddingVertical: 16,
    },
    primaryLinks: {
        gap: 8,
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
        paddingVertical: 8,
    },
    linkItem: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    secondaryLinks: {
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    linkItemSecondary: {
        fontSize: 14,
        color: '#6B7280',
    },
    adminButtonWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: '#white',
    },
    adminLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#245d5a',
        paddingVertical: 12,
        borderRadius: 14,
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default SideBarModal;