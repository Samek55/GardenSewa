import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import * as ImagePicker from 'expo-image-picker';
import { acceptBooking, completeBooking, listOpenBookings } from '../../../api/PostApiBookingGardener';
import { notifyBookingAccepted, notifyJobCompleted } from '../../../api/PostApiNotification';
import { sendOtp } from '../../../api/PostApiOtp';
import { uploadPublicFile } from '../../../api/uploadToStorage';

// Only one real transition exists post-accept — marking the job done, which
// requires the customer's completion OTP (see complete-booking). HomeSewa's
// own version doesn't have an arbitrary status editor either, just this.
const STATUS_OPTIONS = ['Completed'];

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

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState({
        id: id || '',
        fullName: fullName || '',
        phone: '',
        service: '',
        location: '',
        budget: '',
        booking_date: '',
        startDate: '',
        endDate: '',
        approxDays: 1,
        specialRequest: '',
        workStatus: 'New',
        photos: [],
        unlocked: false,
        dealAmount: null,
        dealNote: null,
    });

    const loadBooking = useCallback(async () => {
        try {
            const result = await listOpenBookings();
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not load booking');
                return;
            }
            const found = (result.bookings || []).find((b) => b.bookingId?.toString() === id?.toString());
            if (!found) return;
            setBooking({
                id: found.bookingId,
                fullName: found.fullName,
                phone: found.phone,
                service: found.service,
                location: [found.area, found.city].filter(Boolean).join(', '),
                budget: found.budget,
                booking_date: found.startingDate,
                startDate: found.startingDate,
                endDate: found.completionDate,
                approxDays: 1,
                specialRequest: found.workDescription,
                workStatus: found.status === 'New / Open' ? 'New' : found.status === 'Pending' ? 'OnGoing' : found.status,
                photos: found.photos || [],
                unlocked: found.unlocked,
                dealAmount: found.dealAmount,
                dealNote: found.dealNote,
            });
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not load booking');
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadBooking().finally(() => setLoading(false));
        }, [loadBooking])
    );

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
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const [dealModalVisible, setDealModalVisible] = useState(false);
    const [dealAmountInput, setDealAmountInput] = useState('');
    const [dealNoteInput, setDealNoteInput] = useState('');
    const [accepting, setAccepting] = useState(false);

    const [completionPhotos, setCompletionPhotos] = useState([]);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [completing, setCompleting] = useState(false);

    // Synced from the fetched booking, since currentStatus/currentBudget/etc
    // started life as static useState initial values before the real fetch resolved.
    useEffect(() => {
        setCurrentBudget(booking.budget);
        setCurrentStartDate(booking.startDate);
        setCurrentEndDate(booking.endDate);
        setCurrentStatus(booking.workStatus);
        setSelectedStatus(booking.workStatus);
    }, [booking]);

    const isPhoneMasked = !booking.unlocked;
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

    const handlePickCompletionPhotos = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });
        if (!result.canceled) {
            setCompletionPhotos((prev) => [...prev, ...result.assets].slice(0, 5));
        }
    };

    // Sends a real OTP to the customer (see 'work-completion' in send-otp) —
    // the gardener reads it back from the customer to prove the job is
    // actually finished, mirroring HomeSewa's WorkCompletionOTP.tsx.
    const sendCompletionOtp = async () => {
        setSendingOtp(true);
        try {
            const result = await sendOtp(booking.phone, 'work-completion', booking.fullName);
            if (!result.success) {
                Alert.alert('Could Not Send Code', result.message || 'Please try again.');
                return false;
            }
            setOtp(['', '', '', '']);
            setTimer(60);
            setCanResend(false);
            return true;
        } catch (error) {
            Alert.alert('Could Not Send Code', error.message || 'Something went wrong.');
            return false;
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmitStatus = () => {
        if (selectedStatus === currentStatus) return;
        if (completionPhotos.length === 0) {
            Alert.alert('Photos Required', 'Please add at least one photo of the finished job.');
            return;
        }

        setStatusHistory({
            from: currentStatus,
            to: selectedStatus,
        });
        setIsModalVisible(true);
    };

    const handleInitiateStatusChange = async () => {
        setIsModalVisible(false);
        const sent = await sendCompletionOtp();
        if (sent) setIsOtpModalVisible(true);
    };

    const handleResendOtp = () => {
        if (canResend && !sendingOtp) {
            sendCompletionOtp();
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

    const handleVerifyOtpAndConfirm = async () => {
        const userEnteredOtp = otp.join('');
        if (userEnteredOtp.length < 4) return;
        if (completing) return;
        setCompleting(true);
        try {
            // Upload photos before verifying the OTP — the code is consumed the
            // instant it checks out, so if a slow upload failed afterward the
            // gardener would be locked out and need a brand-new code from the
            // customer. Uploading first leaves only a single fast write after.
            const photoUrls = await Promise.all(
                completionPhotos.map((img) => uploadPublicFile(img.uri, img.fileName))
            );

            const result = await completeBooking(booking.id, userEnteredOtp, photoUrls);
            if (!result.success) {
                Alert.alert('Invalid OTP', result.message || 'The code entered does not match. Please try again.');
                return;
            }

            setCurrentStatus('Completed');
            setIsOtpModalVisible(false);
            notifyJobCompleted(booking.id).catch((e) => console.error('notify completion failed:', e));
            Alert.alert('Job Completed', `Booking for ${booking.fullName} has been marked as completed.`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not complete this job. Please try again.');
        } finally {
            setCompleting(false);
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
        if (!booking.unlocked) {
            router.push({
                pathname: '/booking/pay',
                params: {
                    bookingId: booking.id,
                    fullName: booking.fullName,
                },
            });
            return;
        }
        setDealAmountInput('');
        setDealNoteInput('');
        setDealModalVisible(true);
    };

    const handleConfirmDeal = async () => {
        const amount = Number(dealAmountInput);
        if (!dealAmountInput.trim() || !Number.isFinite(amount) || amount <= 0) {
            Alert.alert('Enter Deal Amount', 'Please enter the agreed price as a valid positive number.');
            return;
        }
        setAccepting(true);
        try {
            const result = await acceptBooking(booking.id, amount, dealNoteInput.trim() || null);
            if (!result.success) {
                Alert.alert('Could Not Accept', result.message || 'Please try again.');
                return;
            }
            setDealModalVisible(false);
            notifyBookingAccepted(booking.id).catch((e) => console.error('notify accept failed:', e));
            await loadBooking();
            Alert.alert('Job Accepted', 'This job is now yours — the customer has been notified.');
        } catch (error) {
            Alert.alert('Could Not Accept', error.message || 'Something went wrong. Please try again.');
        } finally {
            setAccepting(false);
        }
    };

    // No reject-tracking table exists yet (see Phase 2 backend notes) — passing
    // on a job just leaves this screen without recording anything server-side,
    // rather than faking a status change that wouldn't reflect reality.
    const handleRejectOffer = () => {
        Alert.alert('Pass on this job?', 'It will stay open for other gardeners to accept.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes, Pass', style: 'destructive', onPress: () => router.back() },
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

    if (loading) {
        return (
            <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#245d5a" />
            </View>
        );
    }

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
                                        <Image
                                            source={typeof photoSrc === 'string' ? { uri: photoSrc } : photoSrc}
                                            style={styles.photoItem}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                    {currentStatus === 'New' ? (
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.85} onPress={handleAcceptOffer}>
                                <Text style={styles.acceptBtnText}>
                                    {booking.unlocked ? 'Accept Offer' : 'Pay to View & Accept'}
                                </Text>
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

                            {currentStatus === 'Completed' ? (
                                <View style={styles.completedBanner}>
                                    <Ionicons name="checkmark-circle" size={20} color="#15803D" />
                                    <Text style={styles.completedBannerText}>This job has been marked completed.</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.sectionHeading}>Mark Job as Completed</Text>
                                    <Text style={styles.completionHint}>
                                        Add at least one photo of the finished job, then confirm with the customer&apos;s OTP.
                                    </Text>

                                    <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickCompletionPhotos}>
                                        <Ionicons name="camera-outline" size={18} color="#245d5a" />
                                        <Text style={styles.photoPickerBtnText}>
                                            {completionPhotos.length > 0 ? `${completionPhotos.length} photo(s) selected` : 'Add Completion Photos'}
                                        </Text>
                                    </TouchableOpacity>
                                    {completionPhotos.length > 0 && (
                                        <View style={styles.photosGrid}>
                                            {completionPhotos.map((img, index) => (
                                                <Image key={index} source={{ uri: img.uri }} style={styles.photoItem} resizeMode="cover" />
                                            ))}
                                        </View>
                                    )}

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
                                        disabled={selectedStatus === currentStatus || sendingOtp}
                                    >
                                        {sendingOtp ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                                    </TouchableOpacity>
                                </>
                            )}
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
                        <Image
                            source={typeof selectedPhoto === 'string' ? { uri: selectedPhoto } : selectedPhoto}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
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
                                    (!fullOtpEntered || completing) && styles.submitButtonDisabled,
                                ]}
                                disabled={!fullOtpEntered || completing}
                                onPress={handleVerifyOtpAndConfirm}
                            >
                                {completing ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Verify</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={dealModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => !accepting && setDealModalVisible(false)}
            >
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.confirmIconBadge}>
                            <Ionicons name="checkmark-done-outline" size={32} color="#245d5a" />
                        </View>
                        <Text style={styles.confirmTitle}>Confirm Deal Terms</Text>
                        <Text style={styles.confirmSubtext}>
                            Enter the price you and the customer agreed on for this job.
                        </Text>

                        <TextInput
                            style={styles.dealInput}
                            placeholder="Deal Amount (NPR)"
                            keyboardType="numeric"
                            value={dealAmountInput}
                            onChangeText={(t) => setDealAmountInput(t.replace(/[^0-9]/g, ''))}
                            autoFocus
                        />
                        <TextInput
                            style={[styles.dealInput, styles.dealNoteInput]}
                            placeholder="Note (optional)"
                            multiline
                            value={dealNoteInput}
                            onChangeText={setDealNoteInput}
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setDealModalVisible(false)}
                                disabled={accepting}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, accepting && styles.submitButtonDisabled]}
                                onPress={handleConfirmDeal}
                                disabled={accepting}
                            >
                                {accepting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>Accept Job</Text>
                                )}
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
    completedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 12 },
    completedBannerText: { color: '#15803D', fontWeight: '600', fontSize: 13 },
    completionHint: { fontSize: 12, color: '#64748B', marginBottom: 12 },
    photoPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#245d5a', borderRadius: 8, paddingVertical: 12, marginBottom: 8 },
    photoPickerBtnText: { color: '#245d5a', fontWeight: '600', fontSize: 13 },
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
    dealInput: { width: '100%', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
    dealNoteInput: { minHeight: 60, textAlignVertical: 'top' },
});

export default IndividualBooking;