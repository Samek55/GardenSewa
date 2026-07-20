import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-ico-flags';
import { categories, cityData } from "../../data/servicesList";

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function JoinProfessional() {

    const [selectedImage, setSelectedImage] = useState('')
    const [selectedIdentificationPicture, setSelectedIdentificationPicture] = useState('')

    async function handleImagePick() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1

            });
            console.log(result)

            if (!result.canceled) {

                setSelectedImage(result.assets[0])
                console.log(result)
            } else {
                alert("You did not select any image")
            }

        } catch (error) {
            console.log(error)

        }

    }
    async function handleIdentityPick() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1

            });
            console.log(result)

            if (!result.canceled) {

                setSelectedIdentificationPicture(result.assets[0])
                console.log(result)
            } else {
                alert("You did not select any image")
            }

        } catch (error) {
            console.log(error)

        }

    }

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');

    const [area, setArea] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [referralPhone, setReferralPhone] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [yearsExperience, setYearsOfExperience] = useState('');

    const [isAccepted, setIsAccepted] = useState(false);


    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchCityQuery, setSearchCityQuery] = useState('')

    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const [isOpenDropdownCity, setIsOpenDropdownCity] = useState(false);


    const filteredCategories = categories?.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];


    const filteredCityData = cityData.filter(city => city.name.toLowerCase().includes(searchCityQuery.toLowerCase()))

    const handleSelectCategory = (title) => {
        setSelectedCategory(title);
        setSearchQuery('');
        setIsOpenDropdown(false);
    };

    const handleSelectCity = (name) => {
        setSelectedCity(name);
        setSearchCityQuery('');
        setIsOpenDropdownCity(false);
    };


    const handleImageDelete = (indexToDelete) => {
        setSelectedImage('');
    }

    const handleClearForm = () => {
        setEmail('');
        setName('')
        setPhone('')
        setMessage('')
        setArea('')
        setEmergencyPhone('')
        setReferralPhone('')
        setSelectedCategory('')
        setSelectedCity('')
        setSelectedIdentificationPicture('')
        setSelectedImage('')
        setIsAccepted(false)
        setGender('')
    }


    return (
        <ScrollView style={styles.scrollview} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.headerText}>Join Now</Text>
            <View style={styles.formContainer}>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Full name</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <Icon
                            name='nepal'
                            width={30}
                            height={20}
                            style={styles.flagIcon}
                        />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            numberOfLines={8}
                        />
                    </View>
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

                <Text style={styles.label}>Headshot/Profile picture</Text>

                <View style={[
                    styles.individualContainer,
                    {
                        borderStyle: selectedImage && selectedImage.length > 0 ? 'solid' : 'dashed',
                        borderWidth: 1.5,
                        borderColor: 'black',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        height: 140,
                        borderRadius: 4,
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        gap: 10
                    }
                ]}>

                    {selectedImage && selectedImage.length > 0 ? (

                        <View
                            key={selectedImage.uri}
                            style={{
                                width: 45,
                                height: '100%',
                                position: 'relative',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}
                        >
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={{ width: '100%', height: '100%', borderRadius: 4 }}
                                resizeMode="cover"
                            />

                            <Pressable
                                onPress={() => handleImageDelete()}
                                style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: 12,
                                    padding: 4,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons name='trash' size={16} color="white" />
                            </Pressable>
                        </View>
                    )
                        : (
                            <Pressable
                                onPress={handleImagePick}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons name='arrow-down-circle-outline' size={32} color="black" />
                                <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>
                            </Pressable>
                        )
                    }
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Email address</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email "
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>



                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Your Experience (Select any 5) </Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdown(!isOpenDropdown)}
                    >
                        <Text style={[styles.triggerText, !selectedCategory && styles.placeholderText]}>
                            {selectedCategory || "Select a service"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdown ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdown && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for services..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={true}
                                />
                                {searchQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredCategories?.length > 0 ? (
                                    filteredCategories?.map((service, index) => (
                                        <TouchableOpacity
                                            key={service.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectCategory(service.title)}
                                        >
                                            <Text style={styles.dropdownItemText}>{service.title}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No services found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Years of Experience</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your years of experience"
                        value={yearsExperience}
                        onChangeText={setYearsOfExperience}
                    />
                </View>


                <Text style={styles.label}>Citizenship/Driving license/NID</Text>

                <View style={[
                    styles.individualContainer,
                    {
                        borderStyle: selectedIdentificationPicture && selectedIdentificationPicture.length > 0 ? 'solid' : 'dashed',
                        borderWidth: 1.5,
                        borderColor: 'black',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        height: 140,
                        borderRadius: 4,
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        gap: 10
                    }
                ]}>

                    {selectedIdentificationPicture && selectedIdentificationPicture.length > 0 ? (

                        <View
                            key={selectedIdentificationPicture.uri}
                            style={{
                                width: 45,
                                height: '100%',
                                position: 'relative',
                                borderRadius: 4,
                                overflow: 'hidden'
                            }}
                        >
                            <Image
                                source={{ uri: selectedIdentificationPicture.uri }}
                                style={{ width: '100%', height: '100%', borderRadius: 4 }}
                                resizeMode="cover"
                            />

                            <Pressable
                                onPress={() => handleImageDelete()}
                                style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: 12,
                                    padding: 4,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons name='trash' size={16} color="white" />
                            </Pressable>
                        </View>
                    )
                        : (
                            <Pressable
                                onPress={handleIdentityPick}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Ionicons name='arrow-down-circle-outline' size={32} color="black" />
                                <Text style={{ marginTop: 4 }}>Drop file/photos here</Text>
                            </Pressable>
                        )
                    }
                </View>


                <View style={styles.individualContainer}>
                    <Text style={styles.label}>City</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownCity(!isOpenDropdownCity)}
                    >
                        <Text style={[styles.triggerText, !selectedCity && styles.placeholderText]}>
                            {selectedCity || "Choose a city"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownCity ? "chevron-up" : "chevron-down"}

                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownCity && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for cities..."
                                    value={searchCityQuery}
                                    onChangeText={setSearchCityQuery}
                                    autoFocus={true}
                                />
                                {searchCityQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchCityQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredCityData?.length > 0 ? (
                                    filteredCityData?.map((city, index) => (
                                        <TouchableOpacity
                                            key={city.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectCity(city.name)}

                                        >
                                            <Text style={styles.dropdownItemText}>{city.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No cities found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Area</Text>
                    {selectedCity ? <TextInput
                        style={styles.textInput}
                        placeholder="Enter your area"
                        value={area}
                        onChangeText={setArea}
                    /> : <TextInput
                        style={styles.textInput}
                        placeholder="Please select a city first"
                        editable={false}
                    />
                    }
                </View>


                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Emergency Contact Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <Icon
                            name='nepal'
                            width={30}
                            height={20}
                            style={styles.flagIcon}
                        />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter the phone number"
                            value={emergencyPhone}
                            onChangeText={setEmergencyPhone}
                            keyboardType="phone-pad"
                            numberOfLines={8}
                        />
                    </View>
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Referral Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                        <Icon
                            name='nepal'
                            width={30}
                            height={20}
                            style={styles.flagIcon}
                        />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Enter the phone number"
                            value={referralPhone}
                            onChangeText={setReferralPhone}
                            keyboardType="phone-pad"
                            numberOfLines={8}
                        />
                    </View>
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Message</Text>

                    <TextInput
                        style={[styles.textInput], {
                            height: 100,
                            borderColor: '#ecdbdb',
                            borderWidth: 1,
                            padding: 8
                        }}
                        multiline={true}
                        autoFocus={true}
                        placeholder="Enter your message"
                        value={message}
                        onChangeText={setMessage}
                    />
                </View>


                {/* Accept Terms  */}
                <View style={styles.checkboxContainer}>
                    <Pressable
                        onPress={() => setIsAccepted(!isAccepted)}
                        style={styles.checkbox}
                    >
                        {isAccepted ? (
                            <Ionicons name="checkbox" size={24} color="#245d5a" />
                        ) : (
                            <Ionicons name="square-outline" size={24} color="#666" />
                        )}
                    </Pressable>
                    <Text style={styles.checkboxLabel}>
                        I accept the{' '}
                        <Text
                            style={styles.hyperlink}
                            onPress={() => router.push('./terms')}
                        >
                            Terms and Conditions
                        </Text>
                    </Text>
                </View>

                {/* Buttons */}
                <View style={styles.bottomContainer}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: '50%',
                        gap: 2,

                    }}

                    >
                        <Ionicons name='refresh' style={{
                            width: "16%",
                            height: 'auto',
                            paddingVertical: 12
                        }} />
                        <Pressable onPress={handleClearForm}>
                            <Text style={[styles.label]}>Clear Form</Text>
                        </Pressable>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: "#245d5a",
                            gap: 2,
                            width: '50%',
                            marginHorizontal: 'auto',
                            borderRadius: 12,
                            height: 44
                        }}
                    >

                        <Text style={[styles.label], {
                            color: '#fff',

                        }}>Submit</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#245d5a'
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 16
    },
    individualContainer: {
        width: '100%',
        gap: 6,
        zIndex: 10,
    },
    label: {
        fontWeight: '500',
        color: '#333'
    },
    textInput: {
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        padding: 10,
        height: 44,
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
        paddingVertical: 0,
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
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        paddingVertical: 0,
    },
    itemsList: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        gap: 10,

    },
    checkbox: {
        justifyContent: 'center',
        alignItems: 'center',
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
    }
});