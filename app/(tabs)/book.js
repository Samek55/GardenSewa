import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-ico-flags';
import { budgetData, categories, cityData, priorityData, shiftsData } from "../../data/servicesList";

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function Book() {

    const [selectedImages, setSelectedImages] = useState('')
    console.log(selectedImages)

    async function handleImagePick() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                allowsEditing: false,
                quality: 1,
                selectionLimit:5
                

            });
            console.log(result)

            if (!result.canceled) {

                setSelectedImages(result.assets)
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
    const [area, setArea] = useState('');
    const [message, setMessage] = useState('');

    const [isAccepted, setIsAccepted] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedShift, setSelectedShift] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedBudget, setSelectedBudget] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchShiftQuery, setSearchShiftQuery] = useState('')
    const [searchCityQuery, setSearchCityQuery] = useState('')
    const [searchPriorityQuery, setSearchPriorityQuery] = useState('')
    const [searchBudgetQuery, setSearchBudgetQuery] = useState('')

    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const [isOpenDropDownShift, setIsOpenDropdownShift] = useState(false);
    const [isOpenDropdownCity, setIsOpenDropdownCity] = useState(false);
    const [isOpenDropdownPriority, setIsOpenDropdownPriority] = useState(false);
    const [isOpenDropdownBudget, setIsOpenDropdownBudget] = useState(false);

    const [isOpenStartCalendar, setIsOpenStartCalendar] = useState(false);
    const [isOpenEndCalendar, setIsOpenEndCalendar] = useState(false);

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const filteredCategories = categories?.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const filteredShiftsData = shiftsData?.filter(shift =>
        shift.name.toLowerCase().includes(searchShiftQuery?.toLowerCase())
    )

    const filteredCityData = cityData.filter(city => city.name.toLowerCase().includes(searchCityQuery.toLowerCase()))

    const filteredPriorityData = priorityData.filter(priority => priority.name.toLowerCase().includes(searchPriorityQuery.toLowerCase()))

    const filteredBudgetData = budgetData.filter(budget => budget.name.toLowerCase().includes(searchPriorityQuery.toLowerCase()))

    console.log(filteredShiftsData)

    const handleSelectCategory = (title) => {
        setSelectedCategory(title);
        setSearchQuery('');
        setIsOpenDropdown(false);
    };

    const handleSelectShift = (name) => {
        setSelectedShift(name);
        setSearchShiftQuery('');
        setIsOpenDropdownShift(false);
    };

    const handleSelectCity = (name) => {
        setSelectedCity(name);
        setSearchCityQuery('');
        setIsOpenDropdownCity(false);
    };

    const handleSelectPriority = (name) => {
        setSelectedPriority(name);
        setSearchPriorityQuery('');
        setIsOpenDropdownPriority(false);
    }

    const handleSelectBudget = (name) => {
        setSelectedBudget(name);
        setSearchBudgetQuery('');
        setIsOpenDropdownBudget(false);
    }
    const handleImageDelete = (indexToDelete) => {
        setSelectedImages((prevImages) =>
            prevImages.filter((_, index) => index !== indexToDelete)
        );
    }

    const handleClearForm = () => {
        setArea('');
        setEndDate('');
        setStartDate('')
        setIsAccepted(false)
        setName('')
        setPhone('')
        setMessage('')
        setSelectedBudget('')
        setSelectedCategory('')
        setSelectedCity('')
        setSelectedImages('')
        setSelectedPriority('')
        setSelectedShift('')

    }

    return (
        <ScrollView style={styles.scrollview} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.headerText}>Book Service</Text>
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
                    <Text style={styles.label}>Select Service</Text>

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
                    <Text style={styles.label}>Choose Date</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenStartCalendar(!isOpenStartCalendar)}
                    >
                        <Text style={[styles.triggerText, !startDate && styles.placeholderText]}>
                            {startDate || "Select Date"}
                        </Text>
                        <Ionicons
                            name="calendar-clear-outline"
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenStartCalendar && (
                        <Calendar
                            onDayPress={day => {
                                setStartDate(day.dateString);
                                setIsOpenStartCalendar(false);
                            }}
                            markedDates={{
                                [startDate]: { selected: true, selectedColor: '#245d5a' }
                            }}
                            theme={{
                                todayTextColor: '#245d5a',
                                arrowColor: '#245d5a',
                            }}
                        />
                    )}
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Service Ending Date</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenEndCalendar(!isOpenEndCalendar)}
                    >
                        <Text style={[styles.triggerText, !endDate && styles.placeholderText]}>
                            {endDate || "Select Date"}
                        </Text>
                        <Ionicons
                            name="calendar-clear-outline"
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenEndCalendar && (
                        <Calendar
                            onDayPress={day => {
                                setEndDate(day.dateString);
                                setIsOpenEndCalendar(false);
                            }}
                            markedDates={{
                                [endDate]: { selected: true, selectedColor: '#245d5a' }
                            }}
                            theme={{
                                todayTextColor: '#245d5a',
                                arrowColor: '#245d5a',
                            }}
                        />
                    )}
                </View>

                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Preferred Time</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownShift(!isOpenDropDownShift)}
                    >
                        <Text style={[styles.triggerText, !selectedShift && styles.placeholderText]}>
                            {selectedShift || "Choose a shift"}
                        </Text>
                        <Ionicons
                            name={isOpenDropDownShift ? "time-outline" : "time-sharp"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropDownShift && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for shifts..."
                                    value={searchShiftQuery}
                                    onChangeText={setSearchShiftQuery}
                                    autoFocus={true}
                                />
                                {searchShiftQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchShiftQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredShiftsData?.length > 0 ? (
                                    filteredShiftsData?.map((shift, index) => (
                                        <TouchableOpacity
                                            key={shift.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectShift(shift.name)}

                                        >
                                            <Text style={styles.dropdownItemText}>{shift.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No shifts found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
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
                    <Text style={styles.label}>Priority</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownPriority(!isOpenDropdownPriority)}
                    >
                        <Text style={[styles.triggerText, !selectedPriority && styles.placeholderText]}>
                            {selectedPriority || "Choose a Priority"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownPriority ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownPriority && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for priorities..."
                                    value={searchPriorityQuery}
                                    onChangeText={setSearchPriorityQuery}
                                    autoFocus={true}
                                />
                                {searchBudgetQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchPriorityQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredPriorityData?.length > 0 ? (
                                    filteredPriorityData?.map((priority, index) => (
                                        <TouchableOpacity
                                            key={priority.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectPriority(priority.name)}

                                        >
                                            <Text style={styles.dropdownItemText}>{priority.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No priority found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>
                <View style={styles.individualContainer}>
                    <Text style={styles.label}>Budget</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        activeOpacity={0.8}
                        onPress={() => setIsOpenDropdownBudget(!isOpenDropdownBudget)}
                    >
                        <Text style={[styles.triggerText, !selectedBudget && styles.placeholderText]}>
                            {selectedBudget || "Choose a Budget"}
                        </Text>
                        <Ionicons
                            name={isOpenDropdownBudget ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isOpenDropdownBudget && (
                        <View style={styles.dropdownContainer}>
                            <View style={styles.searchBarContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for budgets..."
                                    value={searchBudgetQuery}
                                    onChangeText={setSearchBudgetQuery}
                                    autoFocus={true}
                                />
                                {searchBudgetQuery?.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchBudgetQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                                {filteredBudgetData?.length > 0 ? (
                                    filteredBudgetData?.map((budget, index) => (
                                        <TouchableOpacity
                                            key={budget.id || index}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectBudget(budget.name)}

                                        >
                                            <Text style={styles.dropdownItemText}>{budget.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResultsText}>No budget found</Text>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    )}
                </View>
                <View style={styles.individualContainer}>
                </View>
                <Text style={styles.label}>Upload Photos (up to 5)</Text>

                <View style={[
                    styles.individualContainer,
                    {
                        borderStyle: selectedImages && selectedImages.length > 0 ? 'solid' : 'dashed',
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

                    {selectedImages && selectedImages.length > 0 ? (
                        selectedImages.map((selectedImage, index) => (
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
                                    onPress={() => handleImageDelete(index)}
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
    bottomContainer: {
        flex: 1,
        flexDirection: 'row'
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
    // bottomContainer: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     justifyContent: 'space-between',
    //     marginTop: 10,
    // }
});