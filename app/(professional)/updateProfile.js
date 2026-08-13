import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useContext, useState } from 'react';
import {
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
import { array, object, string } from 'yup';

import { AuthContext } from '../../context/AuthContext';
import { areasByCity } from '../../data/Data';
import { categories, cityData } from '../../data/servicesList';

const validationSchema = object({
  name: string().required('Full name is required').min(3, 'Name too short'),
  gender: string().required('Gender selection is required'),
  email: string().email('Invalid email address'),
  category: array().of(string()).max(5, 'Maximum 5 expertise permitted'),
  yearsExperience: string(),
  city: string(),
  area: array().of(string()).max(5, 'Maximum 5 areas permitted'),
});

const CustomDropdown = ({ label, value, placeholder, data, isOpen, onToggle, onSelect, required = false }) => {
  const [query, setQuery] = useState('');

  const filteredData = data.filter((item) =>
    (item.name || item.title || item).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.individualContainer}>
      <Text style={styles.label}>
        {label} 
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

  const filteredData = data.filter((item) =>
    (item.name || item.title || item).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.individualContainer}>
      <Text style={styles.label}>
        {label} 
      </Text>

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
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => {
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

const formatPhone = (text) => {
  const digitsOnly = (text || '').replace(/[^0-9]/g, '');
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 10)}`;
  }
  return digitsOnly;
};

const UpdateProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const [profilePicture, setProfilePicture] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const formik = useFormik({
    initialValues: {
      name: user?.name || 'Pratigya Luitel',
      phone: user?.phone || '9860443954', 
      gender: user?.gender || 'Female',
      email: user?.email || '',
      category: user?.category || [],
      yearsExperience: user?.yearsExperience || '',
      city: user?.city || '',
      area: user?.area || [],
    },
    validationSchema,
    onSubmit: (values) => {
      Alert.alert('Success', 'Profile updated successfully!');
    },
  });

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        setProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('ImagePicker Error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/adminLogin');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const availableAreas = formik.values.city ? areasByCity[formik.values.city] || [] : [];

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
              <Image
                source={
                  profilePicture
                    ? { uri: profilePicture.uri }
                    : require('../../assets/images/icon.png')
                }
                style={styles.profileImage}
              />
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.subText}>{formik.values.name}</Text>
          <Text style={styles.subText}>+977 {formatPhone(formik.values.phone)}</Text>
        </View>

        <View style={styles.formCard}>
          {/* Full Name */}
          <View style={styles.individualContainer}>
            <Text style={styles.label}>
              Full Name 
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              placeholderTextColor={'#999'}
              value={formik.values.name}
              onChangeText={formik.handleChange('name')}
            />
          </View>

          {/* Read-Only Phone Field */}
          <View style={styles.individualContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.phoneInputContainer, styles.disabledInput]}>
              <TextInput
                style={[styles.flexInput, { color: '#666' }]}
                value={formatPhone(formik.values.phone)}
                editable={false}
              />
              <Ionicons name="lock-closed-outline" size={18} color="#888" />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.individualContainer}>
            <Text style={styles.label}>
              Gender 
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

          {/* Email Address */}
          <View style={styles.individualContainer}>
            <Text style={styles.label}>Email Address</Text>
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

          {/* Expertise Multi-Select */}
          <MultiSelectDropdown
            label="Your Expertise"
            maxLimit={5}
            selectedItems={formik.values.category}
            placeholder="Select up to 5 expertises"
            data={categories}
            isOpen={activeDropdown === 'category'}
            onToggle={() => toggleDropdown('category')}
            onSelectItem={(val) => {
              formik.setFieldValue('category', [...formik.values.category, val]);
            }}
            onRemoveItem={(val) => {
              formik.setFieldValue(
                'category',
                formik.values.category.filter((item) => item !== val)
              );
            }}
          />

          {/* Years of Experience */}
          <View style={styles.individualContainer}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your years of experience"
              placeholderTextColor={'#999'}
              value={formik.values.yearsExperience}
              onChangeText={formik.handleChange('yearsExperience')}
              keyboardType="numeric"
            />
          </View>

          {/* City Selection */}
          <CustomDropdown
            label="City"
            value={formik.values.city}
            placeholder="Choose a city"
            data={cityData}
            isOpen={activeDropdown === 'city'}
            onToggle={() => toggleDropdown('city')}
            onSelect={(val) => {
              formik.setFieldValue('city', val);
              formik.setFieldValue('area', []);
              setActiveDropdown(null);
            }}
          />

          {/* Area Multi-Select */}
          {formik.values.city ? (
            <MultiSelectDropdown
              label="Area"
              maxLimit={5}
              selectedItems={formik.values.area}
              placeholder="Choose up to 5 Areas"
              data={availableAreas}
              isOpen={activeDropdown === 'area'}
              onToggle={() => toggleDropdown('area')}
              onSelectItem={(val) => {
                formik.setFieldValue('area', [...formik.values.area, val]);
              }}
              onRemoveItem={(val) => {
                formik.setFieldValue(
                  'area',
                  formik.values.area.filter((item) => item !== val)
                );
              }}
            />
          ) : null}

          {/* Account Section */}
          <View style={styles.accountSection}>
            <View style={styles.accountTitleRow}>
              <Ionicons name="settings-outline" size={18} color="#245d5a" />
              <Text style={styles.accountTitleText}>Account</Text>
            </View>

            <TouchableOpacity
              style={styles.accountCard}
              activeOpacity={0.7}
              onPress={() => router.push('/resetPin')}
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

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={formik.handleSubmit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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