import { getMyProfile, updateMyProfile } from '@/api/PostApiAdmin';
import { uploadPublicFile } from '@/api/uploadToStorage';
import { AdminAuthContext } from '@/context/AdminAuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { categories, cityData } from '../../data/servicesList';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    bdm: 'Business Development Manager',
    call_center: 'Call Center',
    gardener: 'Gardener',
};

const formatPhone = (text) => {
    const digitsOnly = (text || '').replace(/[^0-9]/g, '');
    if (digitsOnly.length === 10) {
        return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 10)}`;
    }
    return digitsOnly;
};

const CustomDropdown = ({ label, value, placeholder, data, isOpen, onToggle, onSelect }) => {
    const [query, setQuery] = useState('');
    const filteredData = data.filter((item) =>
        (item.name || item.title || item).toLowerCase().includes(query.toLowerCase())
    );

    return (
        <View style={styles.individualContainer}>
            <Text style={styles.label}>{label}</Text>
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
                        {filteredData.length > 0 ? filteredData.map((item, idx) => {
                            const itemLabel = item.name || item.title || item;
                            return (
                                <TouchableOpacity
                                    key={item.id || idx}
                                    style={styles.dropdownItem}
                                    onPress={() => { onSelect(itemLabel); setQuery(''); }}
                                >
                                    <Text style={styles.dropdownItemText}>{itemLabel}</Text>
                                </TouchableOpacity>
                            );
                        }) : (
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

const MultiSelectDropdown = ({ label, selectedItems = [], placeholder, data, isOpen, onToggle, onSelectItem, onRemoveItem, maxLimit = 5 }) => {
    const [query, setQuery] = useState('');
    const filteredData = data.filter((item) =>
        (item.name || item.title || item).toLowerCase().includes(query.toLowerCase())
    );

    return (
        <View style={styles.individualContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.multiSelectTrigger} activeOpacity={0.8} onPress={onToggle}>
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
                        {filteredData.length > 0 ? filteredData.map((item, idx) => {
                            const itemLabel = item.name || item.title || item;
                            const isSelected = selectedItems.includes(itemLabel);
                            return (
                                <TouchableOpacity
                                    key={item.id || idx}
                                    style={[styles.dropdownItem, styles.multiDropdownItem]}
                                    onPress={() => {
                                        if (isSelected) {
                                            onRemoveItem(itemLabel);
                                        } else {
                                            if (selectedItems.length >= maxLimit) {
                                                Alert.alert('Limit Reached', `You can select up to ${maxLimit} items.`);
                                                return;
                                            }
                                            onSelectItem(itemLabel);
                                        }
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{itemLabel}</Text>
                                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#245d5a" />}
                                </TouchableOpacity>
                            );
                        }) : (
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

const UpdateProfile = () => {
    const { isAdminLoggedIn, adminRole, isAdminAuthLoading, adminLogoutLocal, updateAdminDisplayName } = useContext(AdminAuthContext);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [photoUrl, setPhotoUrl] = useState(null);
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState('');
    const [yearsExperience, setYearsExperience] = useState('');
    const [areaOfExpertise, setAreaOfExpertise] = useState([]);
    const [expectedWorkingCity, setExpectedWorkingCity] = useState([]);
    const [workingArea, setWorkingArea] = useState('');

    const isGardener = adminRole === 'gardener';

    useEffect(() => {
        if (isAdminAuthLoading) return;
        if (!isAdminLoggedIn) {
            router.replace('/adminLogin');
        }
    }, [isAdminAuthLoading, isAdminLoggedIn]);

    useEffect(() => {
        if (isAdminAuthLoading || !isAdminLoggedIn) return;
        (async () => {
            try {
                const result = await getMyProfile();
                if (!result.success) {
                    Alert.alert('Error', result.message || 'Could not load profile.');
                    return;
                }
                const p = result.profile;
                setFullName(p.fullName || '');
                setPhone(p.phone || '');
                setPhotoUrl(p.photoUrl || null);
                if (result.role === 'gardener') {
                    setEmail(p.email || '');
                    setGender(p.gender || '');
                    setYearsExperience(p.yearsExperience != null ? String(p.yearsExperience) : '');
                    setAreaOfExpertise(p.areaOfExpertise || []);
                    setExpectedWorkingCity(p.expectedWorkingCity || []);
                    setWorkingArea(p.workingArea || '');
                }
            } catch (error) {
                Alert.alert('Error', error.message || 'Could not load profile.');
            } finally {
                setLoading(false);
            }
        })();
    }, [isAdminAuthLoading, isAdminLoggedIn]);

    const toggleDropdown = (name) => setActiveDropdown((prev) => (prev === name ? null : name));

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
                aspect: [1, 1],
            });
            if (!result.canceled) setProfilePicture(result.assets[0]);
        } catch (error) {
            console.error('ImagePicker Error:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to log out of your account?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await adminLogoutLocal();
                    router.replace('/(tabs)');
                },
            },
        ]);
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Validation', 'Full name cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            let newPhotoUrl = photoUrl;
            if (profilePicture) {
                newPhotoUrl = await uploadPublicFile(profilePicture.uri, profilePicture.fileName);
                setPhotoUrl(newPhotoUrl);
                setProfilePicture(null);
            }

            const fields = { fullName: fullName.trim(), photoUrl: newPhotoUrl };
            if (isGardener) {
                fields.email = email.trim();
                fields.gender = gender;
                fields.yearsExperience = yearsExperience;
                fields.areaOfExpertise = areaOfExpertise;
                fields.expectedWorkingCity = expectedWorkingCity;
                fields.workingArea = workingArea;
            }

            const result = await updateMyProfile(fields);
            if (!result.success) {
                Alert.alert('Error', result.message || 'Could not save profile.');
                return;
            }
            await updateAdminDisplayName(result.fullName);
            Alert.alert('Saved', 'Profile updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not save profile.');
        } finally {
            setSaving(false);
        }
    };

    const displayPhoto = profilePicture?.uri || photoUrl;

    if (isAdminAuthLoading || !isAdminLoggedIn || loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#245d5a" />
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <KeyboardAwareScrollView
                style={styles.container}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={120}
                enableAutomaticScroll={true}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.titleText}>Update Profile</Text>
                </View>

                <View style={styles.profileDetailsContainer}>
                    <View style={styles.imageContainer}>
                        <TouchableOpacity onPress={handleImagePick} style={styles.avatarWrapper}>
                            {displayPhoto ? (
                                <Image source={{ uri: displayPhoto }} style={styles.profileImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={36} color="#fff" />
                                </View>
                            )}
                            <View style={styles.editIconBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subText}>{fullName || 'Your Name'}</Text>
                    <Text style={styles.subText}>+977 {formatPhone(phone)}</Text>
                    <Text style={styles.roleBadgeText}>{ROLE_LABELS[adminRole] || adminRole}</Text>
                </View>

                <View style={styles.formCard}>
                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your full name"
                            placeholderTextColor={'#999'}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.individualContainer}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={[styles.phoneInputContainer, styles.disabledInput]}>
                            <TextInput
                                style={[styles.flexInput, { color: '#666' }]}
                                value={formatPhone(phone)}
                                editable={false}
                            />
                            <Ionicons name="lock-closed-outline" size={18} color="#888" />
                        </View>
                    </View>

                    {isGardener && (
                        <>
                            <View style={styles.individualContainer}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your email"
                                    placeholderTextColor={'#999'}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.individualContainer}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.radioGroup}>
                                    {['Male', 'Female'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={styles.radioButtonContainer}
                                            onPress={() => setGender(option)}
                                        >
                                            <View style={styles.radioOuterCircle}>
                                                {gender === option && <View style={styles.radioInnerCircle} />}
                                            </View>
                                            <Text style={styles.radioText}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <MultiSelectDropdown
                                label="Your Expertise"
                                maxLimit={5}
                                selectedItems={areaOfExpertise}
                                placeholder="Select up to 5 expertises"
                                data={categories}
                                isOpen={activeDropdown === 'category'}
                                onToggle={() => toggleDropdown('category')}
                                onSelectItem={(val) => setAreaOfExpertise((prev) => [...prev, val])}
                                onRemoveItem={(val) => setAreaOfExpertise((prev) => prev.filter((i) => i !== val))}
                            />

                            <View style={styles.individualContainer}>
                                <Text style={styles.label}>Years of Experience</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your years of experience"
                                    placeholderTextColor={'#999'}
                                    value={yearsExperience}
                                    onChangeText={(t) => setYearsExperience(t.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                />
                            </View>

                            <MultiSelectDropdown
                                label="Expected Working City"
                                maxLimit={5}
                                selectedItems={expectedWorkingCity}
                                placeholder="Select up to 5 cities"
                                data={cityData}
                                isOpen={activeDropdown === 'city'}
                                onToggle={() => toggleDropdown('city')}
                                onSelectItem={(val) => setExpectedWorkingCity((prev) => [...prev, val])}
                                onRemoveItem={(val) => setExpectedWorkingCity((prev) => prev.filter((i) => i !== val))}
                            />

                            <View style={styles.individualContainer}>
                                <Text style={styles.label}>Working Area</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Baneshwor, Koteshwor"
                                    placeholderTextColor={'#999'}
                                    value={workingArea}
                                    onChangeText={setWorkingArea}
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.accountSection}>
                        <View style={styles.accountTitleRow}>
                            <Ionicons name="settings-outline" size={18} color="#245d5a" />
                            <Text style={styles.accountTitleText}>Account</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.accountCard}
                            activeOpacity={0.7}
                            onPress={() => router.push({ pathname: '/resetPin', params: { phone } })}
                        >
                            <View style={styles.keyIconBadge}>
                                <Ionicons name="key-outline" size={20} color="#245d5a" />
                            </View>
                            <View style={styles.accountCardTextContainer}>
                                <Text style={styles.changePinTitle}>Change PIN</Text>
                                <Text style={styles.changePinSubtitle}>Update your 4-digit login PIN</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#245d5a',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#245d5a',
    },
    container: {
        flex: 1,
        paddingBottom: 44,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 16,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    profileDetailsContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    imageContainer: {
        marginBottom: 8,
    },
    avatarWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#245d5a',
        borderColor: '#fff',
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 4,
    },
    subText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '500',
    },
    roleBadgeText: {
        fontSize: 12,
        color: '#D0E4E2',
        marginTop: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        gap: 24,
        marginVertical: 16,
    },
    individualContainer: {
        width: '100%',
        gap: 6,
    },
    label: {
        fontWeight: '500',
        color: '#333',
        fontSize: 14,
    },
    textInput: {
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        height: 44,
        fontSize: 14,
        color: '#000',
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
    disabledInput: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
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
        height: 18,
        width: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#245d5a',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    radioInnerCircle: {
        height: 8,
        width: 8,
        borderRadius: 4,
        backgroundColor: '#245d5a',
    },
    radioText: {
        fontSize: 15,
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
        maxHeight: 200,
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
        maxHeight: 150,
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
    placeholderTextInline: {
        color: '#999',
        fontSize: 14,
    },
    accountSection: {
        gap: 12,
        marginTop: 8,
    },
    accountTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    accountTitleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    keyIconBadge: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: '#E6F0EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    accountCardTextContainer: {
        flex: 1,
    },
    changePinTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    changePinSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: '#245d5a',
        borderRadius: 8,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default UpdateProfile;
