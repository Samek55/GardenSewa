import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { services } from '../../../data/servicesList';

const ServiceIndividual = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const service = services?.find((s) => s.id === Number(id));

    if (!service) {
        return (
            <View style={styles.notFound}>
                <Text>Service not found</Text>
            </View>
        );
    }

    const relatedServices = services?.filter(
        (item) => item.category === service.category && item.id !== service.id
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Image
                source={service.image || service.url}
                style={styles.image}
                resizeMode="cover"
            />
            <Text style={styles.title}>{service.title}</Text>

            <Text style={styles.description}>{service.description}</Text>

            <View style={styles.buttonContainer}>
                <Pressable
                    style={styles.button} onPress={() => router.push({
                        pathname: '/book',
                        params: { serviceName: service.title }
                    })} 
                >
                    <Text style={styles.buttonText}>Book This Service</Text>
                </Pressable>
            </View>

            {relatedServices && relatedServices.length > 0 && (
                <View style={styles.relatedContainer}>
                    <Text style={styles.sectionHeader}>Related Services</Text>

                    <View style={styles.gridRow}>
                        {relatedServices.slice(0, 2).map((item) => (
                            <Pressable
                                key={item.id}
                                style={styles.relatedCard}
                                onPress={() => router.push(`/services/${item.id}`)}
                            >
                                <Image
                                    source={item.image || item.url}
                                    style={styles.relatedImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.relatedTextContainer}>
                                    <Text style={styles.relatedTitle} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.relatedDesc} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAF9',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    buttonContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
    },
    categoryBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#15803D',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#475569',
        marginBottom: 16,
    },

    button: {
        width: '50%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#245d5a',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginBottom: 28,

    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    relatedContainer: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    relatedCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    relatedImage: {
        width: '100%',
        height: 90,
    },
    relatedTextContainer: {
        padding: 10,
    },
    relatedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    relatedDesc: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 15,
    },
});

export default ServiceIndividual;