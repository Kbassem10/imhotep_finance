import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function NetWorthDetailsScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Net Worth Details' }} />
            <View style={styles.container}>
                <Text style={styles.text}>Net Worth Details - Coming Soon</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
});
