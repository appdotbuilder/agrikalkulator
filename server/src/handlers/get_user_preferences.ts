import { db } from '../db';
import { userPreferencesTable } from '../db/schema';
import { type UserPreferences } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserPreferences = async (userId: number): Promise<UserPreferences> => {
  try {
    // Query user preferences from database
    const result = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, userId))
      .execute();

    if (result.length === 0) {
      throw new Error(`User preferences not found for user ID: ${userId}`);
    }

    const preferences = result[0];
    
    // Parse the favorite_crops JSON string back to array
    const favoriteCrops = preferences.favorite_crops 
      ? JSON.parse(preferences.favorite_crops) 
      : [];

    return {
      ...preferences,
      favorite_crops: favoriteCrops
    };
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
};