import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DueDate } from './DueDate';

// Theme colors matching routines.tsx and auth pages
const themes = {
  light: {
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#2563EB',
    success: '#16A34A',
    successBg: '#DCFCE7',
    error: '#DC2626',
    completedText: '#9CA3AF',
    transactionBg: '#ECFDF5',
    transactionText: '#059669',
  },
  dark: {
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    primary: '#3B82F6',
    success: '#22C55E',
    successBg: '#14532D',
    error: '#EF4444',
    completedText: '#6B7280',
    transactionBg: '#14532D',
    transactionText: '#22C55E',
  },
};

interface Task {
  id: number;
  task_title: string;
  task_details?: string;
  due_date?: string;
  status: boolean;
  transaction_id?: number;
  transaction_status?: string;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onPress: (task: Task) => void;
  loading?: boolean;
  // Selection props
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: number) => void;
}

export function TaskItem({ 
  task, 
  onToggleComplete, 
  onDelete, 
  onEdit, 
  onPress, 
  loading,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TaskItemProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];

  const handlePress = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(task.id);
    } else {
      onPress(task);
    }
  };

  const handleLongPress = () => {
    if (onToggleSelect) {
      onToggleSelect(task.id);
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        task.status && styles.completedContainer,
        isSelected && [styles.selectedContainer, { backgroundColor: colorScheme === 'dark' ? '#1E3A5F' : '#EFF6FF' }],
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={loading}
    >
      {/* Selection checkbox (shown in selection mode) */}
      {selectionMode && (
        <Pressable
          style={styles.selectionCheckButton}
          onPress={() => onToggleSelect?.(task.id)}
          disabled={loading}
        >
          <View
            style={[
              styles.selectionCheckbox,
              { borderColor: colors.primary },
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
        </Pressable>
      )}

      {/* Complete checkbox (always shown) */}
      <Pressable
        style={styles.checkButton}
        onPress={() => onToggleComplete(task)}
        disabled={loading}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.primary },
            task.status && [styles.checkboxCompleted, { backgroundColor: colors.success, borderColor: colors.success }],
            loading && { borderColor: colors.primary, backgroundColor: 'transparent' },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : task.status ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : null}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            task.status && [styles.titleCompleted, { color: colors.completedText }],
          ]}
          numberOfLines={2}
        >
          {task.task_title}
        </Text>
        
        <View style={styles.metaRow}>
          {task.due_date && (
            <DueDate dueDate={task.due_date} isCompleted={task.status} />
          )}

          {task.transaction_id && (
            <View style={[styles.transactionBadge, { backgroundColor: colors.transactionBg }]}>
              <Ionicons name="cash-outline" size={12} color={colors.transactionText} />
              <Text style={[styles.transactionText, { color: colors.transactionText }]}>
                {task.transaction_status || 'Transaction'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => onEdit(task)}
          disabled={loading}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(task.id)}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  completedContainer: {
    opacity: 0.7,
  },
  selectedContainer: {
    // Background color set inline
  },
  selectionCheckButton: {
    marginRight: 8,
  },
  selectionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {},
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  transactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  transactionText: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
});
