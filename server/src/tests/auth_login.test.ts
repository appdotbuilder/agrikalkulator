import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/auth_login';
import { eq } from 'drizzle-orm';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login successfully with valid hardcoded admin credentials', async () => {
    // Create admin user first
    await db.insert(usersTable)
      .values({
        email: 'admin@gmail.com',
        password_hash: 'admin', // In real app, this would be bcrypt hashed
        is_admin: true
      })
      .execute();

    const input: LoginInput = {
      email: 'admin@gmail.com',
      password: 'admin'
    };

    const result = await loginUser(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe('admin@gmail.com');
    expect(result.user!.is_admin).toBe(true);
    expect(result.user!.id).toBeDefined();
  });

  it('should create session when login succeeds', async () => {
    // Create admin user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@gmail.com',
        password_hash: 'admin',
        is_admin: true
      })
      .returning()
      .execute();

    const user = userResult[0];

    const input: LoginInput = {
      email: 'admin@gmail.com',
      password: 'admin'
    };

    await loginUser(input);

    // Check that session was created
    const sessions = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, user.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toBe(user.id);
    expect(sessions[0].id).toBeDefined();
    expect(sessions[0].expires_at).toBeInstanceOf(Date);
    
    // Verify session expires in the future (approximately 7 days)
    const now = new Date();
    const expiresAt = sessions[0].expires_at;
    const diffInDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffInDays).toBeGreaterThan(6);
    expect(diffInDays).toBeLessThan(8);
  });

  it('should login successfully with regular user credentials', async () => {
    // Create regular user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'mypassword', // Plain text for demo purposes
        is_admin: false
      })
      .returning()
      .execute();

    const user = userResult[0];

    const input: LoginInput = {
      email: 'user@example.com',
      password: 'mypassword'
    };

    const result = await loginUser(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.user).toBeDefined();
    expect(result.user!.email).toBe('user@example.com');
    expect(result.user!.is_admin).toBe(false);
    expect(result.user!.id).toBe(user.id);
  });

  it('should fail login with non-existent email', async () => {
    const input: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    const result = await loginUser(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
    expect(result.user).toBeUndefined();
  });

  it('should fail login with wrong password', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'correctpassword',
        is_admin: false
      })
      .execute();

    const input: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
    expect(result.user).toBeUndefined();
  });

  it('should fail login with wrong admin password', async () => {
    // Create admin user first
    await db.insert(usersTable)
      .values({
        email: 'admin@gmail.com',
        password_hash: 'admin',
        is_admin: true
      })
      .execute();

    const input: LoginInput = {
      email: 'admin@gmail.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
    expect(result.user).toBeUndefined();
  });

  it('should not create session when login fails', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'correctpassword',
        is_admin: false
      })
      .returning()
      .execute();

    const user = userResult[0];

    const input: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await loginUser(input);

    // Check that no session was created
    const sessions = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, user.id))
      .execute();

    expect(sessions).toHaveLength(0);
  });

  it('should handle empty password', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'password',
        is_admin: false
      })
      .execute();

    const input: LoginInput = {
      email: 'test@example.com',
      password: ''
    };

    const result = await loginUser(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
    expect(result.user).toBeUndefined();
  });
});