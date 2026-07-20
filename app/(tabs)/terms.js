import { ScrollView, StyleSheet, Text, View } from "react-native";

const TermsAndConditions = () => {
    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>

            <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Terms and Conditions</Text>
                <Text style={styles.headerSubtitle}>Understand the rules and guidelines of using GardenSewa services</Text>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Introduction</Text>
                <Text style={styles.paragraphText}>
                    These Terms and Conditions govern your access and use of GardenSewa app and services. By booking a service or browsing our app, you agree to comply with these terms.
                </Text>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Services & Bookings</Text>
                <View style={styles.bulletListContainer}>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>GardenSewa provides gardening, landscaping, plant delivery, and maintenance services.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Bookings must be made through our official website and app or support channels.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Prices listed are subject to change based on service scope, location, or availability.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Payment may be required in advance for certain services.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Cancellations & Refunds</Text>
                <View style={styles.bulletListContainer}>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>You may cancel or reschedule a booking at least 24 hours in advance.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Late cancellations (less than 24 hours) may not be eligible for a refund.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>If GardenSewa cancels a service due to weather or unforeseen issues, you will receive a full refund or rescheduling option.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>User Responsibilities</Text>
                <View style={styles.bulletListContainer}>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Ensure accurate information is submitted during booking.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Provide safe and easy access to the service location at the scheduled time.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Avoid any behavior that might endanger GardenSewa staff or damage tools/equipment.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Intellectual Property</Text>
                <Text style={styles.paragraphText}>
                    All content, images, and branding on this website are the property of GardenSewa. Reuse or reproduction without permission is prohibited.
                </Text>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Limitation of Liability</Text>
                <Text style={styles.paragraphText}>GardenSewa is not responsible for:</Text>
                <View style={styles.bulletListContainer}>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Delays due to natural causes (e.g., rain, road closures).</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Damages resulting from customer misuse of plants, tools, or instructions.</Text>
                    </View>
                    <View style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Services requested outside the defined scope.</Text>
                    </View>
                </View>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Changes to Terms</Text>
                <Text style={styles.paragraphText}>
                    GardenSewa reserves the right to modify these Terms at any time. Updates will be posted on this page, and continued use of the website implies acceptance.
                </Text>
            </View>

            <View style={styles.paragraphTextContainer}>
                <Text style={styles.paragraphTitle}>Contact Information</Text>
                <Text style={styles.paragraphText}>
                    For questions or concerns about our Terms and Conditions, please contact: <Text style={styles.emailHighlight}>gardensewa@sriyog.com</Text>
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#245d5a',
    },
    container: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTextContainer: {
        marginBottom: 24,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff'
    },
    headerSubtitle: {
        fontSize: 15,
        marginTop: 6,
        lineHeight: 20,
        color: '#fff'
    },
    paragraphTextContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16
    },
    paragraphTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#235d54',
        marginBottom: 8,
    },
    paragraphText: {
        fontSize: 14,
        color: '#2b3d3a',
        lineHeight: 22,
    },
    bulletListContainer: {
        marginTop: 6,
        // backgroundColor: '#e3fffb',
        // borderRadius: 16,
        padding: 12,
        gap: 10,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletPoint: {
        fontSize: 32,
        color: '#235d54',
        marginRight: 8,
        lineHeight: 20,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        color: '#2b3d3a',
        lineHeight: 20,
    },
    emailHighlight: {
        fontWeight: '600',
        color: '#235d54',
    }
});

export default TermsAndConditions;