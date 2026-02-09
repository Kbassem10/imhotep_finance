import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DueDate } from './DueDate';

// Theme colors matching routines.tsx and auth pages
const themes = {
  light: {
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#16A34A',
    successBg: '#DCFCE7',
    successBorder: '#22C55E',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    warningBorder: '#F59E0B',
    error: '#DC2626',
    errorBg: '#FEE2E2',
    errorBorder: '#EF4444',
    transactionBg: '#ECFDF5',
    transactionText: '#059669',
    description: '#4B5563',
  },
  dark: {
    overlay: 'rgba(0, 0, 0, 0.7)',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    border: '#374151',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    success: '#22C55E',
    successBg: '#14532D',
    successBorder: '#22C55E',
    warning: '#FBBF24',
    warningBg: '#78350F',
    warningBorder: '#FBBF24',
    error: '#EF4444',
    errorBg: '#450A0A',
    errorBorder: '#EF4444',
    transactionBg: '#14532D',
    transactionText: '#22C55E',
    description: '#D1D5DB',
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
  created_at?: string;
  updated_at?: string;
}

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => Promise<void>;
  onDelete: (taskId: number) => void;
  minLoadingTime?: number;
}

// Minimum delay helper to ensure loading state is visible
const withMinDelay = async <T,>(promise: Promise<T>, minMs: number): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, minMs)),
  ]);
  return result;
};

export function TaskDetailsModal({
  visible,
  task,
  onClose,
  onEdit,
  onToggleComplete,
  onDelete,
  minLoadingTime = 500,
}: TaskDetailsModalProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];
  const [completeLoading, setCompleteLoading] = useState(false);

  if (!task) return null;

  const handleToggleComplete = async () => {
    setCompleteLoading(true);
    try {
      await withMinDelay(onToggleComplete(task), minLoadingTime);
      onClose();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    } finally {
      setCompleteLoading(false);
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Task Details</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: task.status ? colors.successBg : colors.warningBg },
                ]}
              >
                <Ionicons
                  name={task.status ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={task.status ? colors.success : colors.warning}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: task.status ? colors.success : colors.warning },
                  ]}
                >
                  {task.status ? 'Completed' : 'Pending'}
                </Text>
              </View>
              {task.due_date && (
                <DueDate dueDate={task.due_date} isCompleted={task.status} />
              )}
            </View>

            {/* Title */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Title</Text>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  task.status && [styles.titleCompleted, { color: colors.textMuted }],
                ]}
              >
                {task.task_title}
              </Text>
            </View>

            {/* Description */}
            {task.task_details ? (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.description, { color: colors.description }]}>{task.task_details}</Text>
              </View>
            ) : null}

            {/* Transaction Info */}
            {task.transaction_id && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Transaction</Text>
                <View style={[styles.transactionBadge, { backgroundColor: colors.transactionBg }]}>
                  <Ionicons name="cash-outline" size={16} color={colors.transactionText} />
                  <Text style={[styles.transactionText, { color: colors.transactionText }]}>
                    {task.transaction_status || `Transaction #${task.transaction_id}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Timestamps */}
            <View style={[styles.timestampsContainer, { borderTopColor: colors.border }]}>
              {task.created_at && (
                <View style={styles.timestamp}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.timestampText, { color: colors.textMuted }]}>
                    Created: {formatDateTime(task.created_at)}
                  </Text>
                </View>
              )}
              {task.updated_at && (
                <View style={styles.timestamp}>
                  <Ionicons name="refresh-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.timestampText, { color: colors.textMuted }]}>
                    Updated: {formatDateTime(task.updated_at)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={() => {
                  onEdit(task);
                  onClose();
                }}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: task.status ? colors.warningBg : colors.successBg,
                    borderColor: task.status ? colors.warningBorder : colors.successBorder,
                  },
                  completeLoading && styles.actionButtonDisabled,
                ]}
                onPress={handleToggleComplete}
                disabled={completeLoading}
              >
                {completeLoading ? (
                  <ActivityIndicator size="small" color={task.status ? colors.warning : colors.success} />
                ) : (
                  <>
                    <Ionicons
                      name={task.status ? 'close-circle' : 'checkmark-circle'}
                      size={18}
                      color={task.status ? colors.warning : colors.success}
                    />
                    <Text style={[styles.actionButtonText, { color: task.status ? colors.warning : colors.success }]}>
                      {task.status ? 'Undo' : 'Done'}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
                onPress={() => {
                  onDelete(task.id);
                  onClose();
                }}
              >
                <Ionicons name="trash" size={18} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
              </Pressable>
            </View>
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
    maxHeight: '85%',
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
  content: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  transactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  transactionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestampsContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 8,
  },
  timestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 13,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
});
