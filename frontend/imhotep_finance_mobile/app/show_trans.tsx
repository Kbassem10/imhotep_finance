import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function TransactionsScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Transactions' }} />
            <View style={styles.container}>
                <Text style={styles.text}>Transactions Screen - Coming Soon</Text>
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
