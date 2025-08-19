import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type CreateSessionInput } from '../schema';
import { createSession } from '../handlers/auth_create_session';
import { eq } from 'drizzle-orm';

// Test input with valid user ID
const testInput: CreateSessionInput = {
  user_id: 1
};

describe('createSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create a test user for session creation
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      is_admin: false
    }).execute();
  });

  it('should create a session for valid user', async () => {
    const result = await createSession(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(result.user_id).toEqual(1);
    expect(result.expires_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify expiration is approximately 24 hours from now
    const now = new Date();
    const expectedExpiration = new Date();
    expectedExpiration.setHours(expectedExpiration.getHours() + 24);
    const timeDiff = Math.abs(result.expires_at.getTime() - expectedExpiration.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
  });

  it('should save session to database', async () => {
    const result = await createSession(testInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toEqual(result.id);
    expect(sessions[0].user_id).toEqual(1);
    expect(sessions[0].expires_at).toBeInstanceOf(Date);
    expect(sessions[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique session IDs', async () => {
    const result1 = await createSession(testInput);
    const result2 = await createSession(testInput);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(result2.id).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: CreateSessionInput = {
      user_id: 999
    };

    await expect(createSession(invalidInput)).rejects.toThrow(/User with id 999 not found/);
  });

  it('should create multiple sessions for same user', async () => {
    const result1 = await createSession(testInput);
    const result2 = await createSession(testInput);

    // Both sessions should exist in database
    const sessions = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, 1))
      .execute();

    expect(sessions).toHaveLength(2);
    expect(sessions.map(s => s.id)).toContain(result1.id);
    expect(sessions.map(s => s.id)).toContain(result2.id);
  });

  it('should set expiration approximately 24 hours from creation', async () => {
    const beforeCreation = new Date();
    const result = await createSession(testInput);
    const afterCreation = new Date();

    const expectedMinExpiration = new Date(beforeCreation);
    expectedMinExpiration.setHours(expectedMinExpiration.getHours() + 24);
    
    const expectedMaxExpiration = new Date(afterCreation);
    expectedMaxExpiration.setHours(expectedMaxExpiration.getHours() + 24);

    expect(result.expires_at.getTime()).toBeGreaterThanOrEqual(expectedMinExpiration.getTime());
    expect(result.expires_at.getTime()).toBeLessThanOrEqual(expectedMaxExpiration.getTime());
  });
});