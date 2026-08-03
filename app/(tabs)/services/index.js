import { useRouter } from 'expo-router';
import {
    Dimensions, Image,
    Pressable,
    ScrollView, StyleSheet, Text, View
} from "react-native";
import PairServiceCard from "../../../components/PairServiceCard";
import ServiceStack from "../../../components/ServiceStack";
import { services } from "../../../data/servicesList";

const { width } = Dimensions.get('window');

const TRENDING_CARD_WIDTH = (width - 36 - 12) / 2;
const PAIR_CARD_WIDTH = (width - 36 - 12) / 2;
const FULL_WIDTH_CARD = width - 36;

export default function Services() {

    const router = useRouter()

    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
            <View style={styles.heroContainer}>
                <Image
                    source={require('@/assets/images/garden2.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <Text style={styles.title}>SuperFast Services</Text>
                    <Text style={styles.subTitle}>Professional gardening services in Nepal</Text>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Top Services</Text>
                <View style={styles.stackList}>
                    {services?.filter((service) => service.label === "Top").slice(0, 2).map((service, key) => (
                        <ServiceStack
                            id={String(service.id)}
                            key={key}
                            description={service.description}
                            title={service.title}
                            imageSource={service.url}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Trending Services</Text>
                <View style={styles.gridContainer}>
                    {services?.filter((service) => service.label === "Trending").slice(0, 4).map((service, key) => (
                        <PairServiceCard
                            id={String(service.id)}
                            key={key}
                            cardWidth={TRENDING_CARD_WIDTH}
                            description={service.description}
                            title={service.title}
                            imageSource={service.url}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>All Services</Text>
                <View style={styles.allServicesGrid}>
                    {services?.map((service, index) => {
                        const isFullWidthPosition = index % 7 === 0;

                        if (isFullWidthPosition) {
                            return (
                                <Pressable
                                    id={String(service.id)}
                                    key={service.id || index}
                                    style={styles.fullWidthCardContainer}
                                    onPress={() => router.push(`/services/${service.id}`)}
                                >
                                    <Image
                                        source={service.url}
                                        style={styles.fullWidthCardImage}
                                    />
                                    <View style={styles.fullWidthCardOverlay}>
                                        <Text style={styles.fullWidthCardDesc} numberOfLines={1} >
                                            GardenSewa
                                        </Text>
                                        <Text style={styles.fullWidthCardTitle}>{service.title}</Text>

                                    </View>
                                </Pressable>
                            );
                        }

                        return (
                            <PairServiceCard
                                key={service.id || index}
                                id={service.id}
                                cardWidth={PAIR_CARD_WIDTH}
                                title={service.title}
                                imageSource={service.url}
                                description={service.description}
                            />
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    heroContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        paddingHorizontal: 18,
        paddingBottom: 28,
        gap: 4,
    },
    title: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: width * 0.08,
    },
    subTitle: {
        color: '#E2E8F0',
        fontWeight: '500',
        fontSize: 16,
        marginTop: 4,
    },
    sectionContainer: {
        marginTop: 20,
        paddingHorizontal: 18,
        marginBottom: 20,
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E3A3A',
        marginBottom: 12,
    },
    stackList: {
        gap: 8,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'flex-start',
    },
    allServicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    fullWidthCardContainer: {
        width: FULL_WIDTH_CARD,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        marginVertical: 6,
    },
    fullWidthCardImage: {
        width: '100%',
        height: '100%',
    },
    fullWidthCardOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    fullWidthCardTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    fullWidthCardDesc: {
        color: '#E2E8F0',
        fontSize: 13,
        lineHeight: 18,
    },
});