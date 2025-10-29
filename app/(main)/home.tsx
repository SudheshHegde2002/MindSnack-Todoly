import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { styles } from './_styles/homeStyles';

export default function HomeScreen() {
    const { isSignedIn, signOut, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href="/(auth)/welcome" />;
    }

    return <Redirect href="/(main)" />;
}
