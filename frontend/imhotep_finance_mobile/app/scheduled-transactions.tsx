import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function ScheduledTransactionsScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Scheduled Transactions' }} />
            <View style={styles.container}>
                <Text style={styles.text}>Scheduled Transactions - Coming Soon</Text>
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
