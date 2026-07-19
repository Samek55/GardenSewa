import { Image, StyleSheet, Text, View } from 'react-native';

const ServiceCard = ({ imageSource, title, description, cardWidth }) => {
    return (
        <View style={[styles.container, cardWidth ? { width: cardWidth } : null]}>
            <Image
                source={{ uri: imageSource }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
                {description ? (
                    <Text style={styles.description} numberOfLines={1}>
                        {description}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 4,
    },
    image: {
        width: '100%',
        height: 110,
    },
    textContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        gap: 2,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    description: {
        fontSize: 12,
        color: '#64748B',
    },
});

export default ServiceCard;