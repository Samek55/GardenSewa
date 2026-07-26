import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PopUpAd = () => {
    const [seconds, setSeconds] = useState(10);

    useEffect(() => {
        if (seconds <= 0) return;

        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds]);

    return (
        <View style={styles.container}>
            <View style={styles.imageWrapper}>
                <Image 
                    source={require('../assets/images/15.jpg')} 
                    style={styles.adImage}
                    resizeMode="cover" 
                />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {seconds > 0 ? `${seconds}s` : 'Offer Ending!'}
                    </Text>
                </View>
            </View>

            <Text style={styles.title}>Flat 20% discount off Landscape Lighting</Text>
            <Text style={styles.description}>
                Book a service for landscape lighting before the flash price disappears, same-day slots across Kathmandu, Lalitpur & Bhaktapur.
            </Text>

            <TouchableOpacity 
                style={styles.button}
                onPress={() => router.push(`/services/${19}`)}
            >
                <Text style={styles.buttonText}>View More</Text>
            </TouchableOpacity>
        </View>
    );
};

export default PopUpAd;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 8,
    },
    imageWrapper: {
        width: '100%',
        height: 300, 
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 12,
    },
    adImage: {
        width: '100%',
        height: '100%',
    },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(34, 87, 84, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 6,
    },
    description: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#245d5a',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});