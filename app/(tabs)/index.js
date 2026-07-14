import { Link } from 'expo-router';
import { Button, FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from 'react-native-ico-flags';
import ServiceCard from "../../components/ServiceCard";
import { services } from "../../data/servicesList";




export default function Index() {

    const filteredServicesTop = services.filter(service => service.label === 'Top');

    console.log(filteredServicesTop)



    return (

        <>
            <View style={styles.container}>

                <Image
                    source={require('@/assets/images/garden2.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />

                <View style={styles.overlay}>
                    <Text style={styles.title}>
                        Explore Gardening Services
                    </Text>
                    <Text style={styles.subTitle}>
                        Superfast service at your home
                    </Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.iconWrapper}>
                            <Icon name="nepal" width={30} height={30} />
                        </View>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                        <View style={styles.buttonWrapper}>
                            <Button title="Help" color="#047754" />
                        </View>
                    </View>
                </View>
            </View>

            <View style={[styles.container, { marginTop: 12, marginHorizontal: 12, paddingHorizontal: 8, height: '30%', width: 'auto', overflow: 'hidden', borderRadius: 18 }]}>
                <Image
                    source={require('@/assets/images/garden1.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />

                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>Most popular</Text>
                </View>

                <View style={styles.cardOverlay}>
                    <Text style={styles.cardTitle}>
                        Lawn Care, Planting and Garden Maintenance
                    </Text>
                </View>
            </View>


            <View style={{ height: 220, marginHorizontal: 12 }}>
                <View style={{
                    height: 20,
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginHorizontal: 12,
                }}>
                    <Text>Top Services</Text>
                    <Link href={'/services'}>See all</Link>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={filteredServicesTop}
                    renderItem={({ item, index }) => (
                        <ServiceCard
                            key={index}
                            title={item.title}
                            imageSource={item.url}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                    }}
                    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                />
            </View>

        </>

    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '40%',
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
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 28,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        marginTop: 20,
    },
    subTitle: {
        color: '#FFFFFF',
        fontWeight: '400',
        fontSize: 20,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 4,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        height: 56,
    },
    iconWrapper: {
        paddingHorizontal: 12,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        height: 36,
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1A1A1A',
        paddingHorizontal: 12,
        fontWeight: '500',
    },
    buttonWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 4,
    },
    // New styles for the card
    tagContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: '#047754',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tagText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    }
});