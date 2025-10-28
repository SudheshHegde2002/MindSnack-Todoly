import { useAuth, useUser } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, Button, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { isSignedIn, signOut, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Welcome to Todoly</Text>
      {user?.primaryEmailAddress?.emailAddress && (
        <Text style={{ marginBottom: 24, color: '#666' }}>
          {user.primaryEmailAddress.emailAddress}
        </Text>
      )}
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
