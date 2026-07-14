import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import ServiceCard from "../../components/ServiceCard";
import ServiceStack from "../../components/ServiceStack";
import { categories, services } from "../../data/servicesList";

export default function Services() {
    return (
        <ScrollView>
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
                </View>
            </View>

            <View style={styles.containerForStack}>
                <Text style={{ fontSize: 20 }}>Top Services</Text>
                {
                    services?.filter((service) => service.label === "Top").slice(0, 2).map((service, key) => {
                        return (
                            <View key={key}>
                                <ServiceStack
                                    description={service.description}
                                    title={service.title}
                                    imageSource={service.url}
                                />
                            </View>
                        )
                    })
                }
            </View>

            <Text style={{ fontSize: 20, margin: 12 }}>Trending Services</Text>

            <View style={styles.containerForFlex}>
                {
                    services?.filter((service) => service.label === "Trending").slice(0, 4).map((service, key) => {
                        return (
                            <View key={key}>
                                <ServiceCard
                                    description={service.description}
                                    title={service.title}
                                    imageSource={service.url}
                                />
                            </View>
                        )
                    })
                }
            </View>

            {
                categories?.map((category, key) => {
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
                                    <Text style={styles.categoryTitle}>
                                        {category.title} 
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.categoryServices}>
                                {
                                    categoryServices?.length > 0 ? (
                                        categoryServices.map((service, serviceKey) => (
                                            <View key={serviceKey} style={styles.serviceItem}>
                                                <ServiceCard
                                                    title={service.title}
                                                    imageSource={service.url}
                                                    description={service.description}
                                                />
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noServices}>No services available in this category</Text>
                                    )
                                }
                            </View>
                        </View>
                    )
                })
            }
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 180,
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
        backgroundColor: 'rgba(7, 5, 5, 0.35)',
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
        marginTop: 50,
    },
    subTitle: {
        color: '#FFFFFF',
        fontWeight: '400',
        fontSize: 20,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        marginTop: 10,
    },
    containerForStack: {
        flex: 1,
        flexDirection: 'column',
        gap: 12,
        marginVertical: 12,
        marginHorizontal: 12,
        padding: 2
    },
    containerForFlex: {
        width: '90%',
        marginHorizontal: 12,
        padding: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'start'
    },
    categoryContainer: {
        marginVertical: 10,
        marginHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryHeader: {
        position: 'relative',
        height: 120,
        width: '100%',
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    categoryTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    categoryServices: {
        padding: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    serviceItem: {
        width: '30.33%', 
        marginBottom: 10,
    },
    noServices: {
        padding: 10,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
    }
});