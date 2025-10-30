import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = '__todoly_user_id';
const EMAIL_KEY = '__todoly_user_email';

class OfflineUserService {

  async storeUserId(userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_ID_KEY, userId);
      console.log(' Stored user ID locally:', userId);
    } catch (error) {
      console.error(' Error storing user ID:', error);
    }
  }


  async getStoredUserId(): Promise<string | null> {
    try {
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      return userId;
    } catch (error) {
      console.error('Error getting stored user ID:', error);
      return null;
    }
  }


  async clearUserId(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      console.log(' Cleared stored user ID');
    } catch (error) {
      console.error(' Error clearing user ID:', error);
    }
  }

  async storeEmail(email: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(EMAIL_KEY, email);
      console.log(' Stored email locally:', email);
    } catch (error) {
      console.error(' Error storing email:', error);
    }
  }

  async getStoredEmail(): Promise<string | null> {
    try {
      const email = await SecureStore.getItemAsync(EMAIL_KEY);
      return email;
    } catch (error) {
      console.error(' Error getting stored email:', error);
      return null;
    }
  }

  async clearEmail(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(EMAIL_KEY);
      console.log(' Cleared stored email');
    } catch (error) {
      console.error(' Error clearing email:', error);
    }
  }
}

export const offlineUserService = new OfflineUserService();

