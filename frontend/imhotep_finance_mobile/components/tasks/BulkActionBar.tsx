import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DatePickerModal } from './DatePickerModal';

// Theme colors matching the app
const themes = {
  light: {
    background: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#16A34A',
    successBg: '#DCFCE7',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    warning: '#D97706',
    warningBg: '#FEF3C7',
  },
  dark: {
    background: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    success: '#22C55E',
    successBg: '#14532D',
    error: '#EF4444',
    errorBg: '#450A0A',
    warning: '#F59E0B',
    warningBg: '#451A03',
  },
};

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  loading: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onChangeDueDate: (date: string) => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  loading,
  onSelectAll,
  onClearSelection,
  onDelete,
  onToggleComplete,
  onChangeDueDate,
}: BulkActionBarProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const allSelected = selectedCount === totalCount && totalCount > 0;
  
  const handleDateSelect = (date: string) => {
    setShowDatePicker(false);
    onChangeDueDate(date);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {/* Selection info */}
        <View style={styles.selectionInfo}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={allSelected ? onClearSelection : onSelectAll}
            disabled={loading}
          >
            <View style={[
              styles.selectAllCheckbox,
              { borderColor: colors.primary },
              allSelected && { backgroundColor: colors.primary }
            ]}>
              {allSelected && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.selectionText, { color: colors.text }]}>
            {selectedCount} selected
          </Text>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSelection}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {/* Toggle Complete */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.successBg }]}
                onPress={onToggleComplete}
              >
                <Ionicons name="checkmark-done" size={20} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>Done</Text>
              </TouchableOpacity>

              {/* Change Date */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.warningBg }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={colors.warning} />
                <Text style={[styles.actionText, { color: colors.warning }]}>Date</Text>
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.errorBg }]}
                onPress={onDelete}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={new Date().toISOString().split('T')[0]}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        minimumDate={new Date()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllButton: {
    padding: 4,
  },
  selectAllCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
