import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
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
import { NP } from 'react-native-country-flag-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { boolean, object, string } from 'yup';

import { areasByCity } from '../../data/Data';
import { categories, cityData } from '../../data/servicesList';

const validationSchema = object({
    name: string().required('Full name is required').min(3, 'Name too short'),
    phone: string().required('Phone number is required').min(10, 'Invalid phone number'),
    gender: string().required('Gender selection is required'),
    email: string().email('Invalid email address'),
    category: string().required('Category/Service is required'),
    yearsExperience: string().required('Years of experience is required'),
    city: string().required('City is required'),
    area: string().required('Area is required'),
    emergencyPhone: string().required('Emergency contact number is required').min(10, 'Invalid phone number'),
    referralPhone: string(),
    message: string(),
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

export default function JoinProfessional() {
    const [profilePicture, setProfilePicture] = useState(null);
    const [identityPicture, setIdentityPicture] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleDropdown = (name) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            phone: '',
            gender: 'Male',
            email: '',
            category: '',
            yearsExperience: '',
            city: '',
            area: '',
            emergencyPhone: '',
            referralPhone: '',
            message: '',
            terms: false,
        },
        validationSchema,
        onSubmit: (values) => {
            if (!profilePicture) {
                Alert.alert('Validation Error', 'Please upload a Headshot/Profile picture');
                return;
            }
            if (!identityPicture) {
                Alert.alert('Validation Error', 'Please upload Citizenship/Driving License/NID');
                return;
            }

            Alert.alert("Success", "Your application has been submitted!");
            handleClearForm();
        },
    });

    const handleImagePick = async (type) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                // aspect: [1, 1],
                quality: 1,
                selectionLimit: 5
            });

            if (!result.canceled) {
                if (type === 'profile') {
                    setProfilePicture(result.assets[0]);
                } else if (type === 'identity') {
                    setIdentityPicture(result.assets[0]);
                }
            }
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleClearForm = () => {
        formik.resetForm();
        setProfilePicture(null);
        setIdentityPicture(null);
        setActiveDropdown(null);
    };

    const handleSubmitWithValidation = async () => {
        const errors = await formik.validateForm();
        const fieldOrder = [
            'name', 'phone', 'gender', 'email', 'category',
            'yearsExperience', 'city', 'area', 'emergencyPhone', 'terms'
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
            <View style={styles.formContainer}>
                <Text style={styles.headerText}>Join Now</Text>

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

                {/* Gender */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Gender <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.radioGroup}>
                        {['Male', 'Female'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.radioButtonContainer}
                                onPress={() => formik.setFieldValue('gender', option)}
                            >
                                <View style={styles.radioOuterCircle}>
                                    {formik.values.gender === option && <View style={styles.radioInnerCircle} />}
                                </View>
                                <Text style={styles.radioText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Headshot / Profile Picture */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Headshot/Profile picture <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={[styles.imagePickerContainer, profilePicture && styles.solidBorder]}>
                        {profilePicture ? (
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: profilePicture.uri }} style={styles.imagePreview} />
                                <Pressable style={styles.deleteButton} onPress={() => setProfilePicture(null)}>
                                    <Ionicons name="trash" size={14} color="white" />
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable style={styles.imagePlaceholder} onPress={() => handleImagePick('profile')}>
                                <Ionicons name="arrow-down-circle-outline" size={32} color="black" />
                                <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Email Address */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        eMail Address
                    </Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your eMail"
                        value={formik.values.email}
                        onChangeText={formik.handleChange('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Category Dropdown */}
                <CustomDropdown
                    label="Your Expertise"
                    required
                    value={formik.values.category}
                    placeholder="Select a service expertise "
                    data={categories}
                    isOpen={activeDropdown === 'category'}
                    onToggle={() => toggleDropdown('category')}
                    onSelect={(val) => {
                        formik.setFieldValue('category', val);
                        setActiveDropdown(null);
                    }}
                />

                {/* Years of Experience */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Years of Experience <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your years of experience"
                        value={formik.values.yearsExperience}
                        onChangeText={formik.handleChange('yearsExperience')}
                        keyboardType="numeric"
                    />
                </View>

                {/* Citizenship / Driving License / NID */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Citizenship/ Driving License/ NID <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={[styles.imagePickerContainer, identityPicture && styles.solidBorder]}>
                        {identityPicture ? (
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: identityPicture.uri }} style={styles.imagePreview} />
                                <Pressable style={styles.deleteButton} onPress={() => setIdentityPicture(null)}>
                                    <Ionicons name="trash" size={14} color="white" />
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable style={styles.imagePlaceholder} onPress={() => handleImagePick('identity')}>
                                <Ionicons name="arrow-down-circle-outline" size={32} color="black" />
                                <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

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

                {/* Emergency Phone Number */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Emergency Contact Number <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.phoneInputContainer}>
                        <NP width={30} height={20} style={styles.flagIcon} />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter phone number"
                            value={formik.values.emergencyPhone}
                            onChangeText={formik.handleChange('emergencyPhone')}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Referral Phone Number */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Referral Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <NP width={30} height={20} style={styles.flagIcon} />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter phone number"
                            value={formik.values.referralPhone}
                            onChangeText={formik.handleChange('referralPhone')}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Message */}
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
    radioGroup: {
        flexDirection: 'row',
        gap: 20,
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuterCircle: {
        height: 16,
        width: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#245d5a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioInnerCircle: {
        height: 8,
        width: 8,
        borderRadius: 5,
        backgroundColor: '#245d5a',
    },
    radioText: {
        fontSize: 16,
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
        justifyContent: 'center',
        minHeight: 120,
        borderRadius: 6,
        padding: 8,
    },
    solidBorder: {
        borderStyle: 'solid',
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 4,
    },
    imagePlaceholder: {
        width: '100%',
        height: 100,
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