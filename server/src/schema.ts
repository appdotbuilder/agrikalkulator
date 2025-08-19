import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Login input schema
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Login response schema
export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    is_admin: z.boolean()
  }).optional()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Crop category enum
export const cropCategoryEnum = z.enum(['Sayur', 'Buah', 'Palawija', 'Perkebunan', 'Rempah']);
export type CropCategory = z.infer<typeof cropCategoryEnum>;

// Crop schema
export const cropSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: cropCategoryEnum,
  icon: z.string(),
  estimated_cost: z.number(),
  potential_profit: z.number(),
  is_favorite: z.boolean(),
  is_stable: z.boolean(),
  is_public: z.boolean(), // Whether accessible without login
  tooltip_info: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Crop = z.infer<typeof cropSchema>;

// Input schema for creating crops
export const createCropInputSchema = z.object({
  name: z.string().min(1),
  category: cropCategoryEnum,
  icon: z.string(),
  estimated_cost: z.number().nonnegative(),
  potential_profit: z.number(),
  is_favorite: z.boolean().optional().default(false),
  is_stable: z.boolean().optional().default(false),
  is_public: z.boolean().optional().default(false),
  tooltip_info: z.string().nullable().optional()
});

export type CreateCropInput = z.infer<typeof createCropInputSchema>;

// Input schema for updating crops
export const updateCropInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  category: cropCategoryEnum.optional(),
  icon: z.string().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  potential_profit: z.number().optional(),
  is_favorite: z.boolean().optional(),
  is_stable: z.boolean().optional(),
  is_public: z.boolean().optional(),
  tooltip_info: z.string().nullable().optional()
});

export type UpdateCropInput = z.infer<typeof updateCropInputSchema>;

// Search crops input schema
export const searchCropsInputSchema = z.object({
  query: z.string().optional(),
  category: cropCategoryEnum.optional(),
  is_authenticated: z.boolean().optional().default(false)
});

export type SearchCropsInput = z.infer<typeof searchCropsInputSchema>;

// User preferences schema
export const userPreferencesSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  theme: z.enum(['light', 'dark']).default('light'),
  favorite_crops: z.array(z.number()).default([]),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Input schema for updating user preferences
export const updatePreferencesInputSchema = z.object({
  user_id: z.number(),
  theme: z.enum(['light', 'dark']).optional(),
  favorite_crops: z.array(z.number()).optional()
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesInputSchema>;

// Session schema
export const sessionSchema = z.object({
  id: z.string(),
  user_id: z.number(),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Session = z.infer<typeof sessionSchema>;

// Create session input
export const createSessionInputSchema = z.object({
  user_id: z.number()
});

export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;

// Validate session input
export const validateSessionInputSchema = z.object({
  session_id: z.string()
});

export type ValidateSessionInput = z.infer<typeof validateSessionInputSchema>;