import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type Crop } from '../schema';

export const getCrops = async (): Promise<Crop[]> => {
  try {
    // Fetch all crops from the database
    const result = await db.select()
      .from(cropsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return result.map(crop => ({
      ...crop,
      estimated_cost: parseFloat(crop.estimated_cost),
      potential_profit: parseFloat(crop.potential_profit)
    }));
  } catch (error) {
    console.error('Failed to fetch crops:', error);
    throw error;
  }
};