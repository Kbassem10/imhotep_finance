import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Modal,
    Platform,
    TextInput,
    Alert,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';
import TransactionItem from '@/components/TransactionItem';
import AddTransactionModal from '@/components/AddTransactionModal';
import CategorySelect from '@/components/CategorySelect';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [statusFilter, setStatusFilter] = useState(''); // 'deposit', 'withdraw', ''
    const [categoryFilter, setCategoryFilter] = useState('');
    const [detailsSearch, setDetailsSearch] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editTransaction, setEditTransaction] = useState<any>(null);

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        },
        header: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderBottomColor: isDark ? '#334155' : '#e2e8f0',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        filterButton: {
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
        },
        modalContent: {
            backgroundColor: isDark ? '#1e293b' : 'white',
        },
        input: {
            backgroundColor: isDark ? '#334155' : '#f9f9f9',
            color: isDark ? '#f1f5f9' : '#000',
            borderColor: isDark ? '#475569' : '#eee',
        },
        actionButton: {
            backgroundColor: isDark ? '#334155' : 'white',
            borderColor: isDark ? '#475569' : '#e2e8f0',
        }
    };

    const fetchTransactions = async (pageNum: number, refresh: boolean = false) => {
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const params: any = { page: pageNum };
            if (startDate) params.start_date = startDate.toISOString().split('T')[0];
            if (endDate) params.end_date = endDate.toISOString().split('T')[0];
            if (statusFilter) params.trans_status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (detailsSearch) params.details_search = detailsSearch;

            const res = await api.get('/api/finance-management/transaction/get-transactions/', { params });

            const newTransactions = res.data.transactions || [];

            if (refresh) {
                setTransactions(newTransactions);
            } else {
                setTransactions(prev => [...prev, ...newTransactions]);
            }

            // Check if we have more pages from API response or based on count
            const hasMoreFromAPI = res.data.has_more !== undefined ? res.data.has_more : (newTransactions.length >= 10);
            setHasMore(hasMoreFromAPI);

        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load transactions');
            setHasMore(false); // Stop pagination on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchTransactions(1, true);
    }, []); // Run once on mount

    // Apply filters triggers reload
    const applyFilters = () => {
        setPage(1);
        setShowFilterModal(false);
        fetchTransactions(1, true);
    };

    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setStatusFilter('');
        setCategoryFilter('');
        setDetailsSearch('');
        setPage(1);
        setShowFilterModal(false);
        setTimeout(() => fetchTransactions(1, true), 200);
    };

    // Pagination
    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTransactions(nextPage);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchTransactions(1, true);
    };

    const handleEdit = (transaction: any) => {
        setEditTransaction(transaction);
        setShowAddModal(true);
    };

    // Actions
    const handleRecalculateNetworth = async () => {
        Alert.alert(
            "Recalculate Networth",
            "This will recalculate your networth from all transactions. This may take a moment. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Continue",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.post('/api/finance-management/recalculate-networth/');
                            Alert.alert("Success", "Networth recalculated successfully!");
                        } catch (e: any) {
                            Alert.alert("Error", e.response?.data?.error || "Failed to recalculate networth");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };


    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Header */}
            <View style={[styles.header, themeStyles.header]}>
                <Text style={[styles.headerTitle, themeStyles.text]}>Transactions</Text>
                <TouchableOpacity
                    style={[styles.filterButton, themeStyles.filterButton]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="options" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
                    <TouchableOpacity style={[styles.actionChip, themeStyles.actionButton]} onPress={handleRecalculateNetworth}>
                        <Ionicons name="refresh-outline" size={16} color={isDark ? '#94a3b8' : '#475569'} />
                        <Text style={[styles.actionText, themeStyles.subText]}>Recalculate</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TransactionItem
                        transaction={item}
                        onPress={() => handleEdit(item)}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : "#366c6b"} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading && !refreshing ? <ActivityIndicator size="small" color="#366c6b" style={{ margin: 20 }} /> : null}
                ListEmptyComponent={!loading ? <Text style={[styles.emptyText, themeStyles.subText]}>No transactions found.</Text> : null}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            {/* Add Button (Floating) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    setEditTransaction(null);
                    setShowAddModal(true);
                }}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <AddTransactionModal
                visible={showAddModal}
                editMode={!!editTransaction}
                initialValues={editTransaction || {}}
                initialType={editTransaction?.trans_status?.toLowerCase() || 'deposit'}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    onRefresh();
                }}
            />

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.modalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>Filter Transactions</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={themeStyles.text.color} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.label, themeStyles.text]}>Search</Text>
                        <TextInput
                            style={[styles.input, themeStyles.input]}
                            placeholder="Search description..."
                            placeholderTextColor={isDark ? '#94a3b8' : '#999'}
                            value={detailsSearch}
                            onChangeText={setDetailsSearch}
                        />

                        {/* Category Filter */}
                        <Text style={[styles.label, themeStyles.text]}>Category</Text>
                        <CategorySelect
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            status={statusFilter || 'ANY'}
                        />

                        {/* Date Filters */}
                        <Text style={[styles.label, themeStyles.text]}>Date Range</Text>
                        <View style={styles.dateRow}>
                            <TouchableOpacity
                                style={[styles.dateInput, themeStyles.input]}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Text style={themeStyles.text}>{startDate ? startDate.toISOString().split('T')[0] : 'Start Date'}</Text>
                                <Ionicons name="calendar-outline" size={20} color={themeStyles.subText.color} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateInput, themeStyles.input]}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Text style={themeStyles.text}>{endDate ? endDate.toISOString().split('T')[0] : 'End Date'}</Text>
                                <Ionicons name="calendar-outline" size={20} color={themeStyles.subText.color} />
                            </TouchableOpacity>
                        </View>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(e, d) => {
                                    setShowStartPicker(Platform.OS === 'ios');
                                    if (d) setStartDate(d);
                                }}
                            />
                        )}
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(e, d) => {
                                    setShowEndPicker(Platform.OS === 'ios');
                                    if (d) setEndDate(d);
                                }}
                            />
                        )}

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.clearButton]}
                                onPress={() => {
                                    clearFilters();
                                }}
                            >
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.applyButton]}
                                onPress={applyFilters}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60, // Status bar
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    filterButton: {
        padding: 10,
        borderRadius: 12,
    },
    actionsContainer: {
        marginBottom: 10,
    },
    actionsScroll: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 10,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#366c6b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%', // Limit height
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterChipDark: {
        backgroundColor: '#334155',
    },
    filterChipActive: {
        backgroundColor: '#366c6b',
    },
    filterChipText: {
        color: '#64748b',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: 'white',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    clearButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    applyButton: {
        backgroundColor: '#366c6b',
    },
    clearButtonText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    applyButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
