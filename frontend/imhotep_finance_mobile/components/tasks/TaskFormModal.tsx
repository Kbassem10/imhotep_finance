import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from './DatePickerModal';

// Theme colors
const themes = {
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#D1D5DB',
    borderLight: '#E5E7EB',
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    error: '#EF4444',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    background: '#1F2937',
    surface: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#4B5563',
    borderLight: '#374151',
    primary: '#818CF8',
    primaryLight: '#312E81',
    error: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

interface Task {
  id: number;
  task_title: string;
  task_details?: string;
  due_date?: string;
  status: boolean;
}

interface TaskFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  task?: Task | null;
  onClose: () => void;
  onSubmit: (task: { task_title: string; task_details: string; due_date: string }) => Promise<void>;
  loading?: boolean;
  minLoadingTime?: number; // Minimum time to show loading state (ms)
}

// Minimum delay helper to ensure loading state is visible
const withMinDelay = async <T,>(promise: Promise<T>, minMs: number): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, minMs)),
  ]);
  return result;
};

export function TaskFormModal({
  visible,
  mode,
  task,
  onClose,
  onSubmit,
  loading: externalLoading,
  minLoadingTime = 500,
}: TaskFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  
  // Use internal loading state if external is not provided
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Pre-fill form when editing
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && task) {
        setTitle(task.task_title || '');
        setDescription(task.task_details || '');
        // Slice date to YYYY-MM-DD format (first 10 chars)
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
      }
      setError('');
    }
  }, [visible, mode, task]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError('');
    setInternalLoading(true);
    
    try {
      // Use minimum delay to ensure loading state is visible for better UX
      await withMinDelay(
        onSubmit({
          task_title: title.trim(),
          task_details: description.trim(),
          due_date: dueDate,
        }),
        minLoadingTime
      );
      // Reset form and close only on success
      setTitle('');
      setDescription('');
      setDueDate('');
      onClose();
    } catch (err) {
      // Don't close on error, show error message
      setError(mode === 'edit' ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setError('');
    onClose();
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isEditMode = mode === 'edit';
  const headerTitle = isEditMode ? 'Edit Task' : 'Add New Task';
  const submitText = isEditMode ? 'Update Task' : 'Create Task';
  const submitIcon = isEditMode ? 'checkmark' : 'add';

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Write project proposal"
                  placeholderTextColor={colors.placeholder}
                  autoFocus={mode === 'add'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details to help you remember"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Due Date (optional)</Text>
                <Pressable
                  style={[styles.dateButton, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={dueDate ? colors.primary : colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.dateButtonText,
                      { color: colors.text },
                      !dueDate && { color: colors.placeholder },
                    ]}
                  >
                    {formatDateDisplay(dueDate)}
                  </Text>
                  {dueDate ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setDueDate('');
                      }}
                      style={styles.clearDateButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.placeholder} />
                    </Pressable>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                  )}
                </Pressable>
              </View>

              {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

              <View style={styles.actions}>
                <Pressable 
                  style={[styles.cancelButton, { borderColor: colors.border }]} 
                  onPress={handleClose}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name={submitIcon} size={20} color="#fff" />
                      <Text style={styles.submitText}>{submitText}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        selectedDate={dueDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => setDueDate(date)}
      />
    </>
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
    maxHeight: '90%',
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  clearDateButton: {
    padding: 2,
  },
  error: {
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
