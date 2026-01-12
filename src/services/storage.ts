/**
 * Storage service for local data persistence
 * Wrapper around AsyncStorage with typed interface
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_SESSION: '@app:auth_session',
  TENANT_CONTEXT: '@app:tenant_context',
  USER_PREFERENCES: '@app:user_preferences',
} as const;

/**
 * Type-safe storage operations
 */
export class StorageService {
  /**
   * Get value by key
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error(`Error reading storage key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value by key
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing storage key ${key}:`, error);
    }
  }

  /**
   * Remove value by key
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage key ${key}:`, error);
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export { STORAGE_KEYS };
