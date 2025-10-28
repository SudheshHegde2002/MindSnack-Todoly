import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Slot } from 'expo-router';

const tokenCache = {
  getToken: () => SecureStore.getItemAsync('clerk_token'),
  saveToken: (token: string) => SecureStore.setItemAsync('clerk_token', token),
};

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
