import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function About() {
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1724500941193-f1f2541b6228?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }}
                style={styles.bannerImage}
                resizeMode="cover"
            />

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About Us</Text>
                <Text style={styles.bodyText}>
                    Garden Sewa is a technology driven home service marketplace designed to connect customers with nearby professionals through real-time location-based marketing.
                </Text>
                <Text style={styles.bodyText}>
                    The platform aims to simplify the preocess of finding the trusted service providers while helping skilled professionals generate business opportunities within their local communities
                </Text>
                <Text style={styles.bodyText}>
                    With increasing urbanization and growing demand for on demand services, customers often struggle to find reliable professionals quickly, while service providers face challanges in acquiring quality leads.
                </Text>
                <Text style={styles.bodyText}>
                    Garden Sewa bridges this gap by enabling instant service requests, AI powered matching and real-time notifications.
                </Text>
            </View>

            {/* <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Our Team</Text>
                <View style={styles.teamsGrid}>
                    {teams?.map((team, index) => (
                        <View key={team.id || index} style={styles.teamCardWrapper}>
                            <TeamCard
                                name={team.name}
                                imageUrl={team.url}
                                position={team.position}
                            />
                        </View>
                    ))}
                </View>
            </View> */}

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Our Mission</Text>
                <Text style={styles.bodyText}>
                    To reconnect people with nature one plant, one garden, one moment at a time. We provide high-quality plants, gardening resources, and expert support to every corner of Nepal.
                </Text>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Our Motive</Text>
                <Text style={styles.bodyText}>
                    We aim to be the go-to place for all gardening needs, offering easy access to plants and expert advice for every gardener and farmer.
                </Text>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Our Vision</Text>
                <Text style={styles.bodyText}>
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
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    bodyText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 12,
    },
    teamsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    teamCardWrapper: {
        width: '25%',
        marginBottom: 16,
    }
});