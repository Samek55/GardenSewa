import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Mirrors HomeSewa's MultiSelectDropdown.tsx (select-all header, chip list,
// confirm/clear footer) without its theme system, which this app doesn't have.
const MultiSelectDropdown = ({ label, options, selected, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [temp, setTemp] = useState([]);

    const handleOpen = () => {
        setTemp([...selected]);
        setOpen(true);
    };

    const toggle = (item) => {
        setTemp((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
    };

    const handleConfirm = () => {
        onChange(temp);
        setOpen(false);
    };

    const removeOne = (item) => {
        onChange(selected.filter((i) => i !== item));
    };

    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={handleOpen} activeOpacity={0.8}>
                <Text style={selected.length > 0 ? styles.dropdownValue : styles.dropdownPlaceholder} numberOfLines={1}>
                    {selected.length > 0 ? `${selected.length} selected` : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {selected.length > 0 && (
                <View style={styles.chipsRow}>
                    {selected.map((item) => (
                        <View key={item} style={styles.chip}>
                            <Text style={styles.chipText}>{item}</Text>
                            <TouchableOpacity onPress={() => removeOne(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Ionicons name="close" size={12} color="#245d5a" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <Ionicons name="close" size={22} color="#222" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            style={{ maxHeight: 320 }}
                            ListHeaderComponent={() => {
                                const allChecked = options.length > 0 && temp.length === options.length;
                                return (
                                    <TouchableOpacity
                                        style={styles.optionRow}
                                        onPress={() => setTemp(allChecked ? [] : [...options])}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, allChecked && styles.checkboxChecked]}>
                                            {allChecked && <Ionicons name="checkmark" size={13} color="#fff" />}
                                        </View>
                                        <Text style={[styles.optionText, styles.optionTextChecked]}>Select All</Text>
                                    </TouchableOpacity>
                                );
                            }}
                            renderItem={({ item }) => {
                                const checked = temp.includes(item);
                                return (
                                    <TouchableOpacity style={styles.optionRow} onPress={() => toggle(item)} activeOpacity={0.7}>
                                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                                            {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
                                        </View>
                                        <Text style={[styles.optionText, checked && styles.optionTextChecked]}>{item}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.clearBtn} onPress={() => setTemp([])}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                                <Text style={styles.confirmBtnText}>Confirm ({temp.length})</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default MultiSelectDropdown;

const styles = StyleSheet.create({
    label: {
        fontSize: 11, fontWeight: '800', color: '#245d5a',
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginBottom: 8, marginTop: 16,
    },
    dropdownBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#ccc',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    dropdownValue: { fontSize: 14, color: '#000', fontWeight: '500', flex: 1 },
    dropdownPlaceholder: { fontSize: 14, color: '#999', flex: 1 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#EAF6F4', borderRadius: 20,
        paddingVertical: 5, paddingHorizontal: 10,
    },
    chipText: { fontSize: 12, color: '#245d5a', fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, maxHeight: '75%' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
    optionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 2, borderColor: '#ccc',
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: '#245d5a', borderColor: '#245d5a' },
    optionText: { fontSize: 14, color: '#555', flex: 1 },
    optionTextChecked: { color: '#222', fontWeight: '600' },
    modalFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center' },
    clearBtnText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    confirmBtn: { flex: 2, paddingVertical: 12, borderRadius: 14, backgroundColor: '#245d5a', alignItems: 'center' },
    confirmBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
