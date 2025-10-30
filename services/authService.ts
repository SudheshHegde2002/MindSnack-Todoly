import * as SecureStore from 'expo-secure-store';
import { offlineUserService } from './offlineUserService';
import { localDb } from './database';

class AuthService {

  async performSignOut(): Promise<void> {
    try {
      console.log(' Starting sign out process...');

      // Clear all Clerk tokens from SecureStore
      // This is the key to making offline sign-out work
      await this.clearClerkTokens();

      // Clear the offline user ID
      await offlineUserService.clearUserId();

      // IMPORTANT: Clear all local SQLite data
      // This prevents the next user from seeing this user's data
      localDb.clearAllUserData();

      console.log('Sign out completed successfully');
    } catch (error) {
      console.error(' Error during sign out:', error);
      // Even if there's an error, we still want to clear what we can
      // This ensures the user can sign out even if something fails
    }
  }

  /**
   * Clear all Clerk authentication tokens from SecureStore
   */
  private async clearClerkTokens(): Promise<void> {
    try {
      // Common Clerk token keys
      const clerkTokenKeys = [
        '__clerk_client_jwt',
        '__clerk_session_token', 
        '__clerk_refresh_token',
        '__clerk_client_uat',
        '__clerk_db_jwt',
        // Add any other Clerk-related keys
      ];

      for (const key of clerkTokenKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(` Cleared token: ${key}`);
        } catch (error) {
          // Key might not exist, that's okay
          console.log(` Could not clear ${key}:`, error);
        }
      }

      // Also try to delete any key that starts with '__clerk'
      // Note: SecureStore doesn't have a way to list all keys,
      // so we clear the known ones above
      
      console.log(' Clerk tokens cleared');
    } catch (error) {
      console.error(' Error clearing Clerk tokens:', error);
    }
  }
}

export const authService = new AuthService();

