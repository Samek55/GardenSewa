import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SideBarModal = () => {
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

            <View style={styles.primaryLinks}>
                <Text style={styles.sectionTitle}>Menu</Text>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="home-outline" size={20} color="#374151" />
                    <Text style={styles.linkItem}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="grid-outline" size={20} color="#374151" />
                    <Text style={styles.linkItem}>Services</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="notifications-outline" size={20} color="#374151" />
                    <Text style={styles.linkItem}>Notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="calendar-outline" size={20} color="#374151" />
                    <Text style={styles.linkItem}>Book a Service</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="person-add-outline" size={20} color="#374151" />
                    <Text style={styles.linkItem}>Join as a Professional</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.secondaryLinks}>
                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                    <Text style={styles.linkItemSecondary}>About Us</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                    <Text style={styles.linkItemSecondary}>Contact</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
                    <Text style={styles.linkItemSecondary}>FAQs</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                    <Text style={styles.linkItemSecondary}>Become a Handler</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.adminButtonWrapper}>
                <TouchableOpacity style={styles.adminLoginButton} activeOpacity={0.8}>
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
        top: 90,
        left: 12,
        bottom: 80,
        width: 280,
        backgroundColor: 'white',
        borderRadius: 36,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 16,
        justifyContent: 'space-between',
        paddingBottom: 30,
        zIndex: 1,
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        borderTopEndRadius: 36,
        borderTopStartRadius: 36,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: "#047754",
        marginBottom: 8,
        paddingVertical: 12,
    },
    avatarPlaceholder: {
        width: 64, 
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E5E7EB',
    },
    profileDetails: {
        alignItems: 'center',
        width: '100%',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF', 
    },
    profileEmail: {
        fontSize: 13,
        color: '#E0F2FE', 
        marginTop: 2,
    },
    primaryLinks: {
        flex: 1,
        gap: 12,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9CA3AF',
        fontWeight: '700',
        marginBottom: 8,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },
    linkItem: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    secondaryLinks: {
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    linkItemSecondary: {
        fontSize: 14,
        color: '#6B7280',
    },
    adminButtonWrapper: {
        paddingHorizontal: 24,
        marginTop: 'auto',
    },
    adminLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#047754',
        paddingVertical: 12,
        borderRadius: 9999, // Fully rounded capsule
        shadowColor: '#047754',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default SideBarModal;