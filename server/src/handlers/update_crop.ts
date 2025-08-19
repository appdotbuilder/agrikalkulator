import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type UpdateCropInput, type Crop } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCrop = async (input: UpdateCropInput): Promise<Crop> => {
  try {
    // First check if the crop exists
    const existingCrop = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.id, input.id))
      .execute();

    if (existingCrop.length === 0) {
      throw new Error(`Crop with id ${input.id} not found`);
    }

    // Build update object with only the fields that are provided
    const updateFields: any = {};
    
    if (input.name !== undefined) updateFields.name = input.name;
    if (input.category !== undefined) updateFields.category = input.category;
    if (input.icon !== undefined) updateFields.icon = input.icon;
    if (input.estimated_cost !== undefined) updateFields.estimated_cost = input.estimated_cost.toString();
    if (input.potential_profit !== undefined) updateFields.potential_profit = input.potential_profit.toString();
    if (input.is_favorite !== undefined) updateFields.is_favorite = input.is_favorite;
    if (input.is_stable !== undefined) updateFields.is_stable = input.is_stable;
    if (input.is_public !== undefined) updateFields.is_public = input.is_public;
    if (input.tooltip_info !== undefined) updateFields.tooltip_info = input.tooltip_info;
    
    // Always update the updated_at timestamp
    updateFields.updated_at = new Date();

    // Update the crop record
    const result = await db.update(cropsTable)
      .set(updateFields)
      .where(eq(cropsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const crop = result[0];
    return {
      ...crop,
      estimated_cost: parseFloat(crop.estimated_cost),
      potential_profit: parseFloat(crop.potential_profit)
    };
  } catch (error) {
    console.error('Crop update failed:', error);
    throw error;
  }
};