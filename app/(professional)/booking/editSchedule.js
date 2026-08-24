import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { budgetData } from '../../../data/servicesList';

const today = new Date().toISOString().split('T')[0];

const CustomDropdown = ({ label, value, placeholder, data, isOpen, onToggle, onSelect, required = false }) => {
    const [query, setQuery] = useState('');

    const filteredData = data.filter((item) =>
        (item.name || item.title || item).toLowerCase().includes(query.toLowerCase())
    );

    return (
        <View style={styles.individualContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.asterisk}>*</Text>}
            </Text>
            <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={onToggle}>
                <Text style={[styles.triggerText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.dropdownContainer}>
                    <View style={styles.searchBarContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${label.toLowerCase()}...`}
                            placeholderTextColor="#999"
                            value={query}
                            onChangeText={setQuery}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.itemsList} nestedScrollEnabled>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, idx) => {
                                const itemLabel = item.name || item.title || item;
                                return (
                                    <TouchableOpacity
                                        key={item.id || idx}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            onSelect(itemLabel);
                                            setQuery('');
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{itemLabel}</Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.noResultsContainer}>
                                <Text style={styles.noResultsText}>No items found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const EditSchedule = () => {
    const {
        bookingId,
        fullName,
        budget: initialBudget,
        startDate: initialStart,
        endDate: initialEnd,
    } = useLocalSearchParams();

    const [budget, setBudget] = useState(initialBudget || '');
    const [startDate, setStartDate] = useState(initialStart || '');
    const [endDate, setEndDate] = useState(initialEnd || '');

    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeCalendarModal, setActiveCalendarModal] = useState(null);

    const toggleDropdown = (name) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
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

        router.dismissTo({
            pathname: `/booking/${bookingId}`,
            params: {
                fullName: fullName,
                updatedBudget: budget,
                updatedStartDate: startDate,
                updatedEndDate: endDate,
                shouldEditSchedule: 'false',
            },
        });
    };

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
                    {/* Start Date Trigger */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>
                            Start Date <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            activeOpacity={0.8}
                            onPress={() => {
                                setActiveDropdown(null);
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
                                setActiveDropdown(null);
                                setActiveCalendarModal('endDate');
                            }}
                        >
                            <Text style={[styles.triggerText, !endDate && styles.placeholderText]}>
                                {endDate || 'Select End Date'}
                            </Text>
                            <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Budget Dropdown */}
                    <CustomDropdown
                        label="Budget"
                        required
                        value={budget}
                        placeholder="Choose Budget"
                        data={budgetData}
                        isOpen={activeDropdown === 'budget'}
                        onToggle={() => toggleDropdown('budget')}
                        onSelect={(val) => {
                            setBudget(val);
                            setActiveDropdown(null);
                        }}
                    />
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
        width: '100%',
        gap: 6,
    },
    label: {
        fontWeight: '500',
        color: '#333',
    },
    asterisk: {
        color: '#d9534f',
        fontWeight: 'bold',
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
    dropdownContainer: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        marginTop: 4,
        backgroundColor: '#fff',
        maxHeight: 250,
        elevation: 3,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 8,
        height: 40,
        backgroundColor: '#f9f9f9',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
    },
    itemsList: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#333',
    },
    noResultsContainer: {
        padding: 16,
        alignItems: 'center',
    },
    noResultsText: {
        color: '#999',
        fontSize: 14,
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
});

export default EditSchedule;