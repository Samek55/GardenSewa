import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const today = new Date().toISOString().split('T')[0];

const EditSchedule = () => {
    const {
        bookingId,
        fullName,
        budget: initialBudget,
        startDate: initialStart,
        endDate: initialEnd,
        scopeOfWork: initialScope,
        phone,
    } = useLocalSearchParams();

    const [budget, setBudget] = useState(initialBudget || '');
    const [scopeOfWork, setScopeOfWork] = useState(initialScope || '');
    const [startDate, setStartDate] = useState(initialStart || '');
    const [endDate, setEndDate] = useState(initialEnd || '');

    const [activeCalendarModal, setActiveCalendarModal] = useState(null);

    // OTP Modal States
    const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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

    const handleUpdate = () => {
        if (!startDate) {
            Alert.alert('Validation Error', 'Start date is required');
            return;
        }
        if (!budget) {
            Alert.alert('Validation Error', 'Budget is required');
            return;
        }

        // Trigger OTP modal step
        sendOtpCode();
        setIsOtpModalVisible(true);
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

    const handleResendOtp = () => {
        if (canResend) {
            sendOtpCode();
        }
    };

    const handleVerifyOtpAndConfirm = () => {
        const userEnteredOtp = otp.join('');
        if (userEnteredOtp === generatedOtp) {
            setIsOtpModalVisible(false);

            router.dismissTo({
                pathname: `/booking/${bookingId}`,
                params: {
                    fullName: fullName,
                    updatedBudget: budget,
                    updatedScopeOfWork: scopeOfWork,
                    updatedStartDate: startDate,
                    updatedEndDate: endDate,
                    shouldEditSchedule: 'false',
                },
            });
        } else {
            Alert.alert('Invalid OTP', 'The code entered does not match. Please try again.');
        }
    };

    const fullOtpEntered = otp.join('').length === 4;

    return (
        <KeyboardAwareScrollView
            style={styles.scrollview}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={120}
            enableAutomaticScroll={true}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.formContainer}>
                {/* Header with Back Button */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Edit Schedule</Text>
                </View>

                {/* Booking & Client Identification Card */}
                <View style={styles.bookingInfoCard}>
                    <Text style={styles.clientNameText}>{fullName || 'Client Name'}</Text>
                    <Text style={styles.bookingIdText}>Booking ID: {bookingId || 'N/A'}</Text>
                </View>

                {/* Main Form Inputs Container */}
                <View style={styles.inputsSection}>
                    <View style={styles.dateContainer}>
                        {/* Start Date Trigger */}
                        <View style={styles.individualContainer}>
                            <Text style={styles.label}>
                                Start Date <Text style={styles.asterisk}>*</Text>
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setActiveCalendarModal('startDate');
                                }}
                            >
                                <Text style={[styles.triggerText, !startDate && styles.placeholderText]}>
                                    {startDate || 'Select Start Date'}
                                </Text>
                                <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* End Date Trigger */}
                        <View style={styles.individualContainer}>
                            <Text style={styles.label}>End Date</Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setActiveCalendarModal('endDate');
                                }}
                            >
                                <Text style={[styles.triggerText, !endDate && styles.placeholderText]}>
                                    {endDate || 'Select End Date'}
                                </Text>
                                <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Full Width Budget Field */}
                    <View style={styles.individualContainerFull}>
                        <Text style={styles.label}>
                            Budget <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your budget (e.g. NPR 5,000)"
                            placeholderTextColor={'#999'}
                            value={budget}
                            onChangeText={setBudget}
                        />
                    </View>

                    {/* Full Width Scope of Work Field */}
                    <View style={styles.individualContainerFull}>
                        <Text style={styles.label}>Scope of Work</Text>
                        <TextInput
                            style={[styles.textInput, styles.textAreaInput]}
                            placeholder="Describe scope of work..."
                            placeholderTextColor={'#999'}
                            value={scopeOfWork}
                            onChangeText={setScopeOfWork}
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Bottom Action Buttons */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
                        <Text style={styles.submitButtonText}>Update</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Calendar Pop-up Modal */}
            <Modal
                visible={!!activeCalendarModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveCalendarModal(null)}
            >
                <TouchableWithoutFeedback onPress={() => setActiveCalendarModal(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.calendarModalCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {activeCalendarModal === 'startDate' ? 'Select Start Date' : 'Select End Date'}
                                    </Text>
                                    <TouchableOpacity onPress={() => setActiveCalendarModal(null)}>
                                        <Ionicons name="close" size={22} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                {activeCalendarModal === 'startDate' ? (
                                    <Calendar
                                        minDate={today}
                                        onDayPress={(day) => {
                                            setStartDate(day.dateString);
                                            if (endDate && day.dateString > endDate) {
                                                setEndDate(day.dateString);
                                            }
                                            setActiveCalendarModal(null);
                                        }}
                                        markedDates={{
                                            [today]: {
                                                selected: true,
                                                selectedColor: '#629f9c',
                                                selectedTextColor: '#ffffff',
                                            },
                                            ...(startDate && {
                                                [startDate]: {
                                                    selected: true,
                                                    selectedColor: '#245d5a',
                                                    selectedTextColor: '#ffffff',
                                                },
                                            }),
                                        }}
                                        theme={{ todayTextColor: '#245d5a', arrowColor: '#245d5a' }}
                                    />
                                ) : (
                                    <Calendar
                                        minDate={startDate || today}
                                        onDayPress={(day) => {
                                            setEndDate(day.dateString);
                                            setActiveCalendarModal(null);
                                        }}
                                        markedDates={{
                                            [today]: {
                                                selected: true,
                                                selectedColor: '#629f9c',
                                                selectedTextColor: '#ffffff',
                                            },
                                            ...(endDate && {
                                                [endDate]: {
                                                    selected: true,
                                                    selectedColor: '#245d5a',
                                                    selectedTextColor: '#ffffff',
                                                },
                                            }),
                                        }}
                                        theme={{ todayTextColor: '#245d5a', arrowColor: '#245d5a' }}
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* OTP Verification Modal */}
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
                            <Text style={styles.phoneHighlightText}>{phone || 'the customer'}</Text>
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
                                onPress={() => setIsOtpModalVisible(false)}
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
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#245d5a',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    formContainer: {
        width: '100%',
        minHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 6,
    },
    backBtn: {
        padding: 4,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    bookingInfoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    clientNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    bookingIdText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    inputsSection: {
        gap: 16,
        marginVertical: 6,
    },
    individualContainer: {
        width: '48%',
        gap: 8,
    },
    individualContainerFull: {
        width: '100%',
        gap: 8,
    },
    label: {
        fontWeight: '500',
        color: '#333',
    },
    asterisk: {
        color: '#d9534f',
        fontWeight: 'bold',
    },
    textInput: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#fff',
        fontSize: 14,
        color: '#000',
    },
    textAreaInput: {
        height: 100,
        paddingTop: 12,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#fff',
    },
    triggerText: {
        fontSize: 14,
        color: '#000',
    },
    placeholderText: {
        color: '#999',
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        height: 48,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#245d5a',
        borderRadius: 12,
        height: 48,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarModalCard: {
        width: '95%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    dateContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    confirmationCard: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 },
    confirmIconBadge: { backgroundColor: '#E8F4F3', padding: 16, borderRadius: 50, marginBottom: 12 },
    confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
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
    submitButtonDisabled: { backgroundColor: '#94A3B8' },
});

export default EditSchedule;