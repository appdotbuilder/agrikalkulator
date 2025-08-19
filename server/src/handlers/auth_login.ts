import { type LoginInput, type LoginResponse } from '../schema';

export async function loginUser(input: LoginInput): Promise<LoginResponse> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to authenticate user with email/password
    // For now, hardcoded admin@gmail.com with password 'admin' should grant access
    // Should verify credentials against database and create session
    
    if (input.email === 'admin@gmail.com' && input.password === 'admin') {
        return {
            success: true,
            message: 'Login successful',
            user: {
                id: 1,
                email: input.email,
                is_admin: true
            }
        };
    }
    
    return {
        success: false,
        message: 'Invalid credentials'
    };
}