import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { faqData } from '../../data/servicesList'

const FAQ = () => {
    const [expandedFaqId, setExpandedFaqId] = useState(null)

    const toggleFaq = (id) => {
        setExpandedFaqId((prevId) => (prevId === id ? null : id));
    }

    return (
        <ScrollView style={styles.scrollview} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.faqHeader}>FAQs</Text>
            <Text style={styles.subHeaderText}>Everything you need to know about Garden Sewa</Text>

            <View style={styles.fullContainer}>
                {
                    faqData?.map((faq, key) => {
                        const isOpen = expandedFaqId === faq.id;

                        return (
                            <View
                                key={faq.id || key}
                                style={[styles.faqCard, isOpen && styles.faqCardOpen]}
                            >
                                <Pressable
                                    onPress={() => toggleFaq(faq.id)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 16,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                                        <View style={[styles.numberBadge, isOpen && styles.numberBadgeOpen]}>
                                            <Image
                                                source={require('@/assets/images/splash-icon-actual.png')}
                                                style={[styles.bulletImage, isOpen && styles.bulletImageOpen]}
                                                resizeMode="contain"
                                            />
                                        </View>
                                        <Text style={styles.faqTitle}>{faq.title}</Text>
                                    </View>

                                    <Ionicons
                                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={isOpen ? '#245d5a' : '#000'}
                                    />
                                </Pressable>

                                {isOpen && (
                                    <View style={styles.descriptionWrapper}>
                                        <View style={styles.leftSelectionBorder} />
                                        <View style={styles.descriptionTextContainer}>
                                            <Text style={styles.descriptionText}>{faq.description}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )
                    })
                }
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollview: {
        flex: 1,
        backgroundColor: '#f6f9f8'
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 24
    },
    faqHeader: {
        fontSize: 32,
        color: '#000',
        marginBottom: 8,
        fontWeight: 'bold'
    },
    subHeaderText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
        marginBottom: 24
    },
    fullContainer: {
        width: '100%',
        gap: 16
    },
    faqCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    faqCardOpen: {
        borderColor: '#245d5a',
        borderWidth: 2,
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#edf2f7',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 6,
    },
    numberBadgeOpen: {
        backgroundColor: '#245d5a',
    },
    bulletImage: {
        width: 26,
        height: 26,
        tintColor: '#245d5a',
    },
    bulletImageOpen: {
        tintColor: '#ffffff',
    },
    faqTitle: {
        fontSize: 15,
        color: '#000',
        flex: 1,
        fontWeight: 'bold'
    },
    descriptionWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    leftSelectionBorder: {
        width: 3,
        backgroundColor: '#245d5a',
        borderRadius: 2,
        marginRight: 12,
    },
    descriptionTextContainer: {
        flex: 1,
    },
    descriptionText: {
        color: '#334155',
        lineHeight: 22,
        fontSize: 13,
        fontWeight: '500',
    }
});

export default FAQ;