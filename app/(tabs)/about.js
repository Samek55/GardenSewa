import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function About() {
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Image
                source={require('../../assets/images/about/garden4.jpg')}
                style={styles.bannerImage}
                resizeMode="cover"
            />

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About Us</Text>
                <Text style={styles.bodyText}>
                    Garden Sewa is a technology-driven home service marketplace designed to connect customers with nearby professionals through real-time location-based marketing.
                </Text>
                <Text style={styles.bodyText}>
                    The platform aims to simplify the process of finding trusted service providers while helping skilled professionals generate business opportunities within their local communities.
                </Text>
                <Text style={styles.bodyText}>
                    With increasing urbanization and growing demand for on-demand services, customers often struggle to find reliable professionals quickly, while service providers face challenges in acquiring quality leads.
                </Text>
                <Text style={styles.bodyText}>
                    Garden Sewa bridges this gap by enabling instant service requests, AI-powered matching, and real-time notifications.
                </Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.headerRow}>
                    <View style={[styles.iconBadge, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="disc-outline" size={24} color="#2e7d32" />
                    </View>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                </View>
                <Text style={styles.cardBodyText}>
                    To reconnect people with nature one plant, one garden, one moment at a time. We provide high-quality plants, gardening resources, and expert support to every corner of Nepal.
                </Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.headerRow}>
                    <View style={[styles.iconBadge, { backgroundColor: '#fbe9e7' }]}>
                        <Ionicons name="heart-outline" size={24} color="#d84315" />
                    </View>
                    <Text style={styles.cardTitle}>Our Motive</Text>
                </View>
                <Text style={styles.cardBodyText}>
                    We aim to be the go-to place for all gardening needs, offering easy access to plants and expert advice for every gardener and farmer.
                </Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.headerRow}>
                    <View style={[styles.iconBadge, { backgroundColor: '#e0f2f1' }]}>
                        <Ionicons name="eye-outline" size={24} color="#00695c" />
                    </View>
                    <Text style={styles.cardTitle}>Our Vision</Text>
                </View>
                <Text style={styles.cardBodyText}>
                    To cultivate a greener Nepal by promoting responsible gardening practices and reconnecting people with nature.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#f7f9f9',
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    bannerImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 10,
    },
    bodyText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 10,
    },
    cardContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconBadge: {
        width: 42,
        height: 42,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
    },
    cardBodyText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 21,
    },
});