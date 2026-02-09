import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TaskModalProvider } from '@/contexts/TaskModalContext';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import UpdateChecker from '@/components/UpdateChecker';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <TaskModalProvider>
          <RootLayoutNav />
          <UpdateChecker />
          <StatusBar style="auto" />
        </TaskModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
