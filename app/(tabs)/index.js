import { Link } from 'expo-router';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";

import { NP } from 'react-native-country-flag-icons';

import { useState } from 'react';
import ServiceCard from "../../components/ServiceCard";
import { services } from "../../data/servicesList";

const { width } = Dimensions.get('window');
const TOP_CARD_WIDTH = (width - 36 - 2 - 24 - 10) / 2.6;



export default function Index() {

    const [phone, setPhone] = useState('')
    const filteredServicesTop = services.filter(service => service.label === 'Top');

    return (
        <View style={styles.screenContainer}>

            <View style={styles.heroContainer}>
                <Image
                    source={{
                        uri: 'https://www.gardensewa.com/home/slider/1.jpg'
                    }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <Text style={styles.title}>Professional{"\n"}Gardening Service</Text>
                    {/* <Text style={styles.subTitle}>SuperFast gardening Service at your Home.</Text> */}

                    <View style={styles.inputContainer}>
                        <View style={styles.iconWrapper}>
                            <NP width={24} height={24} />
                        </View>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                        <Pressable
                            style={styles.helpButton}
                            onPress={() => {
                                Alert.alert('Confirm Help Request', `Send a help request from +977 ${phone}?Our team will contact you shortly`, [
                                    {
                                        text: 'CANCEL',
                                        onPress: () => console.log('Cancel Pressed'),
                                        style: 'cancel',
                                    },
                                    { text: 'CONFIRM', onPress: () => console.log('OK Pressed') },
                                ])
                            }}
                        >
                            <Text style={styles.helpButtonText}>Help</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={styles.popularCardContainer}>
                <Image
                    source={require('../../assets/images/lawn.jpg')}
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
                    <Text style={styles.cardTitle}>Lawn Maintenance</Text>
                    <Text style={styles.cardSubTitle}>Professional lawn maintenance service</Text>
                </View>

            </View>

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
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filteredServicesTop}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.horizontalListPadding}
                    ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
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
        fontSize: width * 0.08,
        lineHeight: width * 0.095,
    },
    subTitle: {
        color: '#E0E0E0',
        fontWeight: '400',
        fontSize: 14,
        marginTop: 6,
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
        paddingHorizontal: 14,
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
        justifyContent: 'flex-end',
        gap: 4,
        padding: 24

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
        fontSize: 16,
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
        paddingHorizontal: 8,
        marginBottom: 8,
    },
});