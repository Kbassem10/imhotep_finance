import { Tabs, Redirect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { TaskFormModal } from '@/components/tasks';
import api from '@/constants/api';

// Theme colors for the layout
const themes = {
  light: {
    tabBar: '#FFFFFF',
    addButton: '#2563EB',
    addButtonShadow: '#1E40AF',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
  },
  dark: {
    tabBar: '#1F2937',
    addButton: '#3B82F6',
    addButtonShadow: '#1E3A8A',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading, token } = useAuth();
  const { onTaskAdded } = useTaskModal();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [addTaskLoading, setAddTaskLoading] = useState(false);
  const colors = themes[colorScheme ?? 'light'];

  const handleAddTask = useCallback(async (formData: { task_title: string; task_details: string; due_date: string }) => {
    setAddTaskLoading(true);
    try {
      await api.post('api/tasks/add_task/', formData);
      // Call the refresh callback if registered
      if (onTaskAdded) {
        onTaskAdded();
      }
      setShowAddTaskModal(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      throw error; // Re-throw to show error in modal
    } finally {
      setAddTaskLoading(false);
    }
  }, [onTaskAdded]);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-done" size={32} color={colors.primary} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Imhotep Finance</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Loading your workspace...</Text>

          <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        </View>
      </View>
    );
  }

  // Redirect non-authenticated users to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="all-tasks"
          options={{
            title: 'All Tasks',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet" color={color} />,
          }}
        />
        {/* Center Add Task Button */}
        <Tabs.Screen
          name="add-task"
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={[styles.addTaskButton, { backgroundColor: colors.addButton }]}>
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </View>
            ),
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setShowAddTaskModal(true)}
                style={styles.addTaskButtonContainer}
                activeOpacity={0.8}
              >
                <View style={[styles.addTaskButton, { backgroundColor: colors.addButton }]}>
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="repeat" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="next-week"
          options={{
            href: null, // Hide from tab bar but keep accessible via navigation
          }}
        />
      </Tabs>

      {/* Global Add Task Modal */}
      <TaskFormModal
        visible={showAddTaskModal}
        onClose={() => !addTaskLoading && setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        loading={addTaskLoading}
        mode="add"
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
  addTaskButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    top: -16,
  },
  addTaskButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
