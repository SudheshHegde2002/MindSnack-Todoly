import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Slot } from 'expo-router';

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

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
