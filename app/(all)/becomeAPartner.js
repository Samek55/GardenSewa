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
import { array, boolean, object, string } from 'yup';

import {
    businessType,
    cityData,
    partnershipData,
    serviceOfferedData,
    sourceData,
} from '../../data/servicesList';

const MAX_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const validationSchema = object({
    name: string().required('Full Name is required').min(3, 'Name too short'),
    organization: string().required('Organization Name is required'),
    phone: string().required('Phone number is required').min(10, 'Invalid phone number'),
    email: string().email('Invalid email address'),
    area: string().required('Area is required'),
    noOfEmployees: string().required('Number of employees is required'),
    businessType: string().required('Business Type is required'),
    servicesOffered: array()
        .of(string())
        .min(1, 'Select at least 1 service')
        .max(5, 'Maximum 5 services allowed'),
    partnershipInterest: string().required('Partnership Interest is required'),
    hearAboutUs: string().required('Please select how you heard about us'),
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

const MultiSelectDropdown = ({
    label,
    selectedItems = [],
    placeholder,
    data,
    isOpen,
    onToggle,
    onSelectItem,
    onRemoveItem,
    required = false,
    maxLimit = 5,
}) => {
    const [query, setQuery] = useState('');

    const filteredData = data.filter((item) => {
        const itemLabel = item.name || item.title || item;
        const matchesQuery = itemLabel.toLowerCase().includes(query.toLowerCase());
        const isNotSelected = !selectedItems.includes(itemLabel);
        return matchesQuery && isNotSelected;
    });

    return (
        <View style={styles.individualContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.asterisk}>*</Text>}
            </Text>

            {/* Input / Selector Box with Chips Inside */}
            <TouchableOpacity
                style={styles.multiSelectTrigger}
                activeOpacity={0.8}
                onPress={onToggle}
            >
                <View style={styles.inputInnerContainer}>
                    {selectedItems.map((item, idx) => (
                        <View key={idx} style={styles.chip}>
                            <Text style={styles.chipText}>{item}</Text>
                            <TouchableOpacity onPress={() => onRemoveItem(item)}>
                                <Ionicons name="close-circle" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {selectedItems.length < maxLimit && (
                        <Text style={styles.placeholderTextInline}>
                            {selectedItems.length === 0 ? placeholder : `Add more (${selectedItems.length}/${maxLimit})...`}
                        </Text>
                    )}
                </View>

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
                                        style={[styles.dropdownItem, styles.multiDropdownItem]}
                                        onPress={() => {
                                            if (selectedItems.length >= maxLimit) {
                                                Alert.alert('Limit Reached', `You can select up to ${maxLimit} items.`);
                                                return;
                                            }
                                            onSelectItem(itemLabel);
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

export default function PartnerBook() {
    const [selectedCompanyImages, setSelectedCompanyImages] = useState([]);
    const [selectedCertificates, setSelectedCertificates] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleDropdown = (name) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            organization: '',
            phone: '',
            email: '',
            area: '',
            noOfEmployees: '',
            businessType: '',
            servicesOffered: [],
            partnershipInterest: '',
            hearAboutUs: '',
            message: '',
            terms: false,
        },
        validationSchema,
        onSubmit: (values) => {
            if (selectedCompanyImages.length === 0) {
                Alert.alert('Validation Error', 'Please upload at least one Company Photo');
                return;
            }
            if (selectedCertificates.length === 0) {
                Alert.alert('Validation Error', 'Please upload Registration Documents');
                return;
            }

            Alert.alert("Success", "Your partner application has been submitted!");
            handleClearForm();
        },
    });

    const formatPhone = (text) => {
        const digitsOnly = (text || '').replace(/[^0-9]/g, '');

        if (digitsOnly.length === 10) {
            return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 10)}`;
        }

        return digitsOnly;
    };

    const handleImagePick = async (type) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
                selectionLimit: 5,
                aspect: [1, 1]
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const validAssets = [];
                const oversizedAssets = [];

                result.assets.forEach((asset) => {
                    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
                        oversizedAssets.push(asset);
                    } else {
                        validAssets.push(asset);
                    }
                });

                if (oversizedAssets.length > 0) {
                    Alert.alert(
                        'File Size Limit Exceeded',
                        `${oversizedAssets.length} image(s) exceed the ${MAX_SIZE_MB} MB limit and were skipped.`
                    );
                }

                if (validAssets.length > 0) {
                    if (type === 'company') {
                        setSelectedCompanyImages((prev) => [...prev, ...validAssets].slice(0, 5));
                    } else if (type === 'certificate') {
                        setSelectedCertificates((prev) => [...prev, ...validAssets].slice(0, 5));
                    }
                }
            }
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleImageDelete = (indexToDelete, type) => {
        if (type === 'company') {
            setSelectedCompanyImages((prev) => prev.filter((_, index) => index !== indexToDelete));
        } else if (type === 'certificate') {
            setSelectedCertificates((prev) => prev.filter((_, index) => index !== indexToDelete));
        }
    };

    const handleClearForm = () => {
        formik.resetForm();
        setSelectedCompanyImages([]);
        setSelectedCertificates([]);
        setActiveDropdown(null);
    };

    const handleSubmitWithValidation = async () => {
        const errors = await formik.validateForm();
        const fieldOrder = [
            'name',
            'organization',
            'phone',
            'email',
            'area',
            'noOfEmployees',
            'businessType',
            'servicesOffered',
            'partnershipInterest',
            'hearAboutUs',
            'terms',
        ];

        const firstError = fieldOrder.find((field) => errors[field]);

        if (firstError) {
            formik.setTouched({ [firstError]: true });
            Alert.alert(
                'Validation Error',
                Array.isArray(errors[firstError]) ? errors[firstError][0] : errors[firstError]
            );
        }
        else if (selectedCertificates.length == 0) {
            Alert.alert("Validation Error", "Select at least one certificate.")

        } else if (selectedCompanyImages.length == 0) {

            Alert.alert("Validation Error", "Select at least one company image.")

        }
        else {
            formik.handleSubmit();
            router.push({
                pathname: '/phoneVerification',
                params: { phone: formik.values.phone, requestType: 'Become a Partner' },

            });
        }
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
                <Text style={styles.headerText}>Become a Partner</Text>

                {/* Full Name */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Full Name <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        placeholderTextColor={'#999'}
                        value={formik.values.name}
                        onChangeText={formik.handleChange('name')}
                    />
                </View>

                {/* Name of Organization */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Name of Organization <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter Name of your Organization"
                        placeholderTextColor={'#999'}
                        value={formik.values.organization}
                        onChangeText={formik.handleChange('organization')}
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
                            placeholderTextColor={'#999'}
                            placeholder="Enter your phone number"
                            value={formatPhone(formik.values.phone)}
                            maxLength={12}
                            onChangeText={(text) => {
                                const rawDigits = text.replace(/[^0-9]/g, '').slice(0, 10);
                                formik.setFieldValue('phone', rawDigits);
                            }}
                            keyboardType="phone-pad"
                            maxLength={12}
                        />
                    </View>
                </View>

                {/* Email Address */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>eMail Address</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholderTextColor={'#999'}
                        placeholder="Enter your eMail"
                        value={formik.values.email}
                        onChangeText={formik.handleChange('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Company Photos */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Company Photos ( Upto 5 ) <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={[styles.imagePickerContainer, selectedCompanyImages.length > 0 && styles.solidBorder]}>
                        {selectedCompanyImages.length > 0 &&
                            selectedCompanyImages.map((img, index) => (
                                <View key={img.uri || index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                                    <Pressable
                                        style={styles.deleteButton}
                                        onPress={() => handleImageDelete(index, 'company')}
                                    >
                                        <Ionicons name="trash" size={14} color="white" />
                                    </Pressable>
                                </View>
                            ))}
                        {selectedCompanyImages.length < 5 && (
                            <Pressable
                                style={selectedCompanyImages.length > 0 ? styles.smallAddButton : styles.imagePlaceholder}
                                onPress={() => handleImagePick('company')}
                            >
                                <Ionicons name="arrow-down-circle-outline" size={32} color="black" />
                                {selectedCompanyImages.length === 0 && <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>}
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Area Dropdown */}
                <CustomDropdown
                    label="Area"
                    required
                    value={formik.values.area}
                    placeholder="Choose an Area"
                    data={cityData}
                    isOpen={activeDropdown === 'area'}
                    onToggle={() => toggleDropdown('area')}
                    onSelect={(val) => {
                        formik.setFieldValue('area', val);
                        setActiveDropdown(null);
                    }}
                />

                {/* Number of Employees */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Number of employees <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.textInput}
                        placeholderTextColor={'#999'}
                        placeholder="Enter the number of employees"
                        value={formik.values.noOfEmployees}
                        onChangeText={formik.handleChange('noOfEmployees')}
                        keyboardType="numeric"
                    />
                </View>

                {/* Business Type Dropdown */}
                <CustomDropdown
                    label="Business Type"
                    required
                    value={formik.values.businessType}
                    placeholder="Select a business type"
                    data={businessType}
                    isOpen={activeDropdown === 'businessType'}
                    onToggle={() => toggleDropdown('businessType')}
                    onSelect={(val) => {
                        formik.setFieldValue('businessType', val);
                        setActiveDropdown(null);
                    }}
                />

                {/* Multi-Select Services Offered (Up to 5) */}
                <MultiSelectDropdown
                    label="Services Offered"
                    required
                    maxLimit={5}
                    selectedItems={formik.values.servicesOffered}
                    placeholder="Select up to 5 services"
                    data={serviceOfferedData}
                    isOpen={activeDropdown === 'servicesOffered'}
                    onToggle={() => toggleDropdown('servicesOffered')}
                    onSelectItem={(val) => {
                        formik.setFieldValue('servicesOffered', [...formik.values.servicesOffered, val]);
                    }}
                    onRemoveItem={(val) => {
                        formik.setFieldValue(
                            'servicesOffered',
                            formik.values.servicesOffered.filter((item) => item !== val)
                        );
                    }}
                />

                {/* Partnership Interest Dropdown */}
                <CustomDropdown
                    label="Partnership Interest"
                    required
                    value={formik.values.partnershipInterest}
                    placeholder="Select the partnership interest"
                    data={partnershipData}
                    isOpen={activeDropdown === 'partnershipInterest'}
                    onToggle={() => toggleDropdown('partnershipInterest')}
                    onSelect={(val) => {
                        formik.setFieldValue('partnershipInterest', val);
                        setActiveDropdown(null);
                    }}
                />

                {/* Registration Documents */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>
                        Registration Documents ( Upto 5 ) <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={[styles.imagePickerContainer, selectedCertificates.length > 0 && styles.solidBorder]}>
                        {selectedCertificates.length > 0 &&
                            selectedCertificates.map((img, index) => (
                                <View key={img.uri || index} style={styles.imageWrapper}>
                                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                                    <Pressable
                                        style={styles.deleteButton}
                                        onPress={() => handleImageDelete(index, 'certificate')}
                                    >
                                        <Ionicons name="trash" size={14} color="white" />
                                    </Pressable>
                                </View>
                            ))}
                        {selectedCertificates.length < 5 && (
                            <Pressable
                                style={selectedCertificates.length > 0 ? styles.smallAddButton : styles.imagePlaceholder}
                                onPress={() => handleImagePick('certificate')}
                            >
                                <Ionicons name="arrow-down-circle-outline" size={32} color="black" />
                                {selectedCertificates.length === 0 && <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>}
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* How did you hear about us? Dropdown */}
                <CustomDropdown
                    label="How did you hear about us?"
                    required
                    value={formik.values.hearAboutUs}
                    placeholder="Select the source"
                    data={sourceData}
                    isOpen={activeDropdown === 'hearAboutUs'}
                    onToggle={() => toggleDropdown('hearAboutUs')}
                    onSelect={(val) => {
                        formik.setFieldValue('hearAboutUs', val);
                        setActiveDropdown(null);
                    }}
                />

                {/* Message */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Message</Text>
                    <TextInput
                        style={[styles.textInput, styles.textArea]}
                        multiline
                        placeholder="Enter your message"
                        placeholderTextColor={'#999'}
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
    multiDropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    multiSelectTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        minHeight: 44,
        backgroundColor: '#fff',
    },
    inputInnerContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    placeholderTextInline: {
        color: '#999',
        fontSize: 14,
        paddingVertical: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#245d5a',
        borderRadius: 14,
        paddingVertical: 3,
        paddingHorizontal: 8,
        gap: 4,
    },
    chipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
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
    chipWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
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