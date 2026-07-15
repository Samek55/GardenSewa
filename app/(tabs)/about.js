import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import TeamCard from "../../components/TeamCard";
import { teams } from "../../data/servicesList";

export default function About() {
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Image
                source={{ uri: 'https://plus.unsplash.com/premium_photo-1689530775582-83b8abdb5020?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww' }}
                style={styles.bannerImage}
                resizeMode="cover"
            />

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About Us</Text>
                <Text style={styles.bodyText}>
                    GardenSewa is a technology driven home service marketplace designed to connect customers with nearby professionals through real-time location-based marketing.
                </Text>
                <Text style={styles.bodyText}>
                    The platform aims to simplify the preocess of finding the trusted service providers while helping skilled professionals generate business opportunities within their local communities
                </Text>
                <Text style={styles.bodyText}>
                    With increasing urbanization and growing demand for on demand services, customers often struggle to find reliable professionals quickly, while service providers face challanges in acquiring quality leads.
                </Text>
                <Text style={styles.bodyText}>
                    GardenSewa bridges this gap by enabling instant service requests, AI powered matching and real-time notifications.
                </Text>
            </View>

            <View style={styles.sectionContainer}>
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
        marginBottom: 24,
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