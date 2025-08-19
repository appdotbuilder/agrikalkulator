import { db } from '../db';
import { sessionsTable, usersTable } from '../db/schema';
import { type ValidateSessionInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function validateSession(input: ValidateSessionInput): Promise<User | null> {
  try {
    // Query session with joined user data
    const results = await db.select()
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.user_id, usersTable.id))
      .where(eq(sessionsTable.id, input.session_id))
      .execute();

    if (results.length === 0) {
      return null; // Session not found
    }

    const result = results[0];
    const session = result.sessions;
    const user = result.users;

    // Check if session is expired
    const now = new Date();
    if (session.expires_at <= now) {
      return null; // Session expired
    }

    // Return user data (no password hash)
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      is_admin: user.is_admin,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    throw error;
  }
}