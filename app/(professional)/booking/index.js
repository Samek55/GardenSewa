import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { BookingsListProfessional } from '../../../data/servicesList';

const STATUS_OPTIONS = ['New', 'Cancelled', 'OnGoing', 'Dispute', 'Completed', 'All'];

// Safely normalizes slashes (2026/08/02), hyphens, or human-readable strings into standard YYYY-MM-DD
const formatToISODate = (dateString) => {
  if (!dateString) return null;

  // Replace forward slashes with hyphens: "2026/08/02" -> "2026-08-02"
  const cleanStr = String(dateString).trim().replace(/\//g, '-');

  // Match YYYY-MM-DD pattern
  const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // Fallback for complex JS date strings
  const parsedDate = new Date(cleanStr);
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
};

const BookingSummaryPage = () => {
  const [selectedStatus, setSelectedStatus] = useState('New');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar State (e.g. "2026-08-02")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  // Filtering Logic
  const filteredBookings = BookingsListProfessional.filter((item) => {
    // 1. Status Filter
    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : item.workStatus?.toLowerCase() === selectedStatus.toLowerCase();

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.fullName?.toLowerCase().includes(query) ||
      item.service?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query);

    // 3. Date & Date Range Filter Logic
    let matchesDate = true;
    if (selectedDateStr) {
      // Standardize selected calendar date to timestamp (at midnight)
      const selectedTimestamp = new Date(`${selectedDateStr}T00:00:00`).getTime();

      // Normalize single date fields (bookingDate or booking_date)
      const rawBookingDate = item.bookingDate || item.booking_date;
      const itemBookingISO = formatToISODate(rawBookingDate);
      const itemBookingTimestamp = itemBookingISO
        ? new Date(`${itemBookingISO}T00:00:00`).getTime()
        : null;

      // Normalize range fields (startDate and endDate)
      const itemStartISO = formatToISODate(item.startDate);
      const itemEndISO = formatToISODate(item.endDate);
      const itemStartTimestamp = itemStartISO
        ? new Date(`${itemStartISO}T00:00:00`).getTime()
        : null;
      const itemEndTimestamp = itemEndISO
        ? new Date(`${itemEndISO}T00:00:00`).getTime()
        : null;

      // Evaluation Logic
      if (itemStartTimestamp && itemEndTimestamp) {
        // Lies on or between startDate and endDate
        matchesDate =
          selectedTimestamp >= itemStartTimestamp &&
          selectedTimestamp <= itemEndTimestamp;
      } else if (itemBookingTimestamp) {
        // Exact single-day match
        matchesDate = itemBookingTimestamp === selectedTimestamp;
      } else {
        matchesDate = false;
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  const getMarkedDates = () => {
    const marked = {};

    BookingsListProfessional.forEach((item) => {
      // const rawBookingDate = item.bookingDate || item.booking_date;
      // const singleISO = formatToISODate(rawBookingDate);

      // if (singleISO) {
      //   marked[singleISO] = {
      //     marked: true,
      //     dotColor: '#245d5a',
      //   };
      // }

      // Mark range start and end dates
      const startISO = formatToISODate(item.startDate);
      const endISO = formatToISODate(item.endDate);
      if (startISO) marked[startISO] = { marked: true, dotColor: '#245d5a' };
      if (endISO) marked[endISO] = { marked: true, dotColor: '#245d5a' };
    });

    // Active Selection Highlight
    if (selectedDateStr) {
      marked[selectedDateStr] = {
        ...(marked[selectedDateStr] || {}),
        selected: true,
        selectedColor: '#245d5a',
        selectedTextColor: '#FFFFFF',
      };
    }

    return marked;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return { bg: '#EBF8FF', text: '#2B6CB0', border: '#3182CE' };
      case 'completed':
        return { bg: '#F0FDF4', text: '#15803D', border: '#22C55E' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#B91C1C', border: '#EF4444' };
      case 'dispute':
        return { bg: '#FFFBEB', text: '#B45309', border: '#F59E0B' };
      default: // 'new'
        return { bg: '#E8F4F3', text: '#245d5a', border: '#245d5a' };
    }
  };

  const renderBookingItem = ({ item }) => {
    const statusTheme = getStatusBadgeStyle(item.workStatus);
    const displayDate = item.bookingDate || item.booking_date || '10 Aug 2026';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: statusTheme.border }]}
        activeOpacity={0.85}
        onPress={() => router.push(`/booking/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.clientMeta}>
            <Text style={styles.clientName} numberOfLines={1}>
              {item.fullName || 'Client Request'}
            </Text>
            <Text style={styles.bookingDate}>{displayDate}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusTheme.text }]}>
              {item.workStatus || 'New'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Feather name="tool" size={14} color="#245d5a" />
            <Text style={styles.infoPillText} numberOfLines={1}>
              {item.service || 'Service'}
            </Text>
          </View>

          <View style={styles.infoPill}>
            <Ionicons name="cash-outline" size={15} color="#2D3748" />
            <Text style={styles.infoPillText}>
              {item.budget || 'NPR 5,000'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>View Request Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#245d5a" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Navigation Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#245d5a" />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Booking History</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setIsSearchOpen(!isSearchOpen)}>
            <Ionicons name="search-outline" size={22} color="#4A5568" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsCalendarOpen(true)}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={selectedDateStr ? '#245d5a' : '#4A5568'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Active Date Tag */}
      {selectedDateStr !== '' && (
        <View style={styles.activeDateTag}>
          <Ionicons name="calendar" size={14} color="#245d5a" />
          <Text style={styles.activeDateText}>Date: {selectedDateStr}</Text>
          <TouchableOpacity onPress={() => setSelectedDateStr('')}>
            <Ionicons name="close-circle" size={16} color="#245d5a" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Expandable Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by client or service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Status Filter Dropdown Trigger */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          activeOpacity={0.8}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Text style={styles.dropdownTriggerText}>{selectedStatus}</Text>
          <Feather
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#245d5a"
          />
        </TouchableOpacity>
      </View>

      {/* Status Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownMenu}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedStatus(status);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedStatus === status && styles.selectedOptionText,
                    ]}
                  >
                    {status}
                  </Text>
                  {selectedStatus === status && (
                    <Ionicons name="checkmark" size={16} color="#245d5a" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/*  Interactive Calendar Modal */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Booking Date</Text>
              <TouchableOpacity onPress={() => setIsCalendarOpen(false)}>
                <Ionicons name="close" size={22} color="#4A5568" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={(day) => {
                setSelectedDateStr(day.dateString);
                setIsCalendarOpen(false);
              }}
              markedDates={getMarkedDates()}
              theme={{
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#64748B',
                selectedDayBackgroundColor: '#245d5a',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#245d5a',
                dayTextColor: '#1E293B',
                textDisabledColor: '#CBD5E1',
                arrowColor: '#245d5a',
                monthTextColor: '#1E293B',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />

            {/* Clear Date Filter Button at the Very Bottom */}
            <TouchableOpacity
              style={styles.clearDateBtn}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedDateStr('');
                setIsCalendarOpen(false);
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              <Text style={styles.clearDateBtnText}>Clear Date Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. List of Matching Requests */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No requests found for this filter.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingRight: 8,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activeDateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F3',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#245d5a',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    width: 130,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#245d5a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  clearDateBtn: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearDateBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 110,
    left: 16,
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  selectedOptionText: {
    color: '#245d5a',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientMeta: {
    flex: 1,
    paddingRight: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  bookingDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#245d5a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BookingSummaryPage;