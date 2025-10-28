import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { styles } from './styles/homeStyles';

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

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/welcome');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Todoly</Text>
            {user?.primaryEmailAddress?.emailAddress && (
                <Text style={styles.emailText}>
                    {user.primaryEmailAddress.emailAddress}
                </Text>
            )}
            <Button title="Sign Out" onPress={handleSignOut} color="#6366F1" />
        </View>
    );
}
