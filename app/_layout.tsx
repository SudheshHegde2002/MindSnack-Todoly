import { ClerkProvider, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../services/database';
import { offlineUserService } from '../services/offlineUserService';

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },
};

const publishableKey = 'pk_test_bm92ZWwtYnJlYW0tNjQuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key');
}

// Inner component to handle user ID storage
function UserIdSyncComponent() {
  const { user } = useUser();
  
  useEffect(() => {
    // Store user ID whenever it becomes available (safety net for auth flows)
    if (user?.id) {
      offlineUserService.storeUserId(user.id).then(() => {
        console.log(' [Safety Net] Stored user ID from useUser hook:', user.id);
      });
      
      // Also store email if available
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        offlineUserService.storeEmail(email).then(() => {
          console.log(' [Safety Net] Stored email from useUser hook:', email);
        });
      }
    }
  }, [user?.id, user?.primaryEmailAddress?.emailAddress]);
  
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <UserIdSyncComponent />
      <Slot />
    </ClerkProvider>
  );
}
