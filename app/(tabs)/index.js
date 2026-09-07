import PopUpAd from '@/components/PopUpAd';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    InteractionManager,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { NP } from 'react-native-country-flag-icons';

import { sendOtp } from '../../api/PostApiOtp';
import ServiceCard from "../../components/ServiceCard";
import { services } from "../../data/servicesList";

// Client-side spam guard only, matching HomeSewa's NumberBar.tsx — the real
// abuse protection is send-otp's own per-phone daily cap/cooldown server-side;
// this just avoids bothering the same device repeatedly.
const LAST_HELP_REQUEST_KEY = 'lastHelpRequestAt';
const HELP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const { width } = Dimensions.get('window');
const TOP_CARD_WIDTH = (width - 36 - 2 - 24 - 10) / 2.6;

export default function Index() {
    const [isAdVisible, setIsAdVisible] = useState(false);
    const [phone, setPhone] = useState('');
    const [activeTopIndex, setActiveTopIndex] = useState(0);

    const flatListRef = useRef(null);
    const intervalRef = useRef(null);

    const filteredServicesTop = services.filter(service => service.label === 'Top');

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAdVisible(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (filteredServicesTop.length === 0) return;

        const startAutoScroll = () => {
            intervalRef.current = setInterval(() => {
                setActiveTopIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % filteredServicesTop.length;
                    flatListRef.current?.scrollToIndex({
                        index: nextIndex,
                        animated: true,
                    });
                    return nextIndex;
                });
            }, 2000);
        };

        InteractionManager.runAfterInteractions(() => {
            startAutoScroll();
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [filteredServicesTop.length]);

    const formattedPhoneValue = phone.length === 10
        ? `${phone.slice(0, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 10)}`
        : phone;

    // Was previously wired to onWhatsappOpen() — tapping Confirm just opened
    // WhatsApp instead of actually submitting anything, so no help request
    // this widget ever "sent" was real. Now it actually sends an OTP and
    // routes to phoneVerification, which submits the request once the code
    // checks out (see submit-helpbox).
    const handleHelpRequest = async () => {
        if (phone.length !== 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
            return;
        }

        const lastRequestRaw = await AsyncStorage.getItem(LAST_HELP_REQUEST_KEY);
        const lastRequestAt = lastRequestRaw ? Number(lastRequestRaw) : 0;
        const elapsed = Date.now() - lastRequestAt;
        if (elapsed < HELP_COOLDOWN_MS) {
            const hoursLeft = Math.ceil((HELP_COOLDOWN_MS - elapsed) / (60 * 60 * 1000));
            Alert.alert('Please Wait', `You've already sent a help request. Please try again in ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}.`);
            return;
        }

        Alert.alert(
            'Confirm Help Request',
            `Send a help request from +977 ${phone}? \nOur team will contact you shortly`,
            [
                { text: 'CANCEL', style: 'cancel' },
                {
                    text: 'CONFIRM',
                    onPress: async () => {
                        try {
                            const result = await sendOtp(phone, 'helpbox');
                            if (!result.success) {
                                Alert.alert('Could Not Send Code', result.message || 'Please try again.');
                                return;
                            }
                            await AsyncStorage.setItem(LAST_HELP_REQUEST_KEY, String(Date.now()));
                            router.push({
                                pathname: '/phoneVerification',
                                params: { phone, requestType: 'Help Request', otpPurpose: 'helpbox' },
                            });
                        } catch (error) {
                            Alert.alert('Could Not Send Code', error.message || 'Something went wrong. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.screenContainer}>

            <View style={styles.heroContainer}>
                <Image
                    source={require('../../assets/images/home/hero.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <Text style={styles.title}>Professional{"\n"}Gardening Service</Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.iconWrapper}>
                            <NP width={24} height={24} />
                        </View>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                            value={formattedPhoneValue}
                            maxLength={12}
                            onChangeText={(text) => {
                                const numericOnly = text.replace(/[^0-9]/g, '');
                                setPhone(numericOnly);
                            }}
                        />
                        <Pressable
                            style={styles.helpButton}
                            onPress={handleHelpRequest}
                        >
                            <Text style={styles.helpButtonText}>Help</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <Pressable style={styles.popularCardContainer} onPress={() => router.replace(`/services/${5}`)}>
                <Image
                    source={require('../../assets/images/services/9.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <View style={styles.ratingOverlay}>
                    <Text style={styles.ratingTitle}>4.6 Rating</Text>
                    <Text style={styles.ratingTitle}>365 Bookings</Text>
                </View>
                <View style={styles.cardOverlay}>
                    <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>Most Popular</Text>
                    </View>
                    <Text style={styles.cardTitle}>Lawn Care</Text>
                    <Text style={styles.cardSubTitle}>Professional lawn care service</Text>
                </View>
            </Pressable>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Services</Text>
                <Link href={'/services'} asChild>
                    <Pressable>
                        <Text style={styles.seeAllText}>See All</Text>
                    </Pressable>
                </Link>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    ref={flatListRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filteredServicesTop}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.horizontalListPadding}
                    ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                    getItemLayout={(data, index) => ({
                        length: TOP_CARD_WIDTH + 14,
                        offset: (TOP_CARD_WIDTH + 14) * index,
                        index,
                    })}
                    renderItem={({ item }) => (
                        <ServiceCard
                            id={item.id}
                            title={item.title}
                            imageSource={item.url}
                            cardWidth={TOP_CARD_WIDTH}
                        />
                    )}
                />
            </View>

            {/* PopUp Ad Modal */}
            <Modal
                visible={isAdVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsAdVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.adContainer}>
                        <PopUpAd onClose={() => setIsAdVisible(false)} />
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    heroContainer: {
        width: '100%',
        aspectRatio: 16 / 12,
        position: 'relative',
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    title: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: width * 0.07,
        lineHeight: width * 0.095,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        height: 48,
        width: '100%',
    },
    iconWrapper: {
        paddingRight: 8,
        paddingLeft: 12,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        height: '60%',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 12,
        color: '#1A1A1A',
        paddingHorizontal: 12,
        fontWeight: '400',
    },
    helpButton: {
        backgroundColor: '#225754',
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    helpButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    popularCardContainer: {
        flex: 2,
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 160,
    },
    cardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.38)',
        justifyContent: 'flex-end',
        padding: 16,
    },
    ratingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.38)',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    tagContainer: {
        alignSelf: 'flex-start',
        backgroundColor: '#225754',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 6,
    },
    tagText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 20,
    },
    ratingTitle: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cardSubTitle: {
        color: '#F0F0F0',
        fontSize: 12,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    seeAllText: {
        fontSize: 14,
        color: '#225754',
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    horizontalListPadding: {
        paddingHorizontal: 0,
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    adContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 24,
        width: '90%',
        position: 'relative',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    }
});