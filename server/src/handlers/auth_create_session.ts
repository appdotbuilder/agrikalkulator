import { db } from '../db';
import { sessionsTable, usersTable } from '../db/schema';
import { type CreateSessionInput, type Session } from '../schema';
import { eq } from 'drizzle-orm';

export const createSession = async (input: CreateSessionInput): Promise<Session> => {
  try {
    // Verify user exists first to prevent foreign key constraint violations
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Generate unique session ID and set expiration time
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    // Insert session record
    const result = await db.insert(sessionsTable)
      .values({
        id: sessionId,
        user_id: input.user_id,
        expires_at: expiresAt
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Session creation failed:', error);
    throw error;
  }
};