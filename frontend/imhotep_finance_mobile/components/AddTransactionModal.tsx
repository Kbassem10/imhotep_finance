import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../constants/api';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';

interface AddTransactionModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'deposit' | 'withdraw';
    initialValues?: any;
    editMode?: boolean;
    visible: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
    onClose,
    onSuccess,
    initialType = 'deposit',
    initialValues = {},
    editMode = false,
    visible,
}) => {
    const [status, setStatus] = useState<'deposit' | 'withdraw'>(initialType);
    const [amount, setAmount] = useState(initialValues.amount || '');
    const [desc, setDesc] = useState(initialValues.desc || '');
    const [category, setCategory] = useState(initialValues.category || '');
    const [currency, setCurrency] = useState(initialValues.currency || '');
    const [date, setDate] = useState(initialValues.date ? new Date(initialValues.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setStatus(initialValues.trans_status || initialType);
            setAmount(initialValues.amount ? String(initialValues.amount) : '');
            setDesc(initialValues.trans_details || '');
            setCategory(initialValues.category || '');
            setCurrency(initialValues.currency || '');
            setDate(initialValues.date ? new Date(initialValues.date) : new Date());
        }
    }, [visible]);

    const handleSubmit = async () => {
        setLoading(true);
        if (!amount || !currency) {
            Alert.alert('Error', 'Amount and currency are required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                amount,
                currency,
                trans_status: status,
                category,
                trans_details: desc,
                date: date.toISOString().split('T')[0],
            };

            if (editMode && initialValues.id) {
                await api.post(
                    `/api/finance-management/transaction/update-transactions/${initialValues.id}/`,
                    payload
                );
                Alert.alert('Success', 'Transaction updated successfully!');
            } else {
                await api.post('/api/finance-management/transaction/add-transactions/', payload);
                Alert.alert('Success', 'Transaction added successfully!');
            }

            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || (editMode ? 'Failed to update transaction.' : 'Failed to add transaction.');
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
        if (selectedDate) {
            setDate(selectedDate);
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };


    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{editMode ? 'Edit Transaction' : 'Add Transaction'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        {/* Type Selector */}
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    status === 'deposit' && styles.typeButtonIncome
                                ]}
                                onPress={() => setStatus('deposit')}
                            >
                                <Text style={[styles.typeText, status === 'deposit' && styles.typeTextActive]}>Income</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    status === 'withdraw' && styles.typeButtonExpense
                                ]}
                                onPress={() => setStatus('withdraw')}
                            >
                                <Text style={[styles.typeText, status === 'withdraw' && styles.typeTextActive]}>Expense</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount */}
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        {/* Currency */}
                        <Text style={styles.label}>Currency</Text>
                        <CurrencySelect
                            value={currency}
                            onChange={setCurrency}
                            required
                        />

                        {/* Category */}
                        <Text style={styles.label}>Category</Text>
                        <CategorySelect
                            value={category}
                            onChange={setCategory}
                            status={status}
                        />

                        {/* Description */}
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Description (optional)"
                            value={desc}
                            onChangeText={setDesc}
                        />

                        {/* Date */}
                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>{date.toISOString().split('T')[0]}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                            />
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: status === 'deposit' ? '#10b981' : '#ef4444' }
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>{editMode ? 'Save' : 'Add'}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        paddingBottom: 40,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeButtonIncome: {
        backgroundColor: '#d1fae5',
    },
    typeButtonExpense: {
        backgroundColor: '#fee2e2',
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    typeTextActive: {
        color: '#000',
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddTransactionModal;
