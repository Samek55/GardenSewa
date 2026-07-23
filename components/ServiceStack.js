import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, } from 'react-native';

const ServiceStack = ({ id, imageSource, description, title }) => {
    const router = useRouter()

    return (
        <Pressable
            style={styles.container}
            onPress={()=>router.push(`./services/${id}`)
            }
        >
            <Pressable style={styles.imageContainer}>
                <Image
                    source={imageSource}
                    style={styles.image}
                    resizeMode="cover"
                />
            </Pressable>
            <View style={styles.textContainer}>
                <Text style={styles.titleText} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={styles.descriptionText} numberOfLines={2}>
                    {description}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 12,
        marginVertical: 4,
        gap: 16,
    },
    imageContainer: {
        width: 140,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    descriptionText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});

export default ServiceStack;