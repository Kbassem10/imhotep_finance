import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import api from '../constants/api'; // Use the configured api instance

// Hardcoded list of common currencies to avoid needing a separate file, 
// or I could fetch from an API or just use a standard list.
// For now, I'll use a small list or try to import if available, but since I can't easily import from web utils, I'll define a few common ones.
const COMMON_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
    'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'EGP'
];

interface CurrencySelectProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({ value, onChange, required }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [favoriteCurrency, setFavoriteCurrency] = useState('');
    const [loading, setLoading] = useState(false);

    const filtered = COMMON_CURRENCIES.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                // Using the api instance which handles base URL
                const res = await api.get('/api/get-fav-currency/');
                if (!mounted) return;
                const fav = res.data.favorite_currency || '';
                setFavoriteCurrency(fav);
                if (fav && (!value || value === '')) {
                    onChange(fav);
                }
            } catch (e) {
                console.log('Error fetching favorite currency:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <View>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>{value || 'Select Currency'}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Currency</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search currency..."
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                        />

                        <FlatList
                            data={filtered}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.item, item === value && styles.selectedItem]}
                                    onPress={() => {
                                        onChange(item);
                                        setModalVisible(false);
                                        setSearch('');
                                    }}
                                >
                                    <Text style={[styles.itemText, item === value && styles.selectedItemText]}>{item}</Text>
                                    {item === value && <Ionicons name="checkmark" size={20} color="#fff" />}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No currencies found</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    selector: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    selectorText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#51adac',
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedItemText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
});

export default CurrencySelect;
