import { db } from '../db';
import { userPreferencesTable, usersTable } from '../db/schema';
import { type UpdatePreferencesInput, type UserPreferences } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateUserPreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
  try {
    // First verify that the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // Check if user preferences already exist
    const existingPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, input.user_id))
      .execute();

    let result;

    if (existingPreferences.length === 0) {
      // Create new preferences record
      const insertResult = await db.insert(userPreferencesTable)
        .values({
          user_id: input.user_id,
          theme: input.theme || 'light',
          favorite_crops: JSON.stringify(input.favorite_crops || [])
        })
        .returning()
        .execute();

      result = insertResult[0];
    } else {
      // Update existing preferences
      const updateData: any = {
        updated_at: new Date()
      };

      if (input.theme !== undefined) {
        updateData.theme = input.theme;
      }

      if (input.favorite_crops !== undefined) {
        updateData.favorite_crops = JSON.stringify(input.favorite_crops);
      }

      const updateResult = await db.update(userPreferencesTable)
        .set(updateData)
        .where(eq(userPreferencesTable.user_id, input.user_id))
        .returning()
        .execute();

      result = updateResult[0];
    }

    // Convert the favorite_crops JSON string back to array
    return {
      ...result,
      favorite_crops: JSON.parse(result.favorite_crops || '[]')
    };
  } catch (error) {
    console.error('Update user preferences failed:', error);
    throw error;
  }
}