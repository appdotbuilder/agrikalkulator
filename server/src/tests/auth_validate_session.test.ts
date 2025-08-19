import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type ValidateSessionInput } from '../schema';
import { validateSession } from '../handlers/auth_validate_session';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  is_admin: false
};

const testAdmin = {
  email: 'admin@example.com', 
  password_hash: 'hashed_admin_password',
  is_admin: true
};

describe('validateSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data for valid session', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create valid session (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const sessionResult = await db.insert(sessionsTable)
      .values({
        id: 'valid_session_123',
        user_id: userId,
        expires_at: expiresAt
      })
      .returning()
      .execute();

    const input: ValidateSessionInput = {
      session_id: 'valid_session_123'
    };

    const result = await validateSession(input);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('test@example.com');
    expect(result?.password_hash).toEqual('hashed_password_123');
    expect(result?.is_admin).toEqual(false);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return admin user data for valid admin session', async () => {
    // Create test admin user
    const adminResult = await db.insert(usersTable)
      .values(testAdmin)
      .returning()
      .execute();
    
    const adminId = adminResult[0].id;

    // Create valid session for admin
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    await db.insert(sessionsTable)
      .values({
        id: 'admin_session_456',
        user_id: adminId,
        expires_at: expiresAt
      })
      .execute();

    const input: ValidateSessionInput = {
      session_id: 'admin_session_456'
    };

    const result = await validateSession(input);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(adminId);
    expect(result?.email).toEqual('admin@example.com');
    expect(result?.is_admin).toEqual(true);
  });

  it('should return null for non-existent session', async () => {
    const input: ValidateSessionInput = {
      session_id: 'non_existent_session'
    };

    const result = await validateSession(input);

    expect(result).toBeNull();
  });

  it('should return null for expired session', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create expired session (expired 1 hour ago)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() - 1);

    await db.insert(sessionsTable)
      .values({
        id: 'expired_session_789',
        user_id: userId,
        expires_at: expiresAt
      })
      .execute();

    const input: ValidateSessionInput = {
      session_id: 'expired_session_789'
    };

    const result = await validateSession(input);

    expect(result).toBeNull();
  });

  it('should return null for session that expires exactly now', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create session that expires exactly now
    const expiresAt = new Date();

    await db.insert(sessionsTable)
      .values({
        id: 'expires_now_session',
        user_id: userId,
        expires_at: expiresAt
      })
      .execute();

    // Wait 1ms to ensure current time is after expiration
    await new Promise(resolve => setTimeout(resolve, 1));

    const input: ValidateSessionInput = {
      session_id: 'expires_now_session'
    };

    const result = await validateSession(input);

    expect(result).toBeNull();
  });

  it('should validate session with far future expiration', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create session that expires far in the future
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await db.insert(sessionsTable)
      .values({
        id: 'far_future_session',
        user_id: userId,
        expires_at: expiresAt
      })
      .execute();

    const input: ValidateSessionInput = {
      session_id: 'far_future_session'
    };

    const result = await validateSession(input);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('test@example.com');
  });

  it('should handle empty session_id string', async () => {
    const input: ValidateSessionInput = {
      session_id: ''
    };

    const result = await validateSession(input);

    expect(result).toBeNull();
  });
});