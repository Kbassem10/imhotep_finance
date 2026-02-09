import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="checkmark-done" size={40} color="#7C3AED" />
            </View>
          </View>
      
          <Text style={styles.title}>Imhotep Finance</Text>
          <Text style={styles.subtitle}>Manage Your Daily Finances Efficiently</Text>
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.loadingText}>Imhotep Finance is starting up...</Text>

          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotPurple]} />
            <View style={[styles.dot, styles.dotIndigo]} />
            <View style={[styles.dot, styles.dotBlue]} />
          </View>
        </View>
      </View>
    );
  }

  // Redirect authenticated users to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Show auth screens for non-authenticated users
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="email-verify" />
      <Stack.Screen name="email-change-verification" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#7C3AED',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPurple: {
    backgroundColor: '#A855F7',
  },
  dotIndigo: {
    backgroundColor: '#6366F1',
  },
  dotBlue: {
    backgroundColor: '#3B82F6',
  },
});