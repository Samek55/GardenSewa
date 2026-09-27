import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Compact "pick one" field for the admin booking forms (reviewBooking.js,
// submitBookingForCustomer.js). `value` is the stored string itself — it's
// shown as-is, and getLabel only turns an option into its display/stored
// string. `searchable` adds a filter box for long lists (e.g. Area).
export default function SelectField({
    label, required, value, placeholder, options, onSelect, getLabel = (o) => o, searchable = false,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const q = search.trim().toLowerCase();
    const visible = q ? options.filter((o) => String(getLabel(o)).toLowerCase().includes(q)) : options;

    const close = () => {
        setOpen(false);
        setSearch('');
    };

    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}{required && <Text style={styles.asterisk}> *</Text>}</Text>
            <TouchableOpacity style={styles.selectTrigger} onPress={() => setOpen(true)}>
                <Text style={[styles.selectTriggerText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={close}>
                    {/* Inner touchable swallows taps so tapping the search box / list doesn't close the modal */}
                    <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        {searchable && (
                            <TextInput
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                                placeholder={`Search ${label.toLowerCase()}`}
                                placeholderTextColor={colors.textMuted}
                                autoCorrect={false}
                            />
                        )}
                        <FlatList
                            data={visible}
                            keyExtractor={(item, i) => String(item.id ?? getLabel(item) ?? i)}
                            style={{ maxHeight: 350 }}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={<Text style={styles.emptyText}>No matches</Text>}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionRow}
                                    onPress={() => { onSelect(item); close(); }}
                                >
                                    <Text style={[styles.optionText, getLabel(item) === value && styles.optionTextActive]}>
                                        {getLabel(item)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const createStyles = (colors) => StyleSheet.create({
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
    asterisk: { color: colors.danger },
    selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
    selectTriggerText: { fontSize: 14, color: colors.textPrimary },
    placeholderText: { color: colors.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.textPrimary },
    searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
    optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
    optionText: { fontSize: 14, color: colors.textSecondary },
    optionTextActive: { color: colors.brand, fontWeight: '700' },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});
