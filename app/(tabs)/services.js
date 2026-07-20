import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import ServiceCard from "../../components/ServiceCard";
import ServiceStack from "../../components/ServiceStack";
import { categories, services } from "../../data/servicesList";

const { width } = Dimensions.get('window');

const TRENDING_CARD_WIDTH = (width - 36 - 12) / 2;

const CATEGORY_CARD_WIDTH = (width - 36 - 2 - 24 - 10) / 2;

export default function Services() {
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
                    <Text style={styles.subTitle}>Express Gardening Service</Text>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>Top Services</Text>
                <View style={styles.stackList}>
                    {services?.filter((service) => service.label === "Top").slice(0, 2).map((service, key) => (
                        <ServiceStack
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
                        <ServiceCard
                            key={key}
                            cardWidth={TRENDING_CARD_WIDTH}
                            description={service.description}
                            title={service.title}
                            imageSource={service.url}
                        />
                    ))}
                </View>
            </View>

            {categories?.map((category, key) => {
                const categoryServices = services?.filter((service) =>
                    service.category === category.title
                );

                return (
                    <View key={key} style={styles.categoryContainer}>
                        <View style={styles.categoryHeader}>
                            <Image
                                source={{ uri: category.url }}
                                style={styles.categoryImage}
                            />
                            <View style={styles.categoryOverlay}>
                                <Text style={styles.categoryTitle}>{category.title}</Text>
                            </View>
                        </View>

                        <View style={styles.categoryGridContainer}>
                            {categoryServices?.length > 0 ? (
                                categoryServices.map((service, serviceKey) => (
                                    <ServiceCard
                                        key={serviceKey}
                                        cardWidth={CATEGORY_CARD_WIDTH}
                                        title={service.title}
                                        imageSource={service.url}
                                        description={service.description}
                                    />
                                ))
                            ) : (
                                <Text style={styles.noServices}>No services available in this category</Text>
                            )}
                        </View>
                    </View>
                );
            })}
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
        gap: 4
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
    categoryContainer: {
        marginTop: 24,
        marginHorizontal: 18,
        // borderRadius: 24,
        // overflow: 'hidden',
        // borderWidth: 1,
        // borderColor: '#E2E8F0',
        marginBottom: 12,
        // backgroundColor:'red'
    },
    categoryHeader: {
        position: 'relative',
        height: 160,
        width: '100%',
        padding: 8
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24
    },
    categoryOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 24,
        padding: 8
    },
    categoryTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    categoryGridContainer: {
        padding: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    noServices: {
        paddingVertical: 16,
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
    }
});