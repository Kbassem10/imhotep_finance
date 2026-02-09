import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/constants/api';
import axios from 'axios';

// Theme colors
const themes = {
  light: {
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#16A34A',
    successBg: '#DCFCE7',
    successBorder: '#86EFAC',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    inactive: '#9CA3AF',
    inactiveBg: '#F3F4F6',
    inputBg: '#FFFFFF',
    placeholder: '#9CA3AF',
    weekly: '#8B5CF6',
    weeklyBg: '#EDE9FE',
    monthly: '#0891B2',
    monthlyBg: '#CFFAFE',
    yearly: '#EA580C',
    yearlyBg: '#FFEDD5',
  },
  dark: {
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    success: '#22C55E',
    successBg: '#14532D',
    successBorder: '#166534',
    error: '#EF4444',
    errorBg: '#450A0A',
    inactive: '#6B7280',
    inactiveBg: '#374151',
    inputBg: '#374151',
    placeholder: '#6B7280',
    weekly: '#A78BFA',
    weeklyBg: '#2E1065',
    monthly: '#22D3EE',
    monthlyBg: '#164E63',
    yearly: '#FB923C',
    yearlyBg: '#431407',
  },
};

interface Routine {
  id: number;
  routines_title: string;
  routines_dates: string[];
  routine_type: 'weekly' | 'monthly' | 'yearly';
  status: boolean;
  created_by: number;
}

type RoutineType = 'weekly' | 'monthly' | 'yearly';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ALL_MONTHLY_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function RoutinesScreen() {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];
  const { user, token } = useAuth();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoutines, setTotalRoutines] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [routineType, setRoutineType] = useState<RoutineType>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [yearlyInput, setYearlyInput] = useState('');
  const [yearlyError, setYearlyError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchRoutines = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`api/routines/?page=${pageNum}`);
      const data = response.data;
      const newRoutines = data.user_routines || [];

      setRoutines(append ? [...routines, ...newRoutines] : newRoutines);
      setPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.num_pages || 1);
      setTotalRoutines(data.pagination?.total || 0);
      
      // Calculate counts
      const active = newRoutines.filter((r: Routine) => r.status).length;
      setActiveCount(append ? activeCount + active : active);
      setInactiveCount(append ? inactiveCount + (newRoutines.length - active) : newRoutines.length - active);
    } catch (error) {
      console.error('Failed to fetch routines:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, routines, activeCount, inactiveCount]);

  useEffect(() => {
    fetchRoutines(1);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutines(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchRoutines(page + 1, true);
    }
  };

  // Form helpers
  const resetForm = () => {
    setTitle('');
    setRoutineType('weekly');
    setSelectedDays([]);
    setYearlyInput('');
    setYearlyError('');
    setFormError('');
    setEditingRoutine(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setTitle(routine.routines_title);
    setRoutineType(routine.routine_type);
    setSelectedDays(routine.routines_dates);
    if (routine.routine_type === 'yearly') {
      setYearlyInput(routine.routines_dates.join(', '));
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleQuickSelect = (type: 'all' | 'weekdays' | 'weekends' | 'none') => {
    if (type === 'all') setSelectedDays([...ALL_DAYS]);
    else if (type === 'weekdays') setSelectedDays(ALL_DAYS.slice(0, 5));
    else if (type === 'weekends') setSelectedDays(ALL_DAYS.slice(5));
    else setSelectedDays([]);
  };

  const handleYearlyChange = (value: string) => {
    setYearlyInput(value);
    setYearlyError('');

    if (!value.trim()) {
      setSelectedDays([]);
      return;
    }

    const parts = value.split(',').map(s => s.trim()).filter(s => s);
    const validDates: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!/^\d{1,2}-\d{1,2}$/.test(part)) {
        errors.push(`"${part}" invalid format`);
        continue;
      }

      const [monthStr, dayStr] = part.split('-');
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      if (isNaN(month) || month < 1 || month > 12) {
        errors.push(`"${part}" invalid month`);
        continue;
      }

      let maxDay: number;
      if ([1, 3, 5, 7, 8, 10, 12].includes(month)) maxDay = 31;
      else if ([4, 6, 9, 11].includes(month)) maxDay = 30;
      else maxDay = 29;

      if (isNaN(day) || day < 1 || day > maxDay) {
        errors.push(`"${part}" invalid day`);
        continue;
      }

      const paddedMonth = month.toString().padStart(2, '0');
      const paddedDay = day.toString().padStart(2, '0');
      validDates.push(`${paddedMonth}-${paddedDay}`);
    }

    if (errors.length > 0) {
      setYearlyError(errors.join(', '));
    }

    setSelectedDays(validDates);
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!title.trim()) {
      setFormError('Routine title is required');
      return;
    }

    if (selectedDays.length === 0) {
      setFormError('At least one date must be selected');
      return;
    }

    if (routineType === 'yearly' && yearlyError) {
      setFormError('Please fix date format errors');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        routines_title: title,
        routine_type: routineType,
        routines_dates: selectedDays,
      };

      if (editingRoutine) {
        await api.post(`api/update_routine/${editingRoutine.id}/`, payload);
      } else {
        await api.post('api/add_routine/', payload);
      }

      closeModal();
      fetchRoutines(1);
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Failed to save routine');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (routine: Routine) => {
    try {
      setActionLoading(routine.id);
      await api.post(`api/update_routine_status/${routine.id}/`);
      fetchRoutines(1);
    } catch (error) {
      console.error('Failed to toggle routine status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.routines_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(routine.id);
              await api.post(`api/delete_routine/${routine.id}/`);
              fetchRoutines(1);
            } catch (error) {
              console.error('Failed to delete routine:', error);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleApplyRoutines = async () => {
    try {
      setApplyLoading(true);
      await api.post('api/apply_routines/');
      Alert.alert('Success', 'Routines applied successfully! Tasks have been created for matching routines.');
    } catch (error) {
      console.error('Failed to apply routines:', error);
      Alert.alert('Error', 'Failed to apply routines. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const getTypeColor = (type: RoutineType) => {
    switch (type) {
      case 'weekly': return { bg: colors.weeklyBg, text: colors.weekly };
      case 'monthly': return { bg: colors.monthlyBg, text: colors.monthly };
      case 'yearly': return { bg: colors.yearlyBg, text: colors.yearly };
    }
  };

  const formatDates = (routine: Routine) => {
    const dates = routine.routines_dates;
    if (routine.routine_type === 'weekly') {
      return dates.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
    } else if (routine.routine_type === 'monthly') {
      return dates.slice(0, 5).join(', ') + (dates.length > 5 ? ` +${dates.length - 5}` : '');
    } else {
      return dates.slice(0, 3).join(', ') + (dates.length > 3 ? ` +${dates.length - 3}` : '');
    }
  };

  const renderRoutine = ({ item }: { item: Routine }) => {
    const typeColor = getTypeColor(item.routine_type);
    const isLoading = actionLoading === item.id;

    return (
      <TouchableOpacity
        style={[styles.routineCard, { backgroundColor: colors.card }]}
        onPress={() => openEditModal(item)}
        disabled={isLoading}
      >
        <View style={styles.routineHeader}>
          <View style={styles.routineInfo}>
            <Text style={[styles.routineTitle, { color: colors.text }]} numberOfLines={1}>
              {item.routines_title}
            </Text>
            <View style={styles.routineMeta}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
                <Text style={[styles.typeText, { color: typeColor.text }]}>
                  {item.routine_type}
                </Text>
              </View>
              <Text style={[styles.datesText, { color: colors.textSecondary }]}>
                {formatDates(item)}
              </Text>
            </View>
          </View>

          <View style={styles.routineActions}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    { backgroundColor: item.status ? colors.successBg : colors.inactiveBg },
                  ]}
                  onPress={() => handleToggleStatus(item)}
                >
                  <Ionicons
                    name={item.status ? 'checkmark-circle' : 'pause-circle'}
                    size={20}
                    color={item.status ? colors.success : colors.inactive}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.errorBg }]}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.primary }]}>{totalRoutines}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.success }]}>{activeCount}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: colors.inactive }]}>{inactiveCount}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inactive</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="repeat-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Routines Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Create routines to automatically generate recurring tasks
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add Routine</Text>
      </TouchableOpacity>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingRoutine ? 'Edit Routine' : 'Add Routine'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Routine Title *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Enter routine title"
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Routine Type Tabs */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Routine Type *</Text>
              <View style={[styles.typeTabs, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                {(['weekly', 'monthly', 'yearly'] as RoutineType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeTab,
                      routineType === type && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      setRoutineType(type);
                      setSelectedDays([]);
                      setYearlyInput('');
                      setYearlyError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.typeTabText,
                        { color: routineType === type ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                {routineType === 'weekly'
                  ? 'Days of the Week'
                  : routineType === 'monthly'
                  ? 'Days of the Month'
                  : 'Specific Dates (MM-DD)'}
              </Text>

              {routineType === 'weekly' && (
                <>
                  <View style={styles.quickSelectRow}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'weekdays', label: 'Weekdays' },
                      { key: 'weekends', label: 'Weekends' },
                      { key: 'none', label: 'Clear' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.quickSelectButton, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                        onPress={() => handleQuickSelect(item.key as any)}
                      >
                        <Text style={[styles.quickSelectText, { color: colors.textSecondary }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.daysGrid}>
                    {ALL_DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          { backgroundColor: colors.inputBg, borderColor: colors.border },
                          selectedDays.includes(day) && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => handleDayToggle(day)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: selectedDays.includes(day) ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {routineType === 'monthly' && (
                <View style={styles.monthlyGrid}>
                  {ALL_MONTHLY_DAYS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.monthDayButton,
                        { backgroundColor: colors.inputBg, borderColor: colors.border },
                        selectedDays.includes(day) && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleDayToggle(day)}
                    >
                      <Text
                        style={[
                          styles.monthDayText,
                          { color: selectedDays.includes(day) ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {routineType === 'yearly' && (
                <>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.inputBg, borderColor: yearlyError ? colors.error : colors.border, color: colors.text },
                    ]}
                    placeholder="e.g., 12-25, 01-01, 06-15"
                    placeholderTextColor={colors.placeholder}
                    value={yearlyInput}
                    onChangeText={handleYearlyChange}
                  />
                  {yearlyError ? (
                    <Text style={[styles.errorText, { color: colors.error }]}>{yearlyError}</Text>
                  ) : (
                    <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                      Format: MM-DD (e.g., 12-25 for Christmas)
                    </Text>
                  )}
                </>
              )}
            </View>

            {formError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
                <Text style={[styles.errorBoxText, { color: colors.error }]}>{formError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={closeModal}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingRoutine ? 'Update' : 'Add'} Routine
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Routines</Text>
          {user?.username && (
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Recurring task templates
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: colors.success }]} 
            onPress={handleApplyRoutines}
            disabled={applyLoading}
          >
            {applyLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Apply</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {renderStats()}

      {loading && routines.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={routines}
          renderItem={renderRoutine}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            loading && routines.length > 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  greeting: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  routineCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
    marginRight: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  datesText: {
    fontSize: 12,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeTabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthDayButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
