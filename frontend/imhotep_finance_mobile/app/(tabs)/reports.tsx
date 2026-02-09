import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/constants/api';
// Check if I can use a simple modal or if I should assume standard components.
// The user's package.json doesn't show @react-native-picker/picker.
// Use a simple custom dropdown or standard React Native Modal for selection to be safe.
// Actually, I'll use a simple custom selector modal to avoid dependencies.

const CustomSelector = ({ visible, options, onSelect, onClose, title, selectedValue }: any) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : 'white' }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
                    {options.map((opt: any) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.optionItem,
                                {
                                    borderBottomColor: isDark ? '#334155' : '#f1f5f9',
                                    backgroundColor: selectedValue === opt.value ? (isDark ? '#334155' : '#f8fafc') : 'transparent'
                                }
                            ]}
                            onPress={() => onSelect(opt.value)}
                        >
                            <Text style={[
                                styles.optionText,
                                {
                                    color: selectedValue === opt.value ? '#366c6b' : (isDark ? '#f1f5f9' : '#1e293b'),
                                    fontWeight: selectedValue === opt.value ? 'bold' : 'normal'
                                }
                            ]}>
                                {opt.label}
                            </Text>
                            {selectedValue === opt.value && (
                                <Ionicons name="checkmark" size={20} color="#366c6b" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

export default function ReportsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [recalculateLoading, setRecalculateLoading] = useState(false);
    const [error, setError] = useState('');
    const [favoriteCurrency, setFavoriteCurrency] = useState('USD');

    // History Data
    const [historicalMonths, setHistoricalMonths] = useState<any[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Selected Values
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');

    // Report Data
    const [reportData, setReportData] = useState<any>(null);

    // Selectors Visibility
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [showYearSelector, setShowYearSelector] = useState(false);

    // Initial Load
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Currency
            try {
                const currencyRes = await api.get('/api/get-fav-currency/');
                setFavoriteCurrency(currencyRes.data.favorite_currency || 'USD');
            } catch (e) {
                console.warn('Failed to fetch currency');
            }

            // 2. Fetch History
            const monthsRes = await api.get('/api/finance-management/get-report-history-months/');
            const months = monthsRes.data.report_history_months || [];
            setHistoricalMonths(months);

            const yearsRes = await api.get('/api/finance-management/get-report-history-years/');
            const years = yearsRes.data.report_history_years || [new Date().getFullYear()];
            setAvailableYears(years);

            // 3. Set Defaults
            const now = new Date();
            const currentM = now.getMonth() + 1;
            const currentY = now.getFullYear();

            // Default Month
            const currentMonthExists = months.some((m: any) => m.month === currentM && m.year === currentY);
            if (currentMonthExists) {
                setSelectedMonth(`${currentM}-${currentY}`);
            } else if (months.length > 0) {
                setSelectedMonth(`${months[0].month}-${months[0].year}`);
            }

            // Default Year
            setSelectedYear(currentY.toString());

        } catch (err) {
            console.error('Initial load error:', err);
            setError('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Report Data
    useEffect(() => {
        if (!loading) {
            fetchReportData();
        }
    }, [selectedMonth, selectedYear, reportType]);

    const fetchReportData = async () => {
        if (reportType === 'monthly' && !selectedMonth) return;
        if (reportType === 'yearly' && !selectedYear) return;

        setDataLoading(true);
        setError('');
        setReportData(null);

        try {
            let res;
            if (reportType === 'monthly') {
                const [m, y] = selectedMonth.split('-');
                res = await api.get(`/api/finance-management/get-monthly-report-history/?month=${m}&year=${y}`);
                setReportData(res.data.report_data);
            } else {
                res = await api.get(`/api/finance-management/get-yearly-report/?year=${selectedYear}`);
                setReportData(res.data);
            }

            // Update currency if returned
            if (res.data.favorite_currency || res.data.report_data?.favorite_currency) {
                const newCurr = res.data.favorite_currency || res.data.report_data?.favorite_currency;
                if (newCurr !== favoriteCurrency) setFavoriteCurrency(newCurr);
            }

        } catch (err: any) {
            console.error('Report fetch error:', err);
            setError(err.response?.data?.error || 'Failed to load report data');
        } finally {
            setDataLoading(false);
        }
    };

    const handleRecalculate = async () => {
        Alert.alert(
            "Recalculate Reports",
            "This will recalculate all monthly reports from your first to last transaction. This may take a moment. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Continue", onPress: async () => {
                        setRecalculateLoading(true);
                        try {
                            const response = await api.post('/api/finance-management/recalculate-reports/');
                            const summary = response.data.summary;
                            Alert.alert(
                                "Success",
                                `Processed: ${summary.total_months_processed}\nCreated: ${summary.months_created}\nUpdated: ${summary.months_updated}`
                            );
                            // Refresh history
                            loadInitialData();
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.error || "Recalculation failed");
                        } finally {
                            setRecalculateLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getMonthName = (monthNum: number) => {
        const date = new Date();
        date.setMonth(monthNum - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    // Prepare Selector Options
    const monthOptions = historicalMonths.map(m => ({
        label: `${getMonthName(m.month)} ${m.year}`,
        value: `${m.month}-${m.year}`
    }));

    const yearOptions = availableYears.map(y => ({
        label: y.toString(),
        value: y.toString()
    }));

    // Visualization Components
    const ProgressBar = ({ percentage, color }: { percentage: number, color: string }) => (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.max(percentage, 2)}%`, backgroundColor: color }]} />
        </View>
    );

    const formatCurrency = (amount: number) => {
        return `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${favoriteCurrency}`;
    };

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        },
        card: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#e2e8f0',
        },
        text: {
            color: isDark ? '#f1f5f9' : '#1e293b',
        },
        subText: {
            color: isDark ? '#94a3b8' : '#64748b',
        },
        activeTab: {
            backgroundColor: '#366c6b',
            borderColor: '#366c6b',
        },
        inactiveTab: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#cbd5e1',
        },
        activeTabText: {
            color: 'white',
        },
        inactiveTabText: {
            color: isDark ? '#cbd5e1' : '#475569',
        },
        selector: {
            backgroundColor: isDark ? '#1e293b' : 'white',
            borderColor: isDark ? '#334155' : '#cbd5e1',
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, themeStyles.container]}>
                <ActivityIndicator size="large" color="#366c6b" />
                <Text style={[styles.loadingText, themeStyles.subText]}>Loading reports...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, themeStyles.container]}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={dataLoading} onRefresh={fetchReportData} />}
        >
            <View style={styles.header}>
                <Text style={[styles.title, themeStyles.text]}>Financial Reports</Text>
                <TouchableOpacity onPress={handleRecalculate} disabled={recalculateLoading}>
                    <Ionicons name="refresh-circle" size={32} color={recalculateLoading ? 'gray' : '#366c6b'} />
                </TouchableOpacity>
            </View>

            {/* Toggles */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, reportType === 'monthly' ? themeStyles.activeTab : themeStyles.inactiveTab]}
                    onPress={() => setReportType('monthly')}
                >
                    <Text style={[styles.tabText, reportType === 'monthly' ? themeStyles.activeTabText : themeStyles.inactiveTabText]}>
                        Monthly
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, reportType === 'yearly' ? themeStyles.activeTab : themeStyles.inactiveTab]}
                    onPress={() => setReportType('yearly')}
                >
                    <Text style={[styles.tabText, reportType === 'yearly' ? themeStyles.activeTabText : themeStyles.inactiveTabText]}>
                        Yearly
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Selectors */}
            <View style={styles.selectorContainer}>
                {reportType === 'monthly' ? (
                    <TouchableOpacity
                        style={[styles.selector, themeStyles.selector]}
                        onPress={() => setShowMonthSelector(true)}
                    >
                        <Text style={[styles.selectorText, themeStyles.text]}>
                            {selectedMonth ? monthOptions.find(o => o.value === selectedMonth)?.label : 'Select Month'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.selector, themeStyles.selector]}
                        onPress={() => setShowYearSelector(true)}
                    >
                        <Text style={[styles.selectorText, themeStyles.text]}>
                            {selectedYear || 'Select Year'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            {dataLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#366c6b" />
                </View>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : !reportData ? (
                <Text style={[styles.emptyText, themeStyles.subText]}>Select a period to view reports.</Text>
            ) : (
                <View style={styles.content}>
                    {/* Summary Cards */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, themeStyles.card, { borderLeftColor: '#ef4444' }]}>
                            <Text style={[styles.summaryLabel, themeStyles.subText]}>Total Expenses</Text>
                            <Text style={styles.expenseValue}>
                                {formatCurrency(reportData.total_withdraw || 0)}
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, themeStyles.card, { borderLeftColor: '#22c55e' }]}>
                            <Text style={[styles.summaryLabel, themeStyles.subText]}>Total Income</Text>
                            <Text style={styles.incomeValue}>
                                {formatCurrency(reportData.total_deposit || 0)}
                            </Text>
                        </View>
                    </View>

                    {/* Breakdown Sections */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, themeStyles.text]}>Expense Breakdown</Text>
                        {(!reportData.user_withdraw_on_range || reportData.user_withdraw_on_range.length === 0) ? (
                            <Text style={[styles.noDataText, themeStyles.subText]}>No expense data available.</Text>
                        ) : (
                            reportData.user_withdraw_on_range.map((item: any, idx: number) => (
                                <View key={idx} style={styles.breakdownItem}>
                                    <View style={styles.breakdownHeader}>
                                        <Text style={[styles.categoryName, themeStyles.text]}>{item.category}</Text>
                                        <Text style={[styles.categoryValue, themeStyles.text]}>{item.percentage}%</Text>
                                    </View>
                                    <ProgressBar percentage={parseFloat(item.percentage)} color={`hsl(${0 + (idx * 20)}, 70%, 50%)`} />
                                    <Text style={[styles.categoryAmount, themeStyles.subText]}>
                                        {formatCurrency(item.converted_amount)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, themeStyles.text]}>Income Breakdown</Text>
                        {(!reportData.user_deposit_on_range || reportData.user_deposit_on_range.length === 0) ? (
                            <Text style={[styles.noDataText, themeStyles.subText]}>No income data available.</Text>
                        ) : (
                            reportData.user_deposit_on_range.map((item: any, idx: number) => (
                                <View key={idx} style={styles.breakdownItem}>
                                    <View style={styles.breakdownHeader}>
                                        <Text style={[styles.categoryName, themeStyles.text]}>{item.category}</Text>
                                        <Text style={[styles.categoryValue, themeStyles.text]}>{item.percentage}%</Text>
                                    </View>
                                    <ProgressBar percentage={parseFloat(item.percentage)} color={`hsl(${120 + (idx * 20)}, 70%, 40%)`} />
                                    <Text style={[styles.categoryAmount, themeStyles.subText]}>
                                        {formatCurrency(item.converted_amount)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                </View>
            )}

            {/* Modals */}
            <CustomSelector
                visible={showMonthSelector}
                options={monthOptions}
                onSelect={(val: string) => {
                    setSelectedMonth(val);
                    setShowMonthSelector(false);
                }}
                onClose={() => setShowMonthSelector(false)}
                title="Select Month"
                selectedValue={selectedMonth}
            />
            <CustomSelector
                visible={showYearSelector}
                options={yearOptions}
                onSelect={(val: string) => {
                    setSelectedYear(val);
                    setShowYearSelector(false);
                }}
                onClose={() => setShowYearSelector(false)}
                title="Select Year"
                selectedValue={selectedYear}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
    },
    tabText: {
        fontWeight: '600',
        fontSize: 16,
    },
    selectorContainer: {
        marginBottom: 20,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '500',
    },
    content: {
        gap: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    expenseValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    incomeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#22c55e',
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    breakdownItem: {
        marginBottom: 12,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    categoryAmount: {
        fontSize: 12,
        textAlign: 'right',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    noDataText: {
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    modalContent: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        maxHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
    }
});
