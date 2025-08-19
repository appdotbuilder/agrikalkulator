import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, userPreferencesTable } from '../db/schema';
import { type UpdatePreferencesInput } from '../schema';
import { updateUserPreferences } from '../handlers/update_user_preferences';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  is_admin: false
};

describe('updateUserPreferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    testUserId = userResult[0].id;
  });

  it('should create new preferences when none exist', async () => {
    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'dark',
      favorite_crops: [1, 2, 3]
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('dark');
    expect(result.favorite_crops).toEqual([1, 2, 3]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing preferences', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testUserId,
        theme: 'light',
        favorite_crops: JSON.stringify([4, 5])
      })
      .execute();

    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'dark',
      favorite_crops: [1, 2, 3]
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('dark');
    expect(result.favorite_crops).toEqual([1, 2, 3]);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only theme when favorite_crops not provided', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testUserId,
        theme: 'light',
        favorite_crops: JSON.stringify([4, 5])
      })
      .execute();

    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'dark'
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('dark');
    expect(result.favorite_crops).toEqual([4, 5]); // Should remain unchanged
  });

  it('should update only favorite_crops when theme not provided', async () => {
    // Create initial preferences
    await db.insert(userPreferencesTable)
      .values({
        user_id: testUserId,
        theme: 'dark',
        favorite_crops: JSON.stringify([4, 5])
      })
      .execute();

    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      favorite_crops: [7, 8, 9]
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('dark'); // Should remain unchanged
    expect(result.favorite_crops).toEqual([7, 8, 9]);
  });

  it('should handle empty favorite_crops array', async () => {
    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'light',
      favorite_crops: []
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('light');
    expect(result.favorite_crops).toEqual([]);
    expect(Array.isArray(result.favorite_crops)).toBe(true);
  });

  it('should save preferences to database correctly', async () => {
    const input: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'dark',
      favorite_crops: [1, 2, 3]
    };

    const result = await updateUserPreferences(input);

    // Verify data was saved to database
    const savedPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, testUserId))
      .execute();

    expect(savedPreferences).toHaveLength(1);
    expect(savedPreferences[0].user_id).toEqual(testUserId);
    expect(savedPreferences[0].theme).toEqual('dark');
    expect(JSON.parse(savedPreferences[0].favorite_crops!)).toEqual([1, 2, 3]);
    expect(savedPreferences[0].id).toEqual(result.id);
  });

  it('should use default values when creating new preferences with minimal input', async () => {
    const input: UpdatePreferencesInput = {
      user_id: testUserId
    };

    const result = await updateUserPreferences(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.theme).toEqual('light'); // Default theme
    expect(result.favorite_crops).toEqual([]); // Default empty array
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentUserId = 99999;
    const input: UpdatePreferencesInput = {
      user_id: nonExistentUserId,
      theme: 'dark'
    };

    await expect(updateUserPreferences(input)).rejects.toThrow(/User with ID 99999 not found/i);
  });

  it('should handle multiple updates to same preferences', async () => {
    // First update
    const input1: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'dark',
      favorite_crops: [1, 2]
    };

    const result1 = await updateUserPreferences(input1);
    expect(result1.theme).toEqual('dark');
    expect(result1.favorite_crops).toEqual([1, 2]);

    // Second update
    const input2: UpdatePreferencesInput = {
      user_id: testUserId,
      theme: 'light',
      favorite_crops: [3, 4, 5]
    };

    const result2 = await updateUserPreferences(input2);
    expect(result2.theme).toEqual('light');
    expect(result2.favorite_crops).toEqual([3, 4, 5]);
    expect(result2.id).toEqual(result1.id); // Same record ID

    // Verify only one record exists in database
    const allPreferences = await db.select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.user_id, testUserId))
      .execute();

    expect(allPreferences).toHaveLength(1);
  });
});