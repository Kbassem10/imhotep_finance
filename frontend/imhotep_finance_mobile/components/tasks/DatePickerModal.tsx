import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme colors
const themes = {
  light: {
    background: '#FFFFFF',
    surface: '#F3F4F6',
    surfaceHover: '#E5E7EB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#4B5563',
    border: '#D1D5DB',
    borderLight: '#E5E7EB',
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    primaryMuted: '#C7D2FE',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    background: '#1F2937',
    surface: '#374151',
    surfaceHover: '#4B5563',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#D1D5DB',
    border: '#4B5563',
    borderLight: '#374151',
    primary: '#818CF8',
    primaryLight: '#312E81',
    primaryMuted: '#4338CA',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
  minimumDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePickerModal({
  visible,
  selectedDate,
  onClose,
  onSelect,
  minimumDate,
}: DatePickerModalProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setSelected(date);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    } else {
      setSelected(null);
      setCurrentMonth(today.getMonth());
      setCurrentYear(today.getFullYear());
    }
  }, [selectedDate, visible]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateDisabled = (day: number) => {
    if (!minimumDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date < minimumDate;
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isTomorrow = (day: number) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      day === tomorrow.getDate() &&
      currentMonth === tomorrow.getMonth() &&
      currentYear === tomorrow.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      day === selected.getDate() &&
      currentMonth === selected.getMonth() &&
      currentYear === selected.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    const date = new Date(currentYear, currentMonth, day);
    setSelected(date);
  };

  const handleConfirm = () => {
    if (selected) {
      // Use local date values to avoid timezone shift from toISOString()
      const year = selected.getFullYear();
      const month = String(selected.getMonth() + 1).padStart(2, '0');
      const day = String(selected.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      onSelect(formatted);
    }
    onClose();
  };

  const handleQuickSelect = (type: 'today' | 'tomorrow' | 'nextWeek') => {
    const date = new Date(today);
    if (type === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (type === 'nextWeek') {
      date.setDate(date.getDate() + 7);
    }
    setSelected(date);
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  const days = generateCalendarDays();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Select Date</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Select */}
          <View style={styles.quickSelect}>
            <Pressable
              style={[
                styles.quickButton, 
                { backgroundColor: colors.surface },
                isToday(today.getDate()) && [styles.quickButtonActive, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]
              ]}
              onPress={() => handleQuickSelect('today')}
            >
              <Text style={[styles.quickButtonText, { color: colors.textMuted }]}>Today</Text>
            </Pressable>
            <Pressable
              style={[styles.quickButton, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickSelect('tomorrow')}
            >
              <Text style={[styles.quickButtonText, { color: colors.textMuted }]}>Tomorrow</Text>
            </Pressable>
            <Pressable
              style={[styles.quickButton, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickSelect('nextWeek')}
            >
              <Text style={[styles.quickButtonText, { color: colors.textMuted }]}>Next Week</Text>
            </Pressable>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={handlePrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={[styles.dayHeader, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null ? (
                  <Pressable
                    style={[
                      styles.dayButton,
                      isToday(day) && [styles.todayButton, { backgroundColor: colors.surface }],
                      isSelected(day) && [styles.selectedButton, { backgroundColor: colors.primary }],
                      isDateDisabled(day) && styles.disabledButton,
                    ]}
                    onPress={() => handleSelectDay(day)}
                    disabled={isDateDisabled(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isToday(day) && [styles.todayText, { color: colors.primary }],
                        isSelected(day) && styles.selectedText,
                        isDateDisabled(day) && [styles.disabledText, { color: colors.textSecondary }],
                      ]}
                    >
                      {day}
                    </Text>
                    {isToday(day) && !isSelected(day) && (
                      <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                    )}
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.borderLight }]}>
            <Pressable 
              style={[styles.clearButton, { borderColor: colors.border }]} 
              onPress={handleClear}
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>Clear</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton, 
                { backgroundColor: colors.primary },
                !selected && [styles.confirmButtonDisabled, { backgroundColor: colors.primaryMuted }]
              ]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.confirmButtonText}>
                {selected ? `Select ${selected.toLocaleDateString()}` : 'Select a date'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  quickSelect: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonActive: {
    borderWidth: 1,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  todayButton: {},
  selectedButton: {},
  disabledButton: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
  },
  todayText: {
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {},
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {},
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
