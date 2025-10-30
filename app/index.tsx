import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineUserService } from '../services/offlineUserService';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasLocalAuth, setHasLocalAuth] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Check for local auth using stored user ID (offline-first approach)
  useEffect(() => {
    const checkLocalAuth = async () => {
      try {
        // Check if we have a stored user ID (more reliable than checking Clerk tokens)
        const storedUserId = await offlineUserService.getStoredUserId();
        const hasAuth = storedUserId !== null;
        console.log(' Auth check - Stored user ID:', storedUserId ? 'Found' : 'Not found');
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
  // If we have a stored user ID, the user is logged in
  // Let them in immediately without waiting for Clerk
  if (hasLocalAuth === true) {
    console.log(' User is authenticated (has stored user ID) - redirecting to main');
    return <Redirect href="/(main)" />;
  }

  // If we've checked and there's no stored user ID, user needs to log in
  if (hasLocalAuth === false) {
    console.log(' User is not authenticated - redirecting to welcome');
    return <Redirect href="/(auth)/welcome" />;
  }

  // Still checking local auth (should be very fast)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}

