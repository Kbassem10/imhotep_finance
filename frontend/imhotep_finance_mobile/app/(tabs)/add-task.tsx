import { Redirect } from 'expo-router';

// This screen is just a placeholder for the tab bar button
// The actual add task functionality is handled by the modal in _layout.tsx
export default function AddTaskScreen() {
  return <Redirect href="/(tabs)" />;
}
