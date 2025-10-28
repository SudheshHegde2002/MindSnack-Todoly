import * as SecureStore from 'expo-secure-store';

export async function clearClerkCache() {
  try {
    await SecureStore.deleteItemAsync('clerk_token');
    console.log('Clerk cache cleared successfully');
  } catch (error) {
    console.error('Error clearing Clerk cache:', error);
  }
}

