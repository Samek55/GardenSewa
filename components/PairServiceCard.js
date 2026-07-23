import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const PairServiceCard = ({ id, imageSource, title, description, cardWidth }) => {

    const router = useRouter()
    console.log()

    return (
        <Pressable
            style={[styles.container, cardWidth ? { width: cardWidth } : null]}
            onPress={()=>router.push(`./services/${id}`)}
        >
            <Image
                source={imageSource}
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
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 4,
    },
    image: {
        width: '100%',
        height: 100,
        aspectRatio:16/9
    },
    textContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        gap: 2,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    description: {
        fontSize: 12,
        color: '#64748B',
    },
});

export default PairServiceCard;