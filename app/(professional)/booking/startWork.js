import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { startBookingWork } from '../../../api/PostApiBookingGardener';
import { sendOtp } from '../../../api/PostApiOtp';
import { uploadPrivateDocument, uploadPublicFile } from '../../../api/uploadToStorage';

const today = new Date().toISOString().split('T')[0];

const DocumentPickerField = ({ label, required, file, onPick, onRemove }) => (
    <View style={styles.individualContainerFull}>
        <Text style={styles.label}>
            {label} {required && <Text style={styles.asterisk}>*</Text>}
        </Text>
        {file ? (
            <View style={styles.documentRow}>
                <Ionicons name="document-text" size={20} color="#245d5a" />
                <Text style={styles.documentName} numberOfLines={1}>{file.name}</Text>
                <Pressable onPress={onRemove}>
                    <Ionicons name="trash" size={18} color="#d9534f" />
                </Pressable>
            </View>
        ) : (
            <Pressable style={styles.documentPickerTrigger} onPress={onPick}>
                <Ionicons name="arrow-down-circle-outline" size={24} color="#666" />
                <Text style={styles.documentPickerText}>Tap to add a document or photo</Text>
            </Pressable>
        )}
    </View>
);

const StartWork = () => {
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

    const [workPhotos, setWorkPhotos] = useState([]);
    const [document1, setDocument1] = useState(null);
    const [document2, setDocument2] = useState(null);

    const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const [sendingOtp, setSendingOtp] = useState(false);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isOtpModalVisible && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOtpModalVisible, timer]);

    const handlePickPhotos = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });
        if (!result.canceled) {
            setWorkPhotos((prev) => [...prev, ...result.assets].slice(0, 5));
        }
    };

    const handlePickDocument = async (which) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            if (which === 1) setDocument1(asset);
            else setDocument2(asset);
        } catch (error) {
            console.error('DocumentPicker Error:', error);
        }
    };

    const sendOtpCode = async () => {
        setSendingOtp(true);
        try {
            const result = await sendOtp(phone, 'start-work', fullName, bookingId);
            if (!result.success) {
                Alert.alert('Could Not Send Code', result.message || 'Please try again.');
                return false;
            }
            setOtp(['', '', '', '']);
            setTimer(60);
            setCanResend(false);
            return true;
        } catch (error) {
            Alert.alert('Could Not Send Code', error.message || 'Something went wrong. Please try again.');
            return false;
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async () => {
        if (!startDate) return Alert.alert('Validation Error', 'Start date is required');
        if (!budget) return Alert.alert('Validation Error', 'Budget is required');
        if (!phone) return Alert.alert('Error', 'Customer phone number is missing — please go back and try again.');
        if (!document1) return Alert.alert('Document Required', 'Please add at least one document (an agreement or informative file) before starting work.');

        const sent = await sendOtpCode();
        if (sent) setIsOtpModalVisible(true);
    };

    const handleOtpChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = cleaned.slice(-1);
        setOtp(newOtp);
        if (cleaned.length > 0 && index < 3) inputRefs[index + 1].current?.focus();
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleResendOtp = () => {
        if (canResend && !sendingOtp) sendOtpCode();
    };

    const handleVerifyAndStart = async () => {
        const userEnteredOtp = otp.join('');
        if (userEnteredOtp.length < 4) {
            Alert.alert('Incomplete Code', 'Please enter the complete 4-digit code.');
            return;
        }

        setStarting(true);
        try {
            // Upload after OTP entry, before the verify call — a failed upload
            // shouldn't consume the OTP, same ordering as job completion's photos.
            const photoUrls = await Promise.all(
                workPhotos.map((img) => uploadPublicFile(img.uri, img.fileName))
            );
            const documentPaths = await Promise.all(
                [document1, document2].filter(Boolean).map((doc) => uploadPrivateDocument(doc.uri, doc.name))
            );

            const result = await startBookingWork(bookingId, userEnteredOtp, {
                budget,
                startDate,
                endDate,
                workDescription: scopeOfWork,
                photos: photoUrls,
                documents: documentPaths,
            });
            if (!result.success) {
                Alert.alert('Could Not Start Work', result.message || 'Incorrect OTP');
                setOtp(['', '', '', '']);
                inputRefs[0].current?.focus();
                return;
            }

            setIsOtpModalVisible(false);
            router.dismissTo({
                pathname: `/booking/${bookingId}`,
                params: { fullName, updatedBudget: budget, updatedScopeOfWork: scopeOfWork, updatedStartDate: startDate, updatedEndDate: endDate },
            });
        } catch (error) {
            Alert.alert('Could Not Start Work', error.message || 'Something went wrong. Please try again.');
        } finally {
            setStarting(false);
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
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Start Work</Text>
                </View>

                <View style={styles.bookingInfoCard}>
                    <Text style={styles.clientNameText}>{fullName || 'Client Name'}</Text>
                    <Text style={styles.bookingIdText}>Booking ID: {bookingId || 'N/A'}</Text>
                </View>

                <View style={styles.inputsSection}>
                    <View style={styles.dateContainer}>
                        <View style={styles.individualContainer}>
                            <Text style={styles.label}>Start Date <Text style={styles.asterisk}>*</Text></Text>
                            <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={() => setActiveCalendarModal('startDate')}>
                                <Text style={[styles.triggerText, !startDate && styles.placeholderText]}>{startDate || 'Select Start Date'}</Text>
                                <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.individualContainer}>
                            <Text style={styles.label}>End Date</Text>
                            <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={() => setActiveCalendarModal('endDate')}>
                                <Text style={[styles.triggerText, !endDate && styles.placeholderText]}>{endDate || 'Select End Date'}</Text>
                                <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.individualContainerFull}>
                        <Text style={styles.label}>Budget in NPR <Text style={styles.asterisk}>*</Text></Text>
                        <TextInput style={styles.textInput} placeholder="12,750" placeholderTextColor="#999" value={budget} onChangeText={setBudget} onFocus={() => setBudget('')} />
                    </View>

                    <View style={styles.individualContainerFull}>
                        <Text style={styles.label}>Scope of Work</Text>
                        <TextInput
                            style={[styles.textInput, styles.textAreaInput]}
                            placeholder="Describe scope of work..."
                            placeholderTextColor="#999"
                            value={scopeOfWork}
                            onChangeText={setScopeOfWork}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.individualContainerFull}>
                        <Text style={styles.label}>Photos (optional)</Text>
                        <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhotos}>
                            <Ionicons name="camera-outline" size={18} color="#245d5a" />
                            <Text style={styles.photoPickerBtnText}>
                                {workPhotos.length > 0 ? `${workPhotos.length} photo(s) selected` : 'Add Photos'}
                            </Text>
                        </TouchableOpacity>
                        {workPhotos.length > 0 && (
                            <View style={styles.photosGrid}>
                                {workPhotos.map((img, index) => (
                                    <Image key={index} source={{ uri: img.uri }} style={styles.photoItem} resizeMode="cover" />
                                ))}
                            </View>
                        )}
                    </View>

                    <DocumentPickerField
                        label="Document 1 (agreement or informative file)"
                        required
                        file={document1}
                        onPick={() => handlePickDocument(1)}
                        onRemove={() => setDocument1(null)}
                    />
                    <DocumentPickerField
                        label="Document 2 (optional)"
                        file={document2}
                        onPick={() => handlePickDocument(2)}
                        onRemove={() => setDocument2(null)}
                    />
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.submitButton, sendingOtp && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={sendingOtp}
                    >
                        {sendingOtp ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={!!activeCalendarModal} transparent animationType="fade" onRequestClose={() => setActiveCalendarModal(null)}>
                <TouchableWithoutFeedback onPress={() => setActiveCalendarModal(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.calendarModalCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{activeCalendarModal === 'startDate' ? 'Select Start Date' : 'Select End Date'}</Text>
                                    <TouchableOpacity onPress={() => setActiveCalendarModal(null)}>
                                        <Ionicons name="close" size={22} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <Calendar
                                    minDate={activeCalendarModal === 'startDate' ? today : (startDate || today)}
                                    show6Weeks={true}
                                    hideExtraDays={false}
                                    enableSwipeMonths={true}
                                    onDayPress={(day) => {
                                        if (activeCalendarModal === 'startDate') {
                                            setStartDate(day.dateString);
                                            if (endDate && day.dateString > endDate) setEndDate(day.dateString);
                                        } else {
                                            setEndDate(day.dateString);
                                        }
                                        setActiveCalendarModal(null);
                                    }}
                                    markedDates={{
                                        ...(startDate && { [startDate]: { selected: true, selectedColor: '#629f9c', selectedTextColor: '#fff' } }),
                                        ...(endDate && { [endDate]: { selected: true, selectedColor: '#245d5a', selectedTextColor: '#fff' } }),
                                    }}
                                    theme={{ todayTextColor: '#245d5a', arrowColor: '#245d5a' }}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal visible={isOtpModalVisible} transparent animationType="slide" onRequestClose={() => setIsOtpModalVisible(false)}>
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.confirmIconBadge}>
                            <Ionicons name="key-outline" size={32} color="#245d5a" />
                        </View>
                        <Text style={styles.confirmTitle}>Verify Client OTP</Text>
                        <Text style={styles.confirmSubtext}>
                            Enter the 4-digit OTP code sent to <Text style={styles.phoneHighlightText}>{phone || 'the customer'}</Text>
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
                                <TouchableOpacity onPress={handleResendOtp} disabled={sendingOtp}>
                                    <Text style={styles.resendActiveText}>{sendingOtp ? 'Sending...' : 'Resend Code'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.resendTimerText}>Resend code in <Text style={styles.timerBold}>{timer}s</Text></Text>
                            )}
                        </View>
                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsOtpModalVisible(false)} disabled={starting}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, (!fullOtpEntered || starting) && styles.submitButtonDisabled]}
                                disabled={!fullOtpEntered || starting}
                                onPress={handleVerifyAndStart}
                            >
                                {starting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Verify</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    scrollview: { flex: 1, backgroundColor: '#245d5a' },
    container: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 16 },
    formContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
    backBtn: { padding: 4 },
    headerText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    bookingInfoCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    clientNameText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    bookingIdText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
    inputsSection: { gap: 16, marginVertical: 6 },
    individualContainer: { width: '48%', gap: 8 },
    individualContainerFull: { width: '100%', gap: 8 },
    label: { fontWeight: '500', color: '#333' },
    asterisk: { color: '#d9534f', fontWeight: 'bold' },
    textInput: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, height: 48, backgroundColor: '#fff', fontSize: 14, color: '#000' },
    textAreaInput: { height: 100, paddingTop: 12 },
    dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, height: 48, backgroundColor: '#fff' },
    triggerText: { fontSize: 14, color: '#000' },
    placeholderText: { color: '#999' },
    dateContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    photoPickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#245d5a', borderRadius: 8, paddingVertical: 12 },
    photoPickerBtnText: { color: '#245d5a', fontWeight: '600', fontSize: 13 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    photoItem: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#E2E8F0' },
    documentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12 },
    documentName: { flex: 1, fontSize: 13, color: '#334155' },
    documentPickerTrigger: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#999', borderRadius: 8, paddingVertical: 20 },
    documentPickerText: { fontSize: 12, color: '#666' },
    bottomContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
    cancelButton: { height: 48, width: '45%', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
    cancelButtonText: { color: '#666', fontWeight: '600' },
    submitButton: { backgroundColor: '#245d5a', borderRadius: 12, height: 48, width: '45%', alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#fff', fontWeight: 'bold' },
    submitButtonDisabled: { backgroundColor: '#94A3B8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    calendarModalCard: { width: '95%', minHeight: 420, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
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
});

export default StartWork;
