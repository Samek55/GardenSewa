import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { BookingsListProfessional } from '../../../data/servicesList';

const STATUS_OPTIONS = ['New', 'OnGoing', 'Completed', 'Cancelled', 'Dispute'];

const IndividualBooking = () => {
    const { id } = useLocalSearchParams();

    const booking = BookingsListProfessional.find((item) => item.id.toString() === id?.toString()) || {
        id: id || 'B34',
        fullName: 'Amir Lama',
        phone: '+977 9712092736',
        service: 'Water Tank Cleaning',
        location: 'Sanepa, Lalitpur',
        budget: 'NPR 5,000 - 10,000',
        booking_date: '28 July 2026, Tuesday',
        startDate: '29 July 2026, Wednesday',
        endDate: '29 July 2026, Wednesday',
        approxDays: '1 Day',
        specialRequest: 'Test.',
        workStatus: 'New',
    };

    const [currentStatus, setCurrentStatus] = useState(booking.workStatus || 'New');
    const [selectedStatus, setSelectedStatus] = useState(booking.workStatus || 'New');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [statusHistory, setStatusHistory] = useState({ from: '', to: '' });

    const handleSubmitStatus = () => {
        if (selectedStatus === currentStatus) return;

        setStatusHistory({
            from: currentStatus,
            to: selectedStatus,
        });
        setIsModalVisible(true);
    };

    const confirmStatusChange = () => {
        setCurrentStatus(selectedStatus);
        setIsModalVisible(false);
    };

    return (
        <View style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.bookingIdTitle}>Booking ID: {booking.id}</Text>
                    <TouchableOpacity style={styles.shareBtn}>
                        <Ionicons name="share-outline" size={22} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.clientName}>{booking.fullName}</Text>
                    <View style={styles.phoneRow}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.phoneText}>{booking.phone || '+977 9712092736'}</Text>
                    </View>

                    <View style={styles.infoGroup}>
                        <Text style={styles.fieldLabel}>Service</Text>
                        <Text style={styles.fieldValue}>{booking.service}</Text>

                        <Text style={styles.fieldLabel}>Location</Text>
                        <Text style={styles.fieldValue}>{booking.location}</Text>

                        <Text style={styles.fieldLabel}>Budget</Text>
                        <Text style={styles.fieldValue}>{booking.budget}</Text>

                        <Text style={styles.fieldLabel}>Booking Date</Text>
                        <Text style={styles.fieldValue}>{booking.booking_date}</Text>

                        <Text style={styles.fieldLabel}>Starting Date</Text>
                        <Text style={styles.fieldValue}>{booking.startDate || '29 July 2026, Wednesday'}</Text>

                        <Text style={styles.fieldLabel}>Ending Date</Text>
                        <Text style={styles.fieldValue}>{booking.endDate || '29 July 2026, Wednesday'}</Text>

                        <Text style={styles.fieldLabel}>Approx Days to Complete</Text>
                        <Text style={styles.fieldValue}>{booking.approxDays || '1 Day'}</Text>

                        <Text style={styles.fieldLabel}>Special Request</Text>
                        <Text style={styles.fieldValue}>{booking.specialRequest || 'None'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeading}>Work Status</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsDropdownOpen(true)}
                    >
                        <Text style={styles.dropdownTriggerText}>{selectedStatus}</Text>
                        <Ionicons name="chevron-down" size={20} color="#245d5a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            selectedStatus === currentStatus && styles.submitButtonDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSubmitStatus}
                        disabled={selectedStatus === currentStatus}
                    >
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={isDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDropdownOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
                    <View style={styles.modalOverlayCenter}>
                        <View style={styles.dropdownModalCard}>
                            <Text style={styles.modalHeading}>Select Work Status</Text>
                            {STATUS_OPTIONS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={styles.statusOptionRow}
                                    onPress={() => {
                                        setSelectedStatus(status);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.statusOptionText,
                                            selectedStatus === status && styles.selectedOptionText,
                                        ]}
                                    >
                                        {status}
                                    </Text>
                                    {selectedStatus === status && (
                                        <Ionicons name="checkmark-circle" size={18} color="#245d5a" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Status Change Confirmation Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.confirmIconBadge}>
                            <Ionicons name="sync-outline" size={32} color="#245d5a" />
                        </View>

                        <Text style={styles.confirmTitle}>Update Work Status</Text>

                        <View style={styles.statusChangeContainer}>
                            <View style={styles.badgeBox}>
                                <Text style={styles.badgeBoxLabel}>FROM</Text>
                                <Text style={styles.badgeBoxTextFrom}>{statusHistory.from}</Text>
                            </View>

                            <Ionicons name="arrow-forward" size={20} color="#64748B" />

                            <View style={styles.badgeBox}>
                                <Text style={styles.badgeBoxLabel}>TO</Text>
                                <Text style={styles.badgeBoxTextTo}>{statusHistory.to}</Text>
                            </View>
                        </View>

                        <Text style={styles.confirmSubtext}>
                            Are you sure you want to change the work status for this booking request?
                        </Text>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setSelectedStatus(currentStatus);
                                    setIsModalVisible(false);
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.confirmBtn} onPress={confirmStatusChange}>
                                <Text style={styles.confirmBtnText}>Confirm Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topHeader: {
        backgroundColor: '#245d5a',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoBadge: {
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 8,
    },
    brandTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    backBtn: {
        padding: 4,
    },
    bookingIdTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    shareBtn: {
        padding: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    clientName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        marginBottom: 16,
    },
    phoneText: {
        fontSize: 13,
        color: '#64748B',
    },
    infoGroup: {
        gap: 4,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 8,
    },
    fieldValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 10,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#245d5a',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    dropdownTriggerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    submitButton: {
        backgroundColor: '#245d5a',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    modalOverlayCenter: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dropdownModalCard: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        elevation: 8,
    },
    modalHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    statusOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    statusOptionText: {
        fontSize: 14,
        color: '#334155',
    },
    selectedOptionText: {
        fontWeight: '700',
        color: '#245d5a',
    },
    confirmationCard: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    confirmIconBadge: {
        backgroundColor: '#E8F4F3',
        padding: 16,
        borderRadius: 50,
        marginBottom: 12,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    statusChangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
    },
    badgeBox: {
        alignItems: 'center',
    },
    badgeBoxLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 2,
    },
    badgeBoxTextFrom: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
    badgeBoxTextTo: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
    },
    confirmSubtext: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 14,
    },
    confirmBtn: {
        flex: 1,
        backgroundColor: '#245d5a',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default IndividualBooking;