import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DueDateProps {
  dueDate?: string;
  isCompleted: boolean;
  showIcon?: boolean;
}

type DateStatus = 'overdue' | 'today' | 'tomorrow' | 'future' | 'none';

const getDateStatus = (dueDate?: string, isCompleted?: boolean): DateStatus => {
  if (!dueDate) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() === today.getTime()) {
    return 'today';
  } else if (due.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  } else if (due < today && !isCompleted) {
    return 'overdue';
  } else {
    return 'future';
  }
};

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return iso;
  }
};

const statusConfig: Record<DateStatus, { label?: string; color: string; bgColor: string; icon: string }> = {
  overdue: {
    label: 'Overdue',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: 'alert-circle',
  },
  today: {
    label: 'Today',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    icon: 'today',
  },
  tomorrow: {
    label: 'Tomorrow',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    icon: 'calendar',
  },
  future: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'calendar-outline',
  },
  none: {
    color: '#9CA3AF',
    bgColor: '#F9FAFB',
    icon: 'calendar-outline',
  },
};

export function DueDate({ dueDate, isCompleted, showIcon = true }: DueDateProps) {
  if (!dueDate) return null;

  const status = getDateStatus(dueDate, isCompleted);
  const config = statusConfig[status];
  const displayText = config.label || formatDate(dueDate);

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      {showIcon && (
        <Ionicons
          name={config.icon as any}
          size={12}
          color={config.color}
        />
      )}
      <Text style={[styles.text, { color: config.color }]}>
        {displayText}
      </Text>
    </View>
  );
}

// Export utility function for sorting
export function isOverdue(dueDate?: string, isCompleted?: boolean): boolean {
  return getDateStatus(dueDate, isCompleted) === 'overdue';
}

export function getTaskDateStatus(dueDate?: string, isCompleted?: boolean): DateStatus {
  return getDateStatus(dueDate, isCompleted);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
