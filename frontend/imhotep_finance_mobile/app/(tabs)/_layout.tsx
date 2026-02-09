import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme colors for the layout
const themes = {
  light: {
    tabBar: '#FFFFFF',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
  },
  dark: {
    tabBar: '#1F2937',
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
  const { isAuthenticated, loading } = useAuth();
  const colors = themes[colorScheme ?? 'light'];

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
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scheduled"
        options={{
          title: 'Scheduled',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="repeat" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
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
});
