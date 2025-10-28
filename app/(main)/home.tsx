import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, Button, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { isSignedIn, signOut, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FAFAFA' }}>
      <Text style={{ fontSize: 32, fontWeight: '700', marginBottom: 16, color: '#1A1A1A' }}>Welcome to Todoly</Text>
      {user?.primaryEmailAddress?.emailAddress && (
        <Text style={{ marginBottom: 32, color: '#6B7280', fontSize: 16 }}>
          {user.primaryEmailAddress.emailAddress}
        </Text>
      )}
      <Button title="Sign Out" onPress={handleSignOut} color="#6366F1" />
    </View>
  );
}
