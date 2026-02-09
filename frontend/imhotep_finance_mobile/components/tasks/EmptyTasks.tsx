import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Theme colors matching routines.tsx and auth pages
const themes = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    warning: '#D97706',
    warningBg: '#FEF3C7',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    warning: '#FBBF24',
    warningBg: '#78350F',
  },
};

interface EmptyTasksProps {
  onAddTask: () => void;
}

export function EmptyTasks({ onAddTask }: EmptyTasksProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.warningBg }]}>
        <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.warning} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>No tasks for today</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        You don't have any tasks scheduled for today. Enjoy your free time or create a new task!
      </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onAddTask}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.buttonText}>Add a Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
