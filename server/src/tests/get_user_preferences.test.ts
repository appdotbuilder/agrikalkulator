import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userPreferencesTable } from '../db/schema';
import { getUserPreferences } from '../handlers/get_user_preferences';

describe('getUserPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve user preferences with default values', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create user preferences with default values
    await db.insert(userPreferencesTable)
      .values({
        user_id: userId,
        theme: 'light',
        favorite_crops: '[]' // Empty array as JSON string
      })
      .execute();

    const result = await getUserPreferences(userId);

    expect(result.user_id).toEqual(userId);
    expect(result.theme).toEqual('light');
    expect(result.favorite_crops).toEqual([]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve user preferences with custom theme and favorite crops', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashedpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create user preferences with custom values
    await db.insert(userPreferencesTable)
      .values({
        user_id: userId,
        theme: 'dark',
        favorite_crops: '[1, 3, 5]' // Array of crop IDs as JSON string
      })
      .execute();

    const result = await getUserPreferences(userId);

    expect(result.user_id).toEqual(userId);
    expect(result.theme).toEqual('dark');
    expect(result.favorite_crops).toEqual([1, 3, 5]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null favorite_crops field', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test3@example.com',
        password_hash: 'hashedpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create user preferences with null favorite_crops (database default)
    await db.insert(userPreferencesTable)
      .values({
        user_id: userId,
        theme: 'light'
        // favorite_crops will be null by default
      })
      .execute();

    const result = await getUserPreferences(userId);

    expect(result.user_id).toEqual(userId);
    expect(result.theme).toEqual('light');
    expect(result.favorite_crops).toEqual([]);
    expect(result.id).toBeDefined();
  });

  it('should handle complex favorite crops array', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test4@example.com',
        password_hash: 'hashedpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create user preferences with a larger array of favorite crops
    const favoriteCropsArray = [1, 2, 3, 5, 8, 13, 21];
    await db.insert(userPreferencesTable)
      .values({
        user_id: userId,
        theme: 'dark',
        favorite_crops: JSON.stringify(favoriteCropsArray)
      })
      .execute();

    const result = await getUserPreferences(userId);

    expect(result.user_id).toEqual(userId);
    expect(result.theme).toEqual('dark');
    expect(result.favorite_crops).toEqual(favoriteCropsArray);
    expect(Array.isArray(result.favorite_crops)).toBe(true);
    expect(result.favorite_crops.length).toEqual(7);
  });

  it('should throw error when user preferences not found', async () => {
    const nonExistentUserId = 999999;

    await expect(getUserPreferences(nonExistentUserId))
      .rejects
      .toThrow(/User preferences not found for user ID: 999999/i);
  });

  it('should verify data is correctly stored and retrieved from database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'verify@example.com',
        password_hash: 'hashedpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create user preferences
    const preferencesResult = await db.insert(userPreferencesTable)
      .values({
        user_id: userId,
        theme: 'dark',
        favorite_crops: '[10, 20, 30]'
      })
      .returning()
      .execute();

    const result = await getUserPreferences(userId);

    // Verify all fields match the database record
    expect(result.id).toEqual(preferencesResult[0].id);
    expect(result.user_id).toEqual(preferencesResult[0].user_id);
    expect(result.theme).toEqual(preferencesResult[0].theme);
    expect(result.favorite_crops).toEqual([10, 20, 30]);
    expect(result.created_at).toEqual(preferencesResult[0].created_at);
    expect(result.updated_at).toEqual(preferencesResult[0].updated_at);
  });
});