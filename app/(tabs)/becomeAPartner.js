import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-ico-flags';
import { categories as businessType, cityData, partnershipData, serviceOfferedData, sourceData } from "../../data/servicesList";

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function Book() {

    const [selectedCompanyImages, setSelectedCompanyImages] = useState('');
    const [selectedCertificates, setSelectedCertificates] = useState('');
    const [isAccepted, setIsAccepted] = useState(false);

    async function handleImagePick() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                allowsEditing: false,
                quality: 1
            });
            console.log(result);

            if (!result.canceled) {
                setSelectedCompanyImages(result.assets);
                console.log(result);
            } else {
                alert("You did not select any image");
            }
        } catch (error) {
            console.log(error);
        }
    }

    async function handleImageCertificatePick() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                allowsEditing: false,
                quality: 1
            });
            console.log(result);

            if (!result.canceled) {
                setSelectedCertificates(result.assets);
                console.log(result);
            } else {
                alert("You did not select any image");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [organization, setOrganization] = useState('');
    const [noOfEmployees, setNoOfEmployees] = useState('');

    const [selectedBusinessType, setSelectedBusinessType] = useState('');
    const [selectedServiceType, setSelectedServiceType] = useState('');
    const [selectedPartnership, setSelectedPartnership] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [selectedArea, setSelectedArea] = useState('');

    const [searchBusinessTypeQuery, setSearchBusinessTypeQuery] = useState('');
    const [searchAreaQuery, setSearchAreaQuery] = useState('');
    const [searchServiceOfferedQuery, setSearchServiceOfferedQuery] = useState('');
    const [searchSourceQuery, setSearchSourceQuery] = useState('');
    const [searchPartnershipQuery, setSearchPartnershipQuery] = useState('');

    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const [isOpenDropdownArea, setIsOpenDropdownArea] = useState(false);
    const [isOpenDropdownSource, setIsOpenDropdownSource] = useState(false);
    const [isOpenDropdownService, setIsOpenDropdownService] = useState(false);
    const [isOpenDropdownPartnership, setIsOpenDropdownPartnership] = useState(false);

    const filteredBusinessType = businessType?.filter(service =>
        service.title.toLowerCase().includes(searchBusinessTypeQuery.toLowerCase())
    ) || [];
    const filteredtSourceData = sourceData?.filter(service =>
        service.title.toLowerCase().includes(searchSourceQuery.toLowerCase())
    ) || [];

    const filteredPartnershipData = partnershipData?.filter(service =>
        service.title.toLowerCase().includes(searchPartnershipQuery.toLowerCase())
    ) || [];

    const filteredServiceType = serviceOfferedData?.filter(service =>
        service.title.toLowerCase().includes(searchServiceOfferedQuery.toLowerCase())
    ) || [];

    const filteredAreaQuery = cityData.filter(city => city.name.toLowerCase().includes(searchAreaQuery.toLowerCase()));

    const handleSelectBusinessType = (title) => {
        setSelectedBusinessType(title);
        setSearchBusinessTypeQuery('');
        setIsOpenDropdown(false);
    };
    const handleSelectSource = (title) => {
        setSelectedSource(title);
        setSearchSourceQuery('');
        setIsOpenDropdownSource(false);
    };
    const handleSelectServiceType = (title) => {
        setSelectedServiceType(title);
        setSearchServiceOfferedQuery('');
        setIsOpenDropdownService(false);
    };

    const handleSelectPartnership = (title) => {
        setSelectedPartnership(title);
        setSearchPartnershipQuery('');
        setIsOpenDropdownPartnership(false);
    };

    const handleSelectArea = (name) => {
        setSelectedArea(name);
        setSearchAreaQuery('');
        setIsOpenDropdownArea(false);
    };

    const handleImageDelete = (indexToDelete, source) => {
        if (source === "company") {
            setSelectedCompanyImages((prevImages) =>
                prevImages.filter((_, index) => index !== indexToDelete)
            );
        }
        if (source === "certificate") {
            setSelectedCertificates((prevImages) =>
                prevImages.filter((_, index) => index !== indexToDelete)
            );
        }else{
            console.log("no matching image criteria")
        }

    };

    const handleClearForm = () => {
        setEmail('');
        setIsAccepted('');
        setName('')
        setNoOfEmployees('')
        setPhone('')
        setMessage('')
        setOrganization('')
        setSelectedArea('')
        setSelectedBusinessType('')
        setSelectedCertificates('')
        setSelectedCompanyImages('')
        setSelectedPartnership('')
        setSelectedServiceType('')
        setSelectedSource('')

    }

    return (
        <ScrollView style={styles.scrollview} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.headerText}>Become a Partner</Text>
            <View style={styles.formContainer}>
                {/* Name  */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Full name</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                {/* Organization */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Name of Organization</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your Name of your Organization"
                        value={organization}
                        onChangeText={setOrganization}
                    />
                </View>
                {/* Phone Number */}
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
                        />
                    </View>
                </View>
                {/* Email */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>eMail</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your eMail Address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                {/* Company Photos */}
                <Text style={styles.label}>Company Photos</Text>

                <View style={[
                    styles.individualContainer,
                    {
                        borderStyle: selectedCompanyImages && selectedCompanyImages.length > 0 ? 'solid' : 'dashed',
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

                    {selectedCompanyImages && selectedCompanyImages.length > 0 ? (
                        selectedCompanyImages.map((selectedImage, index) => (
                            <View
                                key={index}
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
                                    onPress={() => handleImageDelete(index, "company")}
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
                        ))
                    ) : (
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
                    )}
                </View>

                {/* Area */}

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Area</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownArea(!isOpenDropdownArea)}
                    >
                        <Text style={[styles.triggerText, !selectedArea && styles.placeholderText]}>
                            {selectedArea || "Choose your area"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownArea ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownArea && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for cities..."
                                    value={searchAreaQuery}
                                    onChangeText={setSearchAreaQuery}
                                    autoFocus={true}
                                />
                                {searchAreaQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchAreaQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredAreaQuery?.length > 0 ? (
                                    filteredAreaQuery?.map((city, index) => (
                                        <TouchableOpacity
                                            key={city.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectArea(city.name)}
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

                {/* Number of employees */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Number of employees</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter the number of employees"
                        value={noOfEmployees}
                        onChangeText={setNoOfEmployees}
                    />
                </View>

                {/* Business Type */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Business Type</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdown(!isOpenDropdown)}
                    >
                        <Text style={[styles.triggerText, !selectedBusinessType && styles.placeholderText]}>
                            {selectedBusinessType || "Select a business type"}
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
                                    value={searchBusinessTypeQuery}
                                    onChangeText={setSearchBusinessTypeQuery}
                                    autoFocus={true}
                                />
                                {searchBusinessTypeQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchBusinessTypeQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredBusinessType?.length > 0 ? (
                                    filteredBusinessType?.map((service, index) => (
                                        <TouchableOpacity
                                            key={service.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectBusinessType(service.title)}
                                        >
                                            <Text style={styles.dropdownItemText}>{service.title}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No business type found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Services Offered */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Services Offered</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownService(!isOpenDropdownService)}
                    >
                        <Text style={[styles.triggerText, !selectedServiceType && styles.placeholderText]}>
                            {selectedServiceType || "Select the services you offer"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownService ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownService && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search the services you offer"
                                    value={searchServiceOfferedQuery}
                                    onChangeText={setSearchServiceOfferedQuery}
                                    autoFocus={true}
                                />
                                {searchServiceOfferedQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchServiceOfferedQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredServiceType?.length > 0 ? (
                                    filteredServiceType?.map((service, index) => (
                                        <TouchableOpacity
                                            key={service.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectServiceType(service.title)}
                                        >
                                            <Text style={styles.dropdownItemText}>{service.title}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No service found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Partnership Interest */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Partnership Interest</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownPartnership(!isOpenDropdownPartnership)}
                    >
                        <Text style={[styles.triggerText, !selectedPartnership && styles.placeholderText]}>
                            {selectedPartnership || "Select the partnership interest"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownPartnership ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownPartnership && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search Partnership Interest"
                                    value={searchPartnershipQuery}
                                    onChangeText={setSearchPartnershipQuery}
                                    autoFocus={true}
                                />
                                {searchPartnershipQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchPartnershipQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredPartnershipData?.length > 0 ? (
                                    filteredPartnershipData?.map((service, index) => (
                                        <TouchableOpacity
                                            key={service.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectPartnership(service.title)}
                                        >
                                            <Text style={styles.dropdownItemText}>{service.title}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No partnership interest found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Company Registration Certificate */}

                <Text style={styles.label}>Company Registration Certificate</Text>

                <View style={[
                    styles.individualContainer,
                    {
                        borderStyle: selectedCertificates && selectedCertificates.length > 0 ? 'solid' : 'dashed',
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

                    {selectedCertificates && selectedCertificates.length > 0 ? (
                        selectedCertificates.map((selectedImage, index) => (
                            <View
                                key={index}
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
                                    onPress={() => handleImageDelete(index, "certificate")}
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
                        ))
                    ) : (
                        <Pressable
                            onPress={handleImageCertificatePick}
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
                    )}
                </View>

                {/* How did you hear about us? */}
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>How did you hear about us?</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownSource(!isOpenDropdownSource)}
                    >
                        <Text style={[styles.triggerText, !selectedSource && styles.placeholderText]}>
                            {selectedSource || "Select the source"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownSource ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownSource && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search Partnership Interest"
                                    value={searchSourceQuery}
                                    onChangeText={setSearchSourceQuery}
                                    autoFocus={true}
                                />
                                {searchSourceQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchSourceQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredtSourceData?.length > 0 ? (
                                    filteredtSourceData?.map((source, index) => (
                                        <TouchableOpacity
                                            key={source.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectSource(source.title)}
                                        >
                                            <Text style={styles.dropdownItemText}>{source.title}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No sources found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Message */}
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