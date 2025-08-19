import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type CreateCropInput, type Crop } from '../schema';

export const createCrop = async (input: CreateCropInput): Promise<Crop> => {
  try {
    // Insert crop record
    const result = await db.insert(cropsTable)
      .values({
        name: input.name,
        category: input.category,
        icon: input.icon,
        estimated_cost: input.estimated_cost.toString(), // Convert number to string for numeric column
        potential_profit: input.potential_profit.toString(), // Convert number to string for numeric column
        is_favorite: input.is_favorite ?? false,
        is_stable: input.is_stable ?? false,
        is_public: input.is_public ?? false,
        tooltip_info: input.tooltip_info ?? null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const crop = result[0];
    return {
      ...crop,
      estimated_cost: parseFloat(crop.estimated_cost), // Convert string back to number
      potential_profit: parseFloat(crop.potential_profit) // Convert string back to number
    };
  } catch (error) {
    console.error('Crop creation failed:', error);
    throw error;
  }
};