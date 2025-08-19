import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type LoginInput, type LoginResponse } from '../schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const loginUser = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    const user = users[0];

    // For now, we'll implement simple password checking
    // In a real application, you'd use bcrypt.compare() with hashed passwords
    // But since this is a demo, we'll check for the hardcoded admin case
    // and assume other passwords are stored as plain text (NOT recommended for production)
    let passwordValid = false;
    
    if (input.email === 'admin@gmail.com' && input.password === 'admin') {
      passwordValid = true;
    } else {
      // For other users, compare directly with stored password_hash
      // In production, this should be: await bcrypt.compare(input.password, user.password_hash)
      passwordValid = input.password === user.password_hash;
    }

    if (!passwordValid) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Create session
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.insert(sessionsTable)
      .values({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt
      })
      .execute();

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};