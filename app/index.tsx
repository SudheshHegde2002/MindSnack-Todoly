import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasLocalAuth, setHasLocalAuth] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Check for local auth tokens (offline-first approach)
  useEffect(() => {
    const checkLocalAuth = async () => {
      try {
        // Check if user has Clerk tokens in SecureStore
        const sessionToken = await SecureStore.getItemAsync('__clerk_client_jwt');
        const hasAuth = sessionToken !== null;
        setHasLocalAuth(hasAuth);
      } catch (error) {
        console.error('Error checking local auth:', error);
        setHasLocalAuth(false);
      }
    };

    checkLocalAuth();
  }, []);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // OFFLINE-FIRST LOGIC:
  // If we have local auth tokens, let the user in immediately
  // Don't wait for Clerk to verify online
  if (hasLocalAuth === true) {
    return <Redirect href="/(main)" />;
  }

  // If we've checked and there's no local auth, redirect to welcome
  if (hasLocalAuth === false) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Still checking local auth (should be very fast)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}

