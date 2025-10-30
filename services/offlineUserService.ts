import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = '__todoly_user_id';

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
}

export const offlineUserService = new OfflineUserService();

