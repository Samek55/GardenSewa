import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PopUpAd = ({ onClose }) => {
    const [countdown, setCountdown] = useState(10);
    const [autoCloseSeconds, setAutoCloseSeconds] = useState(5);
    const isClosing = useRef(false);
    const mounted = useRef(true);
    const autoCloseStarted = useRef(false);

    // Initial 10s countdown
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // When countdown finishes, start the 5s auto‑close timer (only once)
    useEffect(() => {
        if (countdown === 0 && !autoCloseStarted.current && mounted.current) {
            autoCloseStarted.current = true;
            const timer = setInterval(() => {
                setAutoCloseSeconds((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    // When autoCloseSeconds reaches 0, close the modal
    useEffect(() => {
        if (autoCloseSeconds === 0 && mounted.current && !isClosing.current) {
            isClosing.current = true;
            onClose?.();
        }
    }, [autoCloseSeconds, onClose]);

    // Cleanup mounted flag
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const showCloseButton = countdown === 0;

    return (
        <View style={styles.container}>
            <View style={styles.imageWrapper}>
                <Image
                    source={require('../assets/images/services/15.jpg')}
                    style={styles.adImage}
                    resizeMode="cover"
                />

                {showCloseButton ? (
                    <TouchableOpacity
                        style={styles.closeBadge}
                        onPress={() => {
                            if (!isClosing.current) {
                                isClosing.current = true;
                                onClose?.();
                            }
                        }}
                    >
                        <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{countdown}s</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title}>Flat 20% discount off Landscape Lighting</Text>
            <Text style={styles.description}>
                Book a service for landscape lighting before the flash price disappears, same-day slots across Kathmandu, Lalitpur & Bhaktapur.
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    if (isClosing.current) return;
                    isClosing.current = true;
                    onClose?.();
                    router.push(`/services/${19}`);
                }}
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
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: 1 / 1,
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
        right: 8,
        backgroundColor: 'rgba(34, 87, 84, 0.9)',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        width: '60%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});