import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const FavoritesProfessional = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          Professionals you'd like to book again
        </Text>

        {/* Membership Status Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="ribbon-outline" size={26} color="#A86326" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.memberStatus}>Bronze Member</Text>
            <Text style={styles.statsText}>0 points · 0 completed bookings</Text>
            <Text style={styles.subStatsText}>5 more bookings to Silver</Text>
          </View>
        </View>

        {/* My Favorites Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MY FAVORITES</Text>
          <Text style={styles.emptyText}>No favorites yet.</Text>
        </View>

        {/* People Who've Worked For You Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PEOPLE WHO'VE WORKED FOR YOU</Text>
          <Text style={styles.emptyText}>No completed bookings yet.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2323',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#667070',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEB',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  memberStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A86326',
    marginBottom: 2,
  },
  statsText: {
    fontSize: 13,
    color: '#526060',
    marginBottom: 2,
  },
  subStatsText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#809896',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#809896',
  },
});

export default FavoritesProfessional;