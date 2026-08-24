import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { BookingsListProfessional } from '../../../data/servicesList';

const STATUS_OPTIONS = ['New', 'OnGoing', 'Completed', 'Cancelled', 'Dispute'];

const maskPhoneNumber = (phone) => {
    if (!phone) return '+977 98XXX28XX47';
    return phone.replace(/(\d{2})\d{4}(\d{2})\d(\d{1})$/, '$1XXX$2XX$3');
};

const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const formatDateFormatted = (dateStr) => {
    if (!dateStr) return '';
    const parsedDate = new Date(dateStr.replace(/\//g, '-'));
    if (isNaN(parsedDate.getTime())) return dateStr;

    const day = parsedDate.getDate();
    const month = parsedDate.toLocaleString('en-US', { month: 'long' });
    const year = parsedDate.getFullYear();

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

const IndividualBooking = () => {
    const params = useLocalSearchParams();
    const {
        id,
        fullName,
        updatedStatus,
        shouldEditSchedule,
        updatedBudget,
        updatedStartDate,
        updatedEndDate
    } = params;

    const foundBooking = BookingsListProfessional.find((item) => item.id.toString() === id?.toString());

    const booking = {
        id: id || 'B34',
        fullName: fullName || foundBooking?.fullName || 'Rohan Adhikari',
        phone: foundBooking?.phone || '9823028547',
        service: foundBooking?.service || 'Water Tank Cleaning',
        location: foundBooking?.location || 'Sanepa, Lalitpur',
        budget: foundBooking?.budget || 'NPR 5,000 - 10,000',
        booking_date: foundBooking?.booking_date || '2026/07/28',
        startDate: foundBooking?.startDate || '2026/07/29',
        endDate: foundBooking?.endDate || '2026/07/29',
        approxDays: foundBooking?.approxDays || 1,
        specialRequest: foundBooking?.specialRequest || 'Test.',
        workStatus: foundBooking?.workStatus || 'New',
        photos: foundBooking?.photos || [],
    };

    const [currentBudget, setCurrentBudget] = useState(booking.budget);
    const [currentStartDate, setCurrentStartDate] = useState(booking.startDate);
    const [currentEndDate, setCurrentEndDate] = useState(booking.endDate);

    const [currentStatus, setCurrentStatus] = useState(booking.workStatus);
    const [selectedStatus, setSelectedStatus] = useState(booking.workStatus);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [statusHistory, setStatusHistory] = useState({ from: '', to: '' });

    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const isPhoneMasked = currentStatus === 'New' || currentStatus === 'Cancelled';
    const formattedApproxDays = `${booking.approxDays} ${Number(booking.approxDays) === 1 ? 'Day' : 'Days'}`;

    useEffect(() => {
        if (updatedStatus) {
            setCurrentStatus(updatedStatus);
            setSelectedStatus(updatedStatus);
        }

        if (updatedBudget) setCurrentBudget(updatedBudget);
        if (updatedStartDate) setCurrentStartDate(updatedStartDate);
        if (updatedEndDate) setCurrentEndDate(updatedEndDate);

        if (shouldEditSchedule === 'true') {
            router.setParams({ shouldEditSchedule: 'false' });

            router.push({
                pathname: '/booking/editSchedule',
                params: {
                    bookingId: booking.id,
                    fullName: booking.fullName,
                    budget: updatedBudget || currentBudget,
                    startDate: updatedStartDate || currentStartDate,
                    endDate: updatedEndDate || currentEndDate,
                },
            });
        }
    }, [updatedStatus, shouldEditSchedule, updatedBudget, updatedStartDate, updatedEndDate]);

    useEffect(() => {
        let interval = null;
        if (isOtpModalVisible && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOtpModalVisible, timer]);

    const sendOtpCode = () => {
        const otpCode = __DEV__ ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(otpCode);
        setOtp(['', '', '', '']);
        setTimer(60);
        setCanResend(false);
    };

    const handleSubmitStatus = () => {
        if (selectedStatus === currentStatus) return;

        setStatusHistory({
            from: currentStatus,
            to: selectedStatus,
        });
        setIsModalVisible(true);
    };

    const handleInitiateStatusChange = () => {
        setIsModalVisible(false);
        sendOtpCode();
        setIsOtpModalVisible(true);
    };

    const handleResendOtp = () => {
        if (canResend) {
            sendOtpCode();
        }
    };

    const handleOtpChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = cleaned.slice(-1);
        setOtp(newOtp);

        if (cleaned.length > 0 && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerifyOtpAndConfirm = () => {
        const userEnteredOtp = otp.join('');
        if (userEnteredOtp === generatedOtp) {
            setCurrentStatus(selectedStatus);
            setIsOtpModalVisible(false);

            if (selectedStatus === 'OnGoing') {
                router.push({
                    pathname: '/booking/editSchedule',
                    params: {
                        bookingId: booking.id,
                        fullName: booking.fullName,
                        budget: currentBudget,
                        startDate: currentStartDate,
                        endDate: currentEndDate,
                    },
                });
            } else {
                Alert.alert('Success', `Status successfully updated to ${selectedStatus}`);
            }
        } else {
            Alert.alert('Invalid OTP', 'The code entered does not match. Please try again.');
        }
    };

    const handleOpenMap = async () => {
        const query = encodeURIComponent(booking.location);
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        try {
            const supported = await Linking.canOpenURL(webUrl);
            if (supported) await Linking.openURL(webUrl);
            else Alert.alert('Error', 'Unable to open Google Maps');
        } catch (error) {
            console.error('Error opening maps:', error);
        }
    };

    const handleCallPhone = async () => {
        if (isPhoneMasked) return;
        const phoneUrl = `tel:${booking.phone}`;
        try {
            const supported = await Linking.canOpenURL(phoneUrl);
            if (supported) await Linking.openURL(phoneUrl);
            else Alert.alert('Error', 'Unable to open phone app');
        } catch (error) {
            console.error('Error opening phone dialer:', error);
        }
    };

    const handleAcceptOffer = () => {
        router.push({
            pathname: '/booking/pay',
            params: {
                bookingId: booking.id,
                fullName: booking.fullName,
            },
        });
    };

    const handleRejectOffer = () => {
        Alert.alert('Reject Booking', 'Are you sure you want to reject this offer?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes',
                style: 'destructive',
                onPress: () => {
                    setCurrentStatus('Cancelled');
                    setSelectedStatus('Cancelled');
                },
            },
        ]);
    };

    const handleSharePDF = async () => {
        try {
            const displayPhone = isPhoneMasked ? maskPhoneNumber(booking.phone) : booking.phone;
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <style>
                        body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1E293B; background-color: #FFFFFF; }
                        .header { text-align: center; border-bottom: 2px solid #245d5a; padding-bottom: 12px; margin-bottom: 20px; }
                        .brand { font-size: 26px; color: #245d5a; font-weight: bold; margin: 0; }
                        .booking-id { font-size: 15px; color: #64748B; margin-top: 4px; font-weight: 600; }
                        .card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; background-color: #F8FAFC; }
                        .client-name { font-size: 20px; font-weight: bold; color: #0F172A; margin-bottom: 4px; }
                        .phone { font-size: 14px; color: #64748B; margin-bottom: 16px; font-weight: 500; }
                        .row { margin-bottom: 12px; }
                        .label { font-size: 11px; color: #94A3B8; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
                        .value { font-size: 14px; font-weight: 600; color: #1E293B; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94A3B8; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="brand">GardenSewa</div>
                        <div class="booking-id">Booking ID: ${booking.id}</div>
                    </div>

                    <div class="card">
                        <div class="client-name">${booking.fullName}</div>
                        <div class="phone">${displayPhone}</div>

                        <div class="row"><div class="label">Service</div><div class="value">${booking.service}</div></div>
                        <div class="row"><div class="label">Location</div><div class="value">${booking.location}</div></div>
                        <div class="row"><div class="label">Budget</div><div class="value">${currentBudget}</div></div>
                        <div class="row"><div class="label">Booking Date</div><div class="value">${formatDateFormatted(booking.booking_date)}</div></div>
                        <div class="row"><div class="label">Starting Date</div><div class="value">${formatDateFormatted(currentStartDate)}</div></div>
                        <div class="row"><div class="label">Ending Date</div><div class="value">${formatDateFormatted(currentEndDate)}</div></div>
                        <div class="row"><div class="label">Approx Days to Complete</div><div class="value">${formattedApproxDays}</div></div>
                        <div class="row"><div class="label">Special Request</div><div class="value">${booking.specialRequest || 'None'}</div></div>
                        <div class="row"><div class="label">Work Status</div><div class="value">${currentStatus}</div></div>
                    </div>

                    <div class="footer">Generated via GardenSewa App</div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            const customUri = `${FileSystem.documentDirectory}GardenSewa-${booking.id}.pdf`;

            await FileSystem.copyAsync({ from: uri, to: customUri });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(customUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share Booking ${booking.id}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF for sharing');
        }
    };

    const fullOtpEntered = otp.join('').length === 4;

    return (
        <View style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.bookingIdTitle}>Booking ID: {booking.id}</Text>

                    <TouchableOpacity style={styles.shareBtn} onPress={handleSharePDF}>
                        <Ionicons name="share-outline" size={22} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.clientName}>{booking.fullName}</Text>

                    <TouchableOpacity
                        style={styles.phoneRow}
                        onPress={handleCallPhone}
                        activeOpacity={isPhoneMasked ? 1 : 0.7}
                    >
                        <Ionicons name="call-outline" size={16} color="#245d5a" />
                        <Text style={styles.phoneText}>
                            {isPhoneMasked ? maskPhoneNumber(booking.phone) : booking.phone}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.infoGroup}>
                        <Text style={styles.fieldLabel}>Service</Text>
                        <Text style={styles.fieldValue}>{booking.service}</Text>

                        <Text style={styles.fieldLabel}>Location</Text>
                        <TouchableOpacity style={styles.locationLinkRow} onPress={handleOpenMap} activeOpacity={0.7}>
                            <Ionicons name="location-outline" size={18} color="#245d5a" />
                            <Text style={styles.locationText}>{booking.location}</Text>
                        </TouchableOpacity>

                        <Text style={styles.fieldLabel}>Budget</Text>
                        <Text style={styles.fieldValue}>{currentBudget}</Text>

                        <Text style={styles.fieldLabel}>Booking Date</Text>
                        <Text style={styles.fieldValue}>{formatDateFormatted(booking.booking_date)}</Text>

                        <Text style={styles.fieldLabel}>Starting Date</Text>
                        <Text style={styles.fieldValue}>{formatDateFormatted(currentStartDate)}</Text>

                        <Text style={styles.fieldLabel}>Ending Date</Text>
                        <Text style={styles.fieldValue}>{formatDateFormatted(currentEndDate)}</Text>

                        <Text style={styles.fieldLabel}>Approx Days to Complete</Text>
                        <Text style={styles.fieldValue}>{formattedApproxDays}</Text>

                        <Text style={styles.fieldLabel}>Special Request</Text>
                        <Text style={styles.fieldValue}>{booking.specialRequest || 'None'}</Text>
                    </View>

                    {booking.photos && booking.photos.length > 0 && (
                        <View style={styles.photosSection}>
                            <Text style={styles.fieldLabel}>Attached Photos</Text>
                            <View style={styles.photosGrid}>
                                {booking.photos.map((photoSrc, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedPhoto(photoSrc)}
                                    >
                                        <Image source={photoSrc} style={styles.photoItem} resizeMode="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    {currentStatus === 'New' || currentStatus === 'Cancelled' ? (
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.85} onPress={handleAcceptOffer}>
                                <Text style={styles.acceptBtnText}>Accept Offer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.85} onPress={handleRejectOffer}>
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {currentStatus === 'OnGoing' && (
                                <TouchableOpacity
                                    style={styles.editScheduleDirectBtn}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({
                                        pathname: '/booking/editSchedule',
                                        params: {
                                            bookingId: booking.id,
                                            fullName: booking.fullName,
                                            budget: currentBudget,
                                            startDate: currentStartDate,
                                            endDate: currentEndDate,
                                        },
                                    })}
                                >
                                    <Ionicons name="create-outline" size={18} color="#245d5a" />
                                    <Text style={styles.editScheduleDirectBtnText}>Edit Schedule & Budget</Text>
                                </TouchableOpacity>
                            )}

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
                        </>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={!!selectedPhoto}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPhoto(null)}
            >
                <View style={styles.imageViewerOverlay}>
                    <TouchableOpacity
                        style={styles.closeViewerBtn}
                        onPress={() => setSelectedPhoto(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>

                    {selectedPhoto && (
                        <Image source={selectedPhoto} style={styles.fullScreenImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>

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
                            Changing status requires customer authorization. {'\n'}An SMS OTP will be sent to the customer's registered number.
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

                            <TouchableOpacity style={styles.confirmBtn} onPress={handleInitiateStatusChange}>
                                <Text style={styles.confirmBtnText}>Send OTP</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isOtpModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsOtpModalVisible(false)}
            >
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.confirmIconBadge}>
                            <Ionicons name="key-outline" size={32} color="#245d5a" />
                        </View>

                        <Text style={styles.confirmTitle}>Verify Client OTP</Text>
                        <Text style={styles.confirmSubtext}>
                            Enter the 4-digit OTP code sent to{' '}
                            <Text style={styles.phoneHighlightText}>{booking.phone}</Text>
                        </Text>

                        <View style={styles.pinInputsGroupRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={inputRefs[index]}
                                    style={styles.singlePinBox}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textAlign="center"
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResendOtp}>
                                    <Text style={styles.resendActiveText}>Resend Code</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.resendTimerText}>
                                    Resend code in <Text style={styles.timerBold}>{timer}s</Text>
                                </Text>
                            )}
                        </View>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setIsOtpModalVisible(false);
                                    setSelectedStatus(currentStatus);
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmBtn,
                                    !fullOtpEntered && styles.submitButtonDisabled,
                                ]}
                                disabled={!fullOtpEntered}
                                onPress={handleVerifyOtpAndConfirm}
                            >
                                <Text style={styles.confirmBtnText}>Verify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
    navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
    backBtn: { padding: 4 },
    bookingIdTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    shareBtn: { padding: 4 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    clientName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 },
    phoneText: { fontSize: 14, fontWeight: '700', color: '#245d5a', textDecorationLine: 'underline' },
    infoGroup: { gap: 4 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
    fieldValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    locationLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    locationText: { fontSize: 14, fontWeight: '600', color: '#245d5a', textDecorationLine: 'underline' },
    photosSection: { marginTop: 6 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    photoItem: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E2E8F0' },
    imageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
    closeViewerBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 8, borderRadius: 20 },
    fullScreenImage: { width: '100%', height: '80%' },
    actionButtonsContainer: { flexDirection: 'row', gap: 12, marginTop: 24 },
    acceptBtn: { flex: 1, backgroundColor: '#245d5a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    acceptBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    rejectBtn: { flex: 1, backgroundColor: '#DC143C', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    rejectBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    editScheduleDirectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, borderWidth: 1, borderColor: '#245d5a', borderRadius: 8, paddingVertical: 10 },
    editScheduleDirectBtnText: { color: '#245d5a', fontWeight: '700', fontSize: 14 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
    sectionHeading: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
    dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#245d5a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
    dropdownTriggerText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    submitButton: { backgroundColor: '#245d5a', borderRadius: 8, paddingVertical: 14, alignItems: 'center', width: '60%', alignSelf: 'center' },
    submitButtonDisabled: { backgroundColor: '#94A3B8' },
    submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    dropdownModalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 8 },
    modalHeading: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    statusOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    statusOptionText: { fontSize: 14, color: '#334155' },
    selectedOptionText: { fontWeight: '700', color: '#245d5a' },
    confirmationCard: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 },
    confirmIconBadge: { backgroundColor: '#E8F4F3', padding: 16, borderRadius: 50, marginBottom: 12 },
    confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
    statusChangeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16, width: '100%' },
    badgeBox: { alignItems: 'center' },
    badgeBoxLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 2 },
    badgeBoxTextFrom: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
    badgeBoxTextTo: { fontSize: 14, fontWeight: '700', color: '#10B981' },
    confirmSubtext: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
    phoneHighlightText: { fontWeight: '700', color: '#245d5a' },
    pinInputsGroupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 16, gap: 12 },
    singlePinBox: { width: 46, height: 54, backgroundColor: '#FFF', fontSize: 20, fontWeight: '700', color: '#000', borderWidth: 1.5, borderColor: '#C5CEE0', paddingVertical: 0, borderRadius: 10 },
    resendContainer: { marginBottom: 20, alignItems: 'center' },
    resendTimerText: { fontSize: 13, color: '#64748B' },
    timerBold: { fontWeight: '700', color: '#245d5a' },
    resendActiveText: { fontSize: 14, fontWeight: '700', color: '#245d5a', textDecorationLine: 'underline' },
    modalActionButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelBtnText: { color: '#64748B', fontWeight: '700', fontSize: 14 },
    confirmBtn: { flex: 1, backgroundColor: '#245d5a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

export default IndividualBooking;