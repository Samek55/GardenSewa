import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BookingSummaryCard = ({ name, phone, service, startDate, endDate, preferredTime, city, area, priority, budget, message, onBack, onConfirm }) => {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Booking Summary</Text>
            <Text style={styles.subTitle}>Please review your details before confirming</Text>

            <View style={styles.summaryContainer}>
                {[
                    { label: 'Full Name', value: name },
                    { label: 'Phone Number', value: phone },
                    { label: 'Service', value: service },
                    { label: 'Starting Date', value: startDate },
                    { label: 'Ending Date', value: endDate },
                    { label: 'Preferred Time', value: preferredTime },
                    { label: 'City', value: city },
                    { label: 'Area', value: area },
                    { label: 'Priority', value: priority },
                    { label: 'Budget', value: budget },
                ].map((item, index) => (
                    <View key={index} style={styles.textDetailContainer}>
                        <Text style={styles.detailLabel}>{item.label}</Text>
                        <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                ))}

                <View style={styles.messageSection}>
                    <Text style={styles.detailLabel}>Message</Text>
                    <Text style={styles.messageText}>{message}</Text>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={() => onConfirm()}
                >
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.editButton]}
                    onPress={() => onBack()}
                >
                    <Text style={styles.editButtonText}>Edit Booking</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#2D6A65', 
        // padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#E0E0E0', 
        marginBottom: 24,
    },
    summaryContainer: {
        backgroundColor: 'white',
        borderRadius: 20, 
        padding: 24,
        elevation: 2, 
        marginBottom: 32,
    },
    textDetailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0', 
    },
    detailLabel: {
        fontSize: 14,
        color: '#757575', 
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: '#212121', 
        fontWeight: '600',
    },
    messageSection: {
        marginTop: 20,
    },
    messageText: {
        fontSize: 16,
        color: '#212121',
        marginTop: 8,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'column',
        gap: 16,
        marginBottom: 40,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    confirmButton: {
        backgroundColor: '#309088',
    },
    confirmButtonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#2D6A65',
    },
    editButtonText: {
        fontSize: 18,
        color: '#2D6A65',
        fontWeight: 'bold',
    },
});

export default BookingSummaryCard;