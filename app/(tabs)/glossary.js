import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { services } from "../../data/servicesList"

const Glossary = () => {
    const alphabetArray = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
    const [selectedAlphabet, setSelectedAlphabet] = useState('A')

    const filteredServices = services.filter((service) =>
        service.title && service.title.trim().toUpperCase().startsWith(selectedAlphabet)
    )

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.introText}>
                Explore common gardening terms from A to Z.
            </Text>

            <View style={styles.matrixContainer}>
                <View style={styles.matrixGrid}>
                    {alphabetArray.map((alphabet) => {
                        const isSelected = selectedAlphabet === alphabet
                        return (
                            <Pressable
                                key={alphabet}
                                onPress={() => setSelectedAlphabet(alphabet)}
                                style={[
                                    styles.alphabetButton,
                                    isSelected ? styles.selectedButton : styles.unselectedButton
                                ]}
                            >
                                <Text style={[
                                    styles.alphabetText,
                                    isSelected ? styles.selectedText : styles.unselectedText
                                ]}>
                                    {alphabet}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            </View>

            <Text style={styles.sectionIndicator}>{selectedAlphabet}</Text>

            {filteredServices.length > 0 ? (
                filteredServices.map((service, index) => (
                    <View key={service.id || index} style={styles.card}>
                        <Text style={styles.cardTitle}>{service.title}</Text>
                        <Text style={styles.cardDescription}>{service.description}</Text>
                    </View>
                ))
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No services found starting with {selectedAlphabet}</Text>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    introText: {
        fontSize: 15,
        textAlign: 'center',
        fontWeight: '600',
        color: '#000000',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    matrixContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#EAEAEA',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        marginBottom: 28,
    },
    matrixGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    alphabetButton: {
        width: 42,
        height: 42,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#1E8276',
    },
    unselectedButton: {
        backgroundColor: '#EAECEF',
    },
    alphabetText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectedText: {
        color: '#FFFFFF',
    },
    unselectedText: {
        color: '#000000',
    },
    sectionIndicator: {
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        padding: 20,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        color: '#444444',
        lineHeight: 20,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888888',
        fontSize: 15,
        fontStyle: 'italic',
    }
})

export default Glossary