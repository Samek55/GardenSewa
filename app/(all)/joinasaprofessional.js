import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import {
    ActivityIndicator,
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

import { createGardenerApplication } from '../../api/PostApiGardener';
import { notifyGardenerApplicationReceived } from '../../api/PostApiNotification';
import { sendOtp } from '../../api/PostApiOtp';
import { uploadPrivateDocument, uploadPublicFile } from '../../api/uploadToStorage';
import { categories, cityData } from '../../data/servicesList';

// These three lists are not shown on the live gardensewa.com/join form's
// collapsed screenshots (they use a "+"-style multi-select whose options
// were never expanded), so they're a reasonable placeholder — swap in the
// real option lists once confirmed, same as categories/cityData above.
const languageOptions = ['Nepali', 'English', 'Hindi', 'Maithili', 'Bhojpuri', 'Newari', 'Tamang', 'Other'];
const vehicleOptions = ['Personal Vehicle', 'Office Vehicle', 'None'];
const drivingLicenseOptions = ['Two-Wheeler', 'Four-Wheeler', 'No'];

// Every other option list below is copied verbatim from the live form's
// screenshots and must match supabase/migrations/0001_create_gardener_table.sql's
// CHECK constraints exactly, or submissions will be rejected by the database.
const foreignReturneeOptions = ['No', 'Australia', 'Europe', 'Gulf', 'India', 'USA', 'Other'];
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const relationOptions = ['Father', 'Mother', 'Son', 'Daughter', 'Husband', 'Wife'];
const academicBackgroundOptions = ['Literate', 'SLC/SEE', 'Diploma', 'Graduate', 'Post Graduate', 'Ph.D.'];
const yesNoOptions = ['Yes', 'No'];
const workPreferenceOptions = [
    'Hourly Basis ( 3 Hours in the Morning )',
    'Hourly Basis ( 3 Hours in the Evening )',
    'Daily Basis ( 7 Hours Daily )',
    'Weekly Basis ( 42 Hours Weekly )',
    'Monthly Basis ( 182 Hours Weekly )',
    'Part Time',
    'Any Time',
    'Other',
];
const howDidYouKnowOptions = [
    'Google Search', 'Registration DropZone', 'Facebook', 'Instagram',
    'TikTok', 'LinkedIn', 'Twitter', 'Referred by Friend/ Other', 'Other',
];

const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

const validationSchema = object({
    full_name: string().required('Full name is required').min(3, 'Name too short'),
    phone: string().required('Phone number is required').min(10, 'Invalid phone number'),
    foreign_returnee: string().required('This field is required'),
    citizenship_number: string().required('Citizenship number is required'),
    issued_district: string().required('Issued district is required'),
    email: string().email('Invalid email address'),
    gender: string().required('Gender selection is required'),
    blood_group: string().required('Blood group is required'),
    emergency_contact_number: string().required('Emergency contact number is required').min(10, 'Invalid phone number'),
    emergency_contact_relation: string().required('Relation is required'),
    area_of_expertise: array().of(string()).min(1, 'At least 1 expertise is required').max(5, 'Maximum 5 expertise permitted'),
    work_preference: string().required('Work preference is required'),
    languages_known: array().of(string()).min(1, 'At least 1 language is required'),
    has_driving_license: array().of(string()).min(1, 'This field is required'),
    expected_working_city: array().of(string()).min(1, 'At least 1 city is required'),
    wants_advance_training: string().required('This field is required'),
    how_did_you_know: string().required('This field is required'),
    terms: boolean().isTrue('Must accept terms and conditions'),
});

const REQUIRED_FIELD_ORDER = [
    'full_name', 'phone', 'foreign_returnee', 'citizenship_number', 'issued_district',
    'email', 'gender', 'blood_group', 'emergency_contact_number', 'emergency_contact_relation',
    'area_of_expertise', 'work_preference', 'languages_known', 'has_driving_license',
    'expected_working_city', 'wants_advance_training', 'how_did_you_know', 'terms',
];

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
    maxLimit = 999,
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

const DocumentPickerField = ({ label, required = false, file, onPick, onRemove }) => (
    <View style={styles.individualContainer}>
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
            <Pressable style={styles.imagePickerContainer} onPress={onPick}>
                <Ionicons name="arrow-down-circle-outline" size={28} color="black" />
                <Text style={{ marginTop: 4 }}>Drop file here or click to browse</Text>
            </Pressable>
        )}
    </View>
);

export default function JoinProfessional() {
    const [profilePicture, setProfilePicture] = useState(null);
    const [identityPicture, setIdentityPicture] = useState(null);
    const [trainingCertificate, setTrainingCertificate] = useState(null);
    const [experienceCertificate, setExperienceCertificate] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const toggleDropdown = (name) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
    };

    const formik = useFormik({
        initialValues: {
            full_name: '',
            phone: '',
            alternative_phone: '',
            foreign_returnee: '',
            citizenship_number: '',
            issued_district: '',
            email: '',
            nid_number: '',
            gender: 'Male',
            blood_group: '',
            emergency_contact_number: '',
            emergency_contact_relation: '',
            academic_background: '',
            has_training_certificate: '',
            training_institute_name: '',
            years_experience: '',
            area_of_expertise: [],
            work_preference: '',
            languages_known: [],
            personal_office_vehicle: [],
            has_driving_license: [],
            expected_working_city: [],
            working_area: '',
            province: '',
            district: '',
            municipality: '',
            ward: '',
            insurance_company_name: '',
            insurance_policy_number: '',
            referred_by_name: '',
            referral_phone_number: '',
            wants_advance_training: '',
            how_did_you_know: '',
            terms: false,
        },
        validationSchema,
        onSubmit: () => { },
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
                aspect: [1, 1],
            });

            if (!result.canceled) {
                if (type === 'profile') setProfilePicture(result.assets[0]);
                else if (type === 'identity') setIdentityPicture(result.assets[0]);
            }
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleDocumentPick = async (type) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            if (type === 'training') setTrainingCertificate(asset);
            else setExperienceCertificate(asset);
        } catch (error) {
            console.error('DocumentPicker Error:', error);
        }
    };

    const handleClearForm = () => {
        formik.resetForm();
        setProfilePicture(null);
        setIdentityPicture(null);
        setTrainingCertificate(null);
        setExperienceCertificate(null);
        setActiveDropdown(null);
    };

    const handleSubmitWithValidation = async () => {
        const errors = await formik.validateForm();
        const firstError = REQUIRED_FIELD_ORDER.find((field) => errors[field]);

        if (firstError) {
            formik.setTouched({ [firstError]: true });
            Alert.alert('Validation Error', Array.isArray(errors[firstError]) ? errors[firstError][0] : errors[firstError]);
            return;
        }
        if (!profilePicture) {
            Alert.alert('Validation Error', 'Please upload your profile picture');
            return;
        }
        if (!identityPicture) {
            Alert.alert('Validation Error', 'Please upload Citizenship/NID');
            return;
        }

        setSubmitting(true);
        try {
            const profile_picture_url = await uploadPublicFile(profilePicture.uri, profilePicture.fileName);
            const citizenship_nid_path = await uploadPrivateDocument(identityPicture.uri, identityPicture.fileName);
            const training_certificate_url = trainingCertificate
                ? await uploadPublicFile(trainingCertificate.uri, trainingCertificate.name)
                : null;
            const experience_certificate_url = experienceCertificate
                ? await uploadPublicFile(experienceCertificate.uri, experienceCertificate.name)
                : null;

            const v = formik.values;
            await createGardenerApplication({
                full_name: v.full_name,
                phone: v.phone,
                alternative_phone: nullIfEmpty(v.alternative_phone),
                foreign_returnee: v.foreign_returnee,
                citizenship_number: v.citizenship_number,
                issued_district: v.issued_district,
                email: nullIfEmpty(v.email),
                nid_number: nullIfEmpty(v.nid_number),
                gender: v.gender,
                blood_group: v.blood_group,
                emergency_contact_number: v.emergency_contact_number,
                emergency_contact_relation: v.emergency_contact_relation,
                citizenship_nid_path,
                profile_picture_url,
                academic_background: nullIfEmpty(v.academic_background),
                has_training_certificate: nullIfEmpty(v.has_training_certificate),
                training_institute_name: nullIfEmpty(v.training_institute_name),
                training_certificate_url,
                experience_certificate_url,
                years_experience: v.years_experience === '' ? null : Number(v.years_experience),
                area_of_expertise: v.area_of_expertise,
                work_preference: v.work_preference,
                languages_known: v.languages_known,
                personal_office_vehicle: v.personal_office_vehicle,
                has_driving_license: v.has_driving_license,
                expected_working_city: v.expected_working_city,
                working_area: nullIfEmpty(v.working_area),
                province: nullIfEmpty(v.province),
                district: nullIfEmpty(v.district),
                municipality: nullIfEmpty(v.municipality),
                ward: nullIfEmpty(v.ward),
                insurance_company_name: nullIfEmpty(v.insurance_company_name),
                insurance_policy_number: nullIfEmpty(v.insurance_policy_number),
                referred_by_name: nullIfEmpty(v.referred_by_name),
                referral_phone_number: nullIfEmpty(v.referral_phone_number),
                wants_advance_training: v.wants_advance_training,
                how_did_you_know: v.how_did_you_know,
            });

            const phone = v.phone;

            // The application is already saved at this point — a failed OTP send
            // (e.g. SMS provider hiccup) shouldn't block the user from proceeding,
            // just prevent them from completing verification until they hit Resend.
            try {
                await sendOtp(phone, 'join-gardener', v.full_name);
            } catch (otpError) {
                console.error('send-otp error:', otpError);
            }

            try {
                await notifyGardenerApplicationReceived(v.full_name);
            } catch (notifyError) {
                console.error('send-notification error:', notifyError);
            }

            handleClearForm();
            router.push({
                pathname: '/phoneVerification',
                params: { phone, requestType: 'Join as a Gardener', otpPurpose: 'join-gardener' },
            });
        } catch (error) {
            Alert.alert('Submission Failed', error.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
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
                <Text style={styles.headerText}>Join as a Gardener</Text>
                <Text style={styles.subHeaderText}>Start Earning from Tomorrow.</Text>

                {/* Full Name */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        placeholderTextColor={'#999'}
                        value={formik.values.full_name}
                        onChangeText={formik.handleChange('full_name')}
                    />
                </View>

                {/* Phone */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Phone <Text style={styles.asterisk}>*</Text></Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.iconWrapper}><NP width={30} height={20} /></View>
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter your phone number"
                            placeholderTextColor={'#999'}
                            value={formatPhone(formik.values.phone)}
                            maxLength={12}
                            onChangeText={(text) => formik.setFieldValue('phone', text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Alternative Phone */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Alternative Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.iconWrapper}><NP width={30} height={20} /></View>
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter alternative phone number"
                            placeholderTextColor={'#999'}
                            value={formatPhone(formik.values.alternative_phone)}
                            maxLength={12}
                            onChangeText={(text) => formik.setFieldValue('alternative_phone', text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Foreign Returnee */}
                <CustomDropdown
                    label="Are you a foreign returnee?"
                    required
                    value={formik.values.foreign_returnee}
                    placeholder="Select an option"
                    data={foreignReturneeOptions}
                    isOpen={activeDropdown === 'foreignReturnee'}
                    onToggle={() => toggleDropdown('foreignReturnee')}
                    onSelect={(val) => { formik.setFieldValue('foreign_returnee', val); setActiveDropdown(null); }}
                />

                {/* Citizenship Number */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Citizenship Number <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter citizenship number"
                        placeholderTextColor={'#999'}
                        value={formik.values.citizenship_number}
                        onChangeText={formik.handleChange('citizenship_number')}
                    />
                </View>

                {/* Issued District */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Issued District <Text style={styles.asterisk}>*</Text></Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter issued district"
                        placeholderTextColor={'#999'}
                        value={formik.values.issued_district}
                        onChangeText={formik.handleChange('issued_district')}
                    />
                </View>

                {/* Email */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        placeholderTextColor={'#999'}
                        value={formik.values.email}
                        onChangeText={formik.handleChange('email')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* NID */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>National ID Number (NID)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter NID number"
                        placeholderTextColor={'#999'}
                        value={formik.values.nid_number}
                        onChangeText={formik.handleChange('nid_number')}
                    />
                </View>

                {/* Gender */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Gender <Text style={styles.asterisk}>*</Text></Text>
                    <View style={styles.radioGroup}>
                        {['Male', 'Female'].map((option) => (
                            <TouchableOpacity key={option} style={styles.radioButtonContainer} onPress={() => formik.setFieldValue('gender', option)}>
                                <View style={styles.radioOuterCircle}>
                                    {formik.values.gender === option && <View style={styles.radioInnerCircle} />}
                                </View>
                                <Text style={styles.radioText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Blood Group */}
                <CustomDropdown
                    label="Blood Group"
                    required
                    value={formik.values.blood_group}
                    placeholder="Select blood group"
                    data={bloodGroupOptions}
                    isOpen={activeDropdown === 'bloodGroup'}
                    onToggle={() => toggleDropdown('bloodGroup')}
                    onSelect={(val) => { formik.setFieldValue('blood_group', val); setActiveDropdown(null); }}
                />

                {/* Emergency Contact */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Emergency Contact Number <Text style={styles.asterisk}>*</Text></Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.iconWrapper}><NP width={30} height={20} /></View>
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter phone number"
                            placeholderTextColor={'#999'}
                            value={formatPhone(formik.values.emergency_contact_number)}
                            maxLength={12}
                            onChangeText={(text) => formik.setFieldValue('emergency_contact_number', text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Relation */}
                <CustomDropdown
                    label="Relation with Emergency Contact Number"
                    required
                    value={formik.values.emergency_contact_relation}
                    placeholder="Select relation"
                    data={relationOptions}
                    isOpen={activeDropdown === 'relation'}
                    onToggle={() => toggleDropdown('relation')}
                    onSelect={(val) => { formik.setFieldValue('emergency_contact_relation', val); setActiveDropdown(null); }}
                />

                {/* Upload Citizenship/NID */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Upload Citizenship / NID <Text style={styles.asterisk}>*</Text></Text>
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
                                <Text style={{ marginTop: 4 }}>Drop file here or click to browse</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Upload Profile Picture */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Upload Profile Picture <Text style={styles.asterisk}>*</Text></Text>
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
                                <Text style={{ marginTop: 4 }}>Drop file here or click to browse</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionHeader}>Professional Background</Text>

                {/* Academic Background */}
                <CustomDropdown
                    label="Academic Background"
                    value={formik.values.academic_background}
                    placeholder="Select academic background"
                    data={academicBackgroundOptions}
                    isOpen={activeDropdown === 'academicBackground'}
                    onToggle={() => toggleDropdown('academicBackground')}
                    onSelect={(val) => { formik.setFieldValue('academic_background', val); setActiveDropdown(null); }}
                />

                {/* Training Certificate? */}
                <CustomDropdown
                    label="Do you have Gardening Training Certificate?"
                    value={formik.values.has_training_certificate}
                    placeholder="Select an option"
                    data={yesNoOptions}
                    isOpen={activeDropdown === 'hasTrainingCertificate'}
                    onToggle={() => toggleDropdown('hasTrainingCertificate')}
                    onSelect={(val) => { formik.setFieldValue('has_training_certificate', val); setActiveDropdown(null); }}
                />

                {/* Institute Name */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Name of Institute / Training Center</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter institute name"
                        placeholderTextColor={'#999'}
                        value={formik.values.training_institute_name}
                        onChangeText={formik.handleChange('training_institute_name')}
                    />
                </View>

                {/* Training Certificate Upload */}
                <DocumentPickerField
                    label="Upload Gardening Training .pdf Certificate"
                    file={trainingCertificate}
                    onPick={() => handleDocumentPick('training')}
                    onRemove={() => setTrainingCertificate(null)}
                />

                {/* Experience Certificate Upload */}
                <DocumentPickerField
                    label="Upload Experience Certificate (.pdf)"
                    file={experienceCertificate}
                    onPick={() => handleDocumentPick('experience')}
                    onRemove={() => setExperienceCertificate(null)}
                />

                {/* Years of Experience */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Years of Experience</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter years of experience"
                        placeholderTextColor={'#999'}
                        value={formik.values.years_experience}
                        onChangeText={formik.handleChange('years_experience')}
                        keyboardType="numeric"
                    />
                </View>

                {/* Area of Expertise */}
                <MultiSelectDropdown
                    label="Area of Expertise ( Max 5 )"
                    required
                    maxLimit={5}
                    selectedItems={formik.values.area_of_expertise}
                    placeholder="Select up to 5 expertise"
                    data={categories}
                    isOpen={activeDropdown === 'category'}
                    onToggle={() => toggleDropdown('category')}
                    onSelectItem={(val) => formik.setFieldValue('area_of_expertise', [...formik.values.area_of_expertise, val])}
                    onRemoveItem={(val) => formik.setFieldValue('area_of_expertise', formik.values.area_of_expertise.filter((i) => i !== val))}
                />

                {/* Work Preference */}
                <CustomDropdown
                    label="Work Preference"
                    required
                    value={formik.values.work_preference}
                    placeholder="Select work preference"
                    data={workPreferenceOptions}
                    isOpen={activeDropdown === 'workPreference'}
                    onToggle={() => toggleDropdown('workPreference')}
                    onSelect={(val) => { formik.setFieldValue('work_preference', val); setActiveDropdown(null); }}
                />

                {/* Languages Known */}
                <MultiSelectDropdown
                    label="Languages Known"
                    required
                    selectedItems={formik.values.languages_known}
                    placeholder="Select languages"
                    data={languageOptions}
                    isOpen={activeDropdown === 'languages'}
                    onToggle={() => toggleDropdown('languages')}
                    onSelectItem={(val) => formik.setFieldValue('languages_known', [...formik.values.languages_known, val])}
                    onRemoveItem={(val) => formik.setFieldValue('languages_known', formik.values.languages_known.filter((i) => i !== val))}
                />

                {/* Personal/Office Vehicle */}
                <MultiSelectDropdown
                    label="Personal / Office Vehicle"
                    selectedItems={formik.values.personal_office_vehicle}
                    placeholder="Select vehicle"
                    data={vehicleOptions}
                    isOpen={activeDropdown === 'vehicle'}
                    onToggle={() => toggleDropdown('vehicle')}
                    onSelectItem={(val) => formik.setFieldValue('personal_office_vehicle', [...formik.values.personal_office_vehicle, val])}
                    onRemoveItem={(val) => formik.setFieldValue('personal_office_vehicle', formik.values.personal_office_vehicle.filter((i) => i !== val))}
                />

                {/* Driving License */}
                <MultiSelectDropdown
                    label="Do you have valid Driving License?"
                    required
                    selectedItems={formik.values.has_driving_license}
                    placeholder="Select an option"
                    data={drivingLicenseOptions}
                    isOpen={activeDropdown === 'drivingLicense'}
                    onToggle={() => toggleDropdown('drivingLicense')}
                    onSelectItem={(val) => formik.setFieldValue('has_driving_license', [...formik.values.has_driving_license, val])}
                    onRemoveItem={(val) => formik.setFieldValue('has_driving_license', formik.values.has_driving_license.filter((i) => i !== val))}
                />

                {/* Expected Working City */}
                <MultiSelectDropdown
                    label="Expected Working City"
                    required
                    selectedItems={formik.values.expected_working_city}
                    placeholder="Select cities"
                    data={cityData}
                    isOpen={activeDropdown === 'expectedCity'}
                    onToggle={() => toggleDropdown('expectedCity')}
                    onSelectItem={(val) => formik.setFieldValue('expected_working_city', [...formik.values.expected_working_city, val])}
                    onRemoveItem={(val) => formik.setFieldValue('expected_working_city', formik.values.expected_working_city.filter((i) => i !== val))}
                />

                {/* Working Area */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Working Area</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter working area"
                        placeholderTextColor={'#999'}
                        value={formik.values.working_area}
                        onChangeText={formik.handleChange('working_area')}
                    />
                </View>

                <Text style={styles.sectionHeader}>Permanent Address</Text>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Province</Text>
                    <TextInput style={styles.textInput} placeholder="Enter province" placeholderTextColor={'#999'} value={formik.values.province} onChangeText={formik.handleChange('province')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>District</Text>
                    <TextInput style={styles.textInput} placeholder="Enter district" placeholderTextColor={'#999'} value={formik.values.district} onChangeText={formik.handleChange('district')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Municipality</Text>
                    <TextInput style={styles.textInput} placeholder="Enter municipality" placeholderTextColor={'#999'} value={formik.values.municipality} onChangeText={formik.handleChange('municipality')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Ward</Text>
                    <TextInput style={styles.textInput} placeholder="Enter ward" placeholderTextColor={'#999'} value={formik.values.ward} onChangeText={formik.handleChange('ward')} />
                </View>

                <Text style={styles.sectionHeader}>Other Details</Text>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Name of Insurance Company</Text>
                    <TextInput style={styles.textInput} placeholder="Enter insurance company name" placeholderTextColor={'#999'} value={formik.values.insurance_company_name} onChangeText={formik.handleChange('insurance_company_name')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Policy Number</Text>
                    <TextInput style={styles.textInput} placeholder="Enter policy number" placeholderTextColor={'#999'} value={formik.values.insurance_policy_number} onChangeText={formik.handleChange('insurance_policy_number')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Referred By ( Full Name )</Text>
                    <TextInput style={styles.textInput} placeholder="Enter referrer's name" placeholderTextColor={'#999'} value={formik.values.referred_by_name} onChangeText={formik.handleChange('referred_by_name')} />
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Referral Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <View style={styles.iconWrapper}><NP width={30} height={20} /></View>
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter phone number"
                            placeholderTextColor={'#999'}
                            value={formatPhone(formik.values.referral_phone_number)}
                            maxLength={12}
                            onChangeText={(text) => formik.setFieldValue('referral_phone_number', text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <CustomDropdown
                    label="Are you looking for an advance training?"
                    required
                    value={formik.values.wants_advance_training}
                    placeholder="Select an option"
                    data={yesNoOptions}
                    isOpen={activeDropdown === 'advanceTraining'}
                    onToggle={() => toggleDropdown('advanceTraining')}
                    onSelect={(val) => { formik.setFieldValue('wants_advance_training', val); setActiveDropdown(null); }}
                />

                <CustomDropdown
                    label="How did you know about us?"
                    required
                    value={formik.values.how_did_you_know}
                    placeholder="Select an option"
                    data={howDidYouKnowOptions}
                    isOpen={activeDropdown === 'howDidYouKnow'}
                    onToggle={() => toggleDropdown('howDidYouKnow')}
                    onSelect={(val) => { formik.setFieldValue('how_did_you_know', val); setActiveDropdown(null); }}
                />

                {/* Terms and Conditions */}
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
                        <Text style={styles.hyperlink} onPress={() => router.push('./terms')}>Terms and Conditions</Text>{' '}
                        <Text style={styles.asterisk}>*</Text>
                    </Text>
                </View>

                {/* Form Buttons */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearForm} disabled={submitting}>
                        <Ionicons name="refresh" size={18} color="#333" />
                        <Text style={styles.label}>Clear Form</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitWithValidation} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    scrollview: { flex: 1, backgroundColor: '#245d5a' },
    container: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 26 },
    headerText: { fontSize: 28, fontWeight: 'bold' },
    subHeaderText: { fontSize: 14, color: '#666', marginBottom: 8 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 },
    formContainer: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 16, marginBottom: 10 },
    individualContainer: { width: '100%', gap: 6 },
    label: { fontWeight: '500', color: '#333' },
    asterisk: { color: '#d9534f', fontWeight: 'bold' },
    textInput: { width: '100%', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, height: 44 },
    phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, height: 44 },
    iconWrapper: { paddingRight: 8, borderRightWidth: 1, borderRightColor: '#E0E0E0', height: '60%', justifyContent: 'center', marginRight: 10 },
    flexInput: { flex: 1, height: '100%' },
    radioGroup: { flexDirection: 'row', gap: 20 },
    radioButtonContainer: { flexDirection: 'row', alignItems: 'center' },
    radioOuterCircle: { height: 16, width: 16, borderRadius: 10, borderWidth: 2, borderColor: '#245d5a', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    radioInnerCircle: { height: 8, width: 8, borderRadius: 5, backgroundColor: '#245d5a' },
    radioText: { fontSize: 16 },
    dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, height: 44, backgroundColor: '#fff' },
    triggerText: { fontSize: 14, color: '#000' },
    placeholderText: { color: '#999' },
    dropdownContainer: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, marginTop: 4, backgroundColor: '#fff', maxHeight: 250, elevation: 3 },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingHorizontal: 8, height: 40, backgroundColor: '#f9f9f9' },
    searchInput: { flex: 1, height: '100%', fontSize: 14 },
    itemsList: { maxHeight: 200 },
    dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    multiDropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownItemText: { fontSize: 14, color: '#333' },
    noResultsContainer: { padding: 16, alignItems: 'center' },
    noResultsText: { color: '#999', fontSize: 14 },
    placeholderTextInline: { color: '#999', fontSize: 14, paddingVertical: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#245d5a', borderRadius: 14, paddingVertical: 3, paddingHorizontal: 8, gap: 4 },
    chipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    imagePickerContainer: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center', minHeight: 100, borderRadius: 6, padding: 8 },
    solidBorder: { borderStyle: 'solid' },
    imageWrapper: { width: 100, height: 100, borderRadius: 4, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%' },
    deleteButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 4 },
    imagePlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
    documentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10 },
    documentName: { flex: 1, fontSize: 13, color: '#333' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkboxLabel: { fontSize: 14, color: '#333', flex: 1 },
    hyperlink: { color: '#245d5a', textDecorationLine: 'underline', fontWeight: '600' },
    bottomContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
    clearButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    submitButton: { backgroundColor: '#245d5a', borderRadius: 12, height: 44, width: '45%', alignItems: 'center', justifyContent: 'center' },
    submitButtonText: { color: '#fff', fontWeight: 'bold' },
    multiSelectTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, minHeight: 44, backgroundColor: '#fff' },
    inputInnerContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
});
