import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';

import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { NP } from 'react-native-country-flag-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { boolean, object, string } from 'yup';

import BookingSummaryCard from '../../components/BookingSummaryCard';
import { areasByCity } from '../../data/Data';
import { budgetData, categories, cityData, priorityData, shiftsData } from '../../data/servicesList';

const today = new Date().toISOString().split('T')[0];

const validationSchema = object({
    name: string().required('Full Name is required').min(3, 'Name too short'),
    phone: string().required('Phone number is required').min(10, 'Invalid phone number'),
    service: string().required('Service is required'),
    startDate: string().required('Start date is required'),
    endDate: string().required('End date is required'),
    preferredTime: string().required('Time is required'),
    city: string().required('City is required'),
    area: string().required('Area is required'),
    priority: string().required('Priority is required'),
    budget: string().required('Budget is required'),
    terms: boolean().isTrue('Must accept terms and conditions'),
});

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
                            value={query}
                            onChangeText={setQuery}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.itemsList} nestedScrollEnabled >
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

export default function Book() {

    const params = useLocalSearchParams();

    const [routePhone, setRoutePhone]=useState('')

    const [selectedImages, setSelectedImages] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleDropdown = (name) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            phone: '',
            service: '',
            startDate: '',
            endDate: '',
            preferredTime: '',
            city: '',
            area: '',
            priority: '',
            budget: '',
            message: '',
            terms: false,
        },
        validationSchema,
        onSubmit: () => {
            setShowSummary(true);
        },
    });

    useEffect(() => {
        if (params?.serviceName) {
            formik.setFieldValue('service', params.serviceName);
        }
    }, [params?.serviceName]);

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
                selectionLimit: 5
            });

            if (!result.canceled) {
                setSelectedImages((prev) => [...prev, ...result.assets].slice(0, 5));
            }
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleImageDelete = (indexToDelete) => {
        setSelectedImages((prev) => prev.filter((_, index) => index !== indexToDelete));
    };

    const handleClearForm = () => {
        formik.resetForm();
        setSelectedImages([]);
        setActiveDropdown(null);
    };

    const handleSubmitWithValidation = async () => {
        const errors = await formik.validateForm();
        const fieldOrder = [
            'name', 'phone', 'service', 'startDate',
            'endDate', 'preferredTime', 'city', 'area',
            'priority', 'budget', 'terms'
        ];

        const firstError = fieldOrder.find((field) => errors[field]);

        if (firstError) {
            formik.setTouched({ [firstError]: true });
            Alert.alert('Validation Error', errors[firstError]);
        } else {
            formik.handleSubmit();
        }
    };

    const availableAreas = formik.values.city ? areasByCity[formik.values.city] || [] : [];

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
            {!showSummary ? (
                <View style={styles.formContainer}>
                    <Text style={styles.headerText}>Book Service</Text>

                    {/* Full Name */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>
                            Full Name <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your full name"
                            value={formik.values.name}
                            onChangeText={formik.handleChange('name')}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>
                            Phone Number <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <View style={styles.phoneInputContainer}>
                            <NP width={30} height={20} style={styles.flagIcon} />
                            <TextInput
                                style={styles.flexInput}
                                placeholder="Enter your phone number"
                                value={formik.values.phone}
                                onChangeText={formik.handleChange('phone')}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Service Dropdown */}
                    <CustomDropdown
                        label="Select Service"
                        required
                        value={formik.values.service}
                        placeholder="Select a service"
                        data={categories}
                        isOpen={activeDropdown === 'service'}
                        onToggle={() => toggleDropdown('service')}
                        onSelect={(val) => {
                            formik.setFieldValue('service', val);
                            setActiveDropdown(null);
                        }}
                    />

                    {/* Start Date */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>
                            Choose Date <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => toggleDropdown('startDate')}
                        >
                            <Text style={[styles.triggerText, !formik.values.startDate && styles.placeholderText]}>
                                {formik.values.startDate || 'Select Date'}
                            </Text>
                            <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {activeDropdown === 'startDate' && (
                            <Calendar
                                minDate={today}
                                onDayPress={(day) => {
                                    formik.setFieldValue('startDate', day.dateString);
                                    if (formik.values.endDate && day.dateString > formik.values.endDate) {
                                        formik.setFieldValue('endDate', day.dateString);
                                    }
                                    setActiveDropdown(null);
                                }}
                                markedDates={{
                                    [today]: {
                                        selected: true,
                                        selectedColor: '#245d5a',
                                        selectedTextColor: '#ffffff',
                                    },
                                    ...(formik.values.startDate && {
                                        [formik.values.startDate]: {
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

                    {/* End Date */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>
                            Service Ending Date <Text style={styles.asterisk}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => toggleDropdown('endDate')}
                        >
                            <Text style={[styles.triggerText, !formik.values.endDate && styles.placeholderText]}>
                                {formik.values.endDate || 'Select Date'}
                            </Text>
                            <Ionicons name="calendar-clear-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {activeDropdown === 'endDate' && (
                            <Calendar
                                minDate={formik.values.startDate || today}
                                onDayPress={(day) => {
                                    formik.setFieldValue('endDate', day.dateString);
                                    setActiveDropdown(null);
                                }}
                                markedDates={{
                                    [today]: {
                                        selected: true,
                                        selectedColor: '#245d5a',
                                        selectedTextColor: '#ffffff',
                                    },
                                    ...(formik.values.endDate && {
                                        [formik.values.endDate]: {
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

                    {/* Preferred Time */}
                    <CustomDropdown
                        label="Preferred Time"
                        required
                        value={formik.values.preferredTime}
                        placeholder="Choose a shift"
                        data={shiftsData}
                        isOpen={activeDropdown === 'preferredTime'}
                        onToggle={() => toggleDropdown('preferredTime')}
                        onSelect={(val) => {
                            formik.setFieldValue('preferredTime', val);
                            setActiveDropdown(null);
                        }}
                    />

                    {/* City */}
                    <CustomDropdown
                        label="City"
                        required
                        value={formik.values.city}
                        placeholder="Choose a city"
                        data={cityData}
                        isOpen={activeDropdown === 'city'}
                        onToggle={() => toggleDropdown('city')}
                        onSelect={(val) => {
                            formik.setFieldValue('city', val);
                            formik.setFieldValue('area', '');
                            setActiveDropdown(null);
                        }}
                    />

                    {/* Area */}
                    {
                        formik.values.city ? <CustomDropdown
                            label="Area"
                            required
                            value={formik.values.area}
                            placeholder={formik.values.city ? 'Choose an Area' : 'Select a city first'}
                            data={availableAreas}
                            isOpen={activeDropdown === 'area'}
                            onToggle={() => toggleDropdown('area')}
                            onSelect={(val) => {
                                formik.setFieldValue('area', val);
                                setActiveDropdown(null);
                            }}
                        /> : <View>
                            <Text style={styles.label}>
                                Area <Text style={styles.asterisk}>*</Text>
                            </Text>
                            <Text style={{ color: '#151212', fontSize: 12, fontStyle: 'italic', marginVertical: 8 }}>
                                Please select a city first.
                            </Text>
                        </View>
                    }

                    {/* Priority */}
                    <CustomDropdown
                        label="Priority"
                        required
                        value={formik.values.priority}
                        placeholder="Choose Priority"
                        data={priorityData}
                        isOpen={activeDropdown === 'priority'}
                        onToggle={() => toggleDropdown('priority')}
                        onSelect={(val) => {
                            formik.setFieldValue('priority', val);
                            setActiveDropdown(null);
                        }}
                    />

                    {/* Budget */}
                    <CustomDropdown
                        label="Budget"
                        required
                        value={formik.values.budget}
                        placeholder="Choose Budget"
                        data={budgetData}
                        isOpen={activeDropdown === 'budget'}
                        onToggle={() => toggleDropdown('budget')}
                        onSelect={(val) => {
                            formik.setFieldValue('budget', val);
                            setActiveDropdown(null);
                        }}
                    />

                    {/* Image Picker */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>Upload Photos (up to 5)</Text>
                        <View style={[styles.imagePickerContainer, selectedImages.length > 0 && styles.solidBorder]}>
                            {selectedImages.length > 0 ? (
                                selectedImages.map((img, index) => (
                                    <View key={img.uri || index} style={styles.imageWrapper}>
                                        <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                                        <Pressable style={styles.deleteButton} onPress={() => handleImageDelete(index)}>
                                            <Ionicons name="trash" size={14} color="white" />
                                        </Pressable>
                                    </View>
                                ))
                            ) : null}
                            {selectedImages.length < 5 && (
                                <Pressable
                                    style={selectedImages.length > 0 ? styles.smallAddButton : styles.imagePlaceholder}
                                    onPress={handleImagePick}
                                >
                                    <Ionicons name="arrow-down-circle-outline" size={32} color="black" />
                                    {selectedImages.length === 0 && <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>}
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Message Area */}
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            multiline
                            placeholder="Enter your message"
                            value={formik.values.message}
                            onChangeText={formik.handleChange('message')}
                        />
                    </View>

                    {/* Terms & Conditions */}
                    <View style={styles.checkboxContainer}>
                        <Pressable onPress={() => formik.setFieldValue('terms', !formik.values.terms)}>
                            <Ionicons
                                name={formik.values.terms ? 'checkbox' : 'square-outline'}
                                size={24}
                                color={formik.values.terms ? '#245d5a' : '#666'}
                            />
                        </Pressable>
                        <Text style={styles.checkboxLabel}>
                            I accept the{' '}
                            <Text style={styles.hyperlink} onPress={() => router.push('./terms')}>
                                Terms and Conditions
                            </Text>{' '}
                            <Text style={styles.asterisk}>*</Text>
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity style={styles.clearButton} onPress={handleClearForm}>
                            <Ionicons name="refresh" size={18} color="#333" />
                            <Text style={styles.label}>Clear Form</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitWithValidation}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <BookingSummaryCard
                    name={formik.values.name}
                    phone={formik.values.phone}
                    service={formik.values.service}
                    startDate={formik.values.startDate}
                    endDate={formik.values.endDate}
                    preferredTime={formik.values.preferredTime}
                    city={formik.values.city}
                    area={formik.values.area}
                    priority={formik.values.priority}
                    budget={formik.values.budget}
                    message={formik.values.message}
                    onBack={() => setShowSummary(false)}
                    onConfirm={() => {
                        setRoutePhone(formik.values.phone)
                        formik.resetForm();
                        setSelectedImages([]);
                        setShowSummary(false);
                        Alert.alert("Success", "Your booking has been confirmed!");
                        router.push({
                            pathname: '/phoneVerification',
                            params: { phone: `${routePhone}` },
                        });
                    }}
                />
            )}
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#245d5a',
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 26,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 16,
        marginBottom: 10,
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
    textInput: {
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 44,
    },
    textArea: {
        height: 100,
        paddingVertical: 8,
        textAlignVertical: 'top',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 44,
    },
    flagIcon: {
        marginRight: 10,
    },
    flexInput: {
        flex: 1,
        height: '100%',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        height: 44,
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
    imagePickerContainer: {
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 120,
        borderRadius: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 8,
    },
    solidBorder: {
        borderStyle: 'solid',
    },
    imageWrapper: {
        width: 60,
        height: 60,
        borderRadius: 4,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 2,
    },
    imagePlaceholder: {
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallAddButton: {
        width: 60,
        height: 60,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    hyperlink: {
        color: '#245d5a',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 10,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    submitButton: {
        backgroundColor: '#245d5a',
        borderRadius: 12,
        height: 44,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});