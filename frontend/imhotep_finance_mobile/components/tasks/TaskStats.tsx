import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Theme colors matching routines.tsx and auth pages
const themes = {
  light: {
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#16A34A',
    successBg: '#DCFCE7',
    warning: '#D97706',
    warningBg: '#FEF3C7',
  },
  dark: {
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    success: '#22C55E',
    successBg: '#14532D',
    warning: '#FBBF24',
    warningBg: '#78350F',
  },
};

interface TaskStatsProps {
  totalTasks: number;
  completedCount: number;
  pendingCount: number;
}

export function TaskStats({ totalTasks, completedCount, pendingCount }: TaskStatsProps) {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={[styles.statCard, { backgroundColor: colors.card }, styles.totalCard, { borderLeftColor: colors.primary }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalTasks}</Text>
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }, styles.completedCard, { borderLeftColor: colors.success }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.successBg }]}>
          <Ionicons name="checkmark-done-outline" size={20} color={colors.success} />
        </View>
        <View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}</Text>
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }, styles.pendingCard, { borderLeftColor: colors.warning }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.warningBg }]}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
        </View>
        <View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{pendingCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
    borderLeftWidth: 3,
  },
  totalCard: {},
  completedCard: {},
  pendingCard: {},
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
