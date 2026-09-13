import AdminButton from '@/components/admin/AdminButton';
import Header4Admin from '@/components/admin/Header4Admin';
import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import { submitBookingForCustomer } from '../../api/PostApiAdmin';
import { verifyOtp } from '../../api/PostApiOtp';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { areasByCity } from '../../data/Data';
import { budgetData, categories, cityData, priorityData, shiftsData } from '../../data/servicesList';

const today = new Date().toISOString().split('T')[0];

const emptyForm = {
    fullName: '', phone: '', service: '', city: '', area: '',
    priority: '', budget: '', selectShift: '', startingDate: '',
    serviceCompletionDate: '', workDescription: '',
};

export default function SubmitBookingForCustomer() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { adminRole, isAdminAuthLoading } = useContext(AdminAuthContext);
    const [form, setForm] = useState(emptyForm);
    const [calendarField, setCalendarField] = useState(null); // 'startingDate' | 'serviceCompletionDate' | null
    const [submitting, setSubmitting] = useState(false);

    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [bdmPhone, setBdmPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [verifying, setVerifying] = useState(false);

    // A compact "pick one" field — book.js has its own richer version of this,
    // but it's defined inline there and not exported; this screen's needs
    // (single-select from a short list, no search) are simple enough not to
    // warrant pulling that apart just to share it.
    const SelectField = ({ label, required, value, placeholder, options, onSelect, getLabel = (o) => o }) => {
        const [open, setOpen] = useState(false);
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{label}{required && <Text style={styles.asterisk}> *</Text>}</Text>
                <TouchableOpacity style={styles.selectTrigger} onPress={() => setOpen(true)}>
                    <Text style={[styles.selectTriggerText, !value && styles.placeholderText]}>
                        {value ? getLabel(value) : placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <FlatList
                                data={options}
                                keyExtractor={(item, i) => String(item.id ?? item ?? i)}
                                style={{ maxHeight: 350 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.optionRow}
                                        onPress={() => { onSelect(item); setOpen(false); }}
                                    >
                                        <Text style={styles.optionText}>{getLabel(item)}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    };

    // Same reasoning as manageStaff.js's fix — adminRole is null until
    // AdminAuthContext finishes reading AsyncStorage, so checking it before
    // isAdminAuthLoading resolves would flash "Not Available" at a legitimate
    // BDM/Call Center user on every fresh mount (a hard reload, a deep link).
    if (isAdminAuthLoading) {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <View style={styles.subHeader}>
                    <Text style={styles.headerTitle}>Submit Booking for Customer</Text>
                </View>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.brand} />
            </View>
        );
    }

    if (adminRole !== 'bdm' && adminRole !== 'call_center') {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <View style={styles.subHeader}>
                    <Text style={styles.headerTitle}>Not Available</Text>
                </View>
                <Text style={styles.notAllowedText}>This form is only available to Business Development Managers and Call Center staff.</Text>
            </View>
        );
    }

    const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async () => {
        const required = ['fullName', 'phone', 'service', 'city', 'area', 'budget', 'selectShift', 'startingDate'];
        const missing = required.find((k) => !form[k]);
        if (missing) {
            Alert.alert('Missing Field', 'Please fill in all required fields before submitting.');
            return;
        }
        if (form.phone.length !== 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit customer phone number.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitBookingForCustomer(form);
            if (!result.success) {
                Alert.alert('Could Not Submit', result.message || 'Please try again.');
                return;
            }
            setBdmPhone(result.bdmPhone);
            setOtp(['', '', '', '']);
            setStep('otp');
        } catch (error) {
            Alert.alert('Could Not Submit', error.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOtpChange = (text, index) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = cleaned.slice(-1);
        setOtp(newOtp);
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 4) {
            Alert.alert('Incomplete Code', 'Please enter the complete 4-digit code sent to your phone.');
            return;
        }
        setVerifying(true);
        try {
            const result = await verifyOtp(bdmPhone, 'bdm-booking-confirm', code);
            if (!result.verified) {
                Alert.alert('Incorrect Code', result.message || 'Please try again.');
                return;
            }
            Alert.alert('Request Submitted', 'The booking has been submitted on the customer\'s behalf.', [
                { text: 'OK', onPress: () => { setForm(emptyForm); setStep('form'); router.back(); } },
            ]);
        } catch (error) {
            Alert.alert('Verification Failed', error.message || 'Something went wrong.');
        } finally {
            setVerifying(false);
        }
    };

    const availableAreas = form.city ? (areasByCity[form.city] || []) : [];

    if (step === 'otp') {
        return (
            <View style={styles.container}>
                <Header4Admin />
                <View style={styles.subHeader}>
                    <TouchableOpacity onPress={() => setStep('form')}>
                        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Submission</Text>
                    <View style={{ width: 22 }} />
                </View>
                <View style={styles.otpCard}>
                    <Text style={styles.otpTitle}>Enter the code sent to your phone</Text>
                    <Text style={styles.otpSubtitle}>
                        A confirmation OTP was sent to <Text style={styles.otpPhone}>{bdmPhone}</Text> (your number, not the customer&apos;s).
                    </Text>
                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                style={styles.otpBox}
                                value={digit}
                                onChangeText={(t) => handleOtpChange(t, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                            />
                        ))}
                    </View>
                    <AdminButton variant="brand" label="Confirm" onPress={handleVerify} loading={verifying} style={styles.submitButton} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header4Admin />
            <View style={styles.subHeader}>
                <Text style={styles.headerTitle}>Submit Booking for Customer</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.helperText}>
                    For customers who can&apos;t use the app themselves (keypad phone, not comfortable with a smartphone).
                    No OTP is sent to the customer — you&apos;ll confirm with a code sent to your own phone instead.
                </Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Customer Full Name<Text style={styles.asterisk}> *</Text></Text>
                    <TextInput style={styles.input} value={form.fullName} onChangeText={set('fullName')} placeholder="Customer's name" placeholderTextColor={colors.textMuted} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Customer Phone Number<Text style={styles.asterisk}> *</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        onChangeText={(t) => set('phone')(t.replace(/[^0-9]/g, '').slice(0, 10))}
                        placeholder="10-digit phone number"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        maxLength={10}
                    />
                </View>

                <SelectField
                    label="Service" required
                    value={form.service} placeholder="Select a service"
                    options={categories} getLabel={(o) => o.title}
                    onSelect={(o) => set('service')(o.title)}
                />

                <SelectField
                    label="City" required
                    value={form.city} placeholder="Select city"
                    options={cityData} getLabel={(o) => o.name}
                    onSelect={(o) => { set('city')(o.name); set('area')(''); }}
                />

                <SelectField
                    label="Area" required
                    value={form.area} placeholder={form.city ? 'Select area' : 'Select a city first'}
                    options={availableAreas.map((a, i) => ({ id: i, name: a }))} getLabel={(o) => o.name}
                    onSelect={(o) => set('area')(o.name)}
                />

                <SelectField
                    label="Budget" required
                    value={form.budget} placeholder="Select budget range"
                    options={budgetData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('budget')(o.name || o)}
                />

                <SelectField
                    label="Preferred Shift" required
                    value={form.selectShift} placeholder="Select shift"
                    options={shiftsData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('selectShift')(o.name || o)}
                />

                <SelectField
                    label="Priority"
                    value={form.priority} placeholder="Select priority (optional)"
                    options={priorityData} getLabel={(o) => o.name || o}
                    onSelect={(o) => set('priority')(o.name || o)}
                />

                <View style={styles.field}>
                    <Text style={styles.label}>Starting Date<Text style={styles.asterisk}> *</Text></Text>
                    <TouchableOpacity style={styles.selectTrigger} onPress={() => setCalendarField('startingDate')}>
                        <Text style={[styles.selectTriggerText, !form.startingDate && styles.placeholderText]}>
                            {form.startingDate || 'Select date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {calendarField && (
                    <Calendar
                        minDate={today}
                        onDayPress={(day) => { set(calendarField)(day.dateString); setCalendarField(null); }}
                        markedDates={form[calendarField] ? { [form[calendarField]]: { selected: true, selectedColor: colors.brand } } : {}}
                    />
                )}

                <View style={styles.field}>
                    <Text style={styles.label}>Work Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.workDescription}
                        onChangeText={set('workDescription')}
                        placeholder="Any details the customer mentioned (optional)"
                        placeholderTextColor={colors.textMuted}
                        multiline
                    />
                </View>

                <AdminButton variant="brand" label="Submit Request" onPress={handleSubmit} loading={submitting} style={styles.submitButton} />
            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
        backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
    notAllowedText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, paddingHorizontal: 24 },
    scrollContent: { padding: 16, gap: 4 },
    helperText: { fontSize: 12, color: colors.warning, backgroundColor: colors.warningBg, padding: 10, borderRadius: 12, marginBottom: 12, lineHeight: 18 },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
    asterisk: { color: colors.danger },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
    selectTriggerText: { fontSize: 14, color: colors.textPrimary },
    placeholderText: { color: colors.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.textPrimary },
    optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
    optionText: { fontSize: 14, color: colors.textSecondary },
    submitButton: { marginTop: 12, marginBottom: 30 },
    otpCard: { backgroundColor: colors.surface, margin: 16, borderRadius: 18, padding: 20 },
    otpTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    otpSubtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 20 },
    otpPhone: { fontWeight: '700', color: colors.brand },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
    otpBox: { width: 46, height: 54, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
});
