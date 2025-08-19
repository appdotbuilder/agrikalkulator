import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type CropCategory, type Crop } from '../schema';
import { eq } from 'drizzle-orm';

export const getCropsByCategory = async (category: CropCategory): Promise<Crop[]> => {
  try {
    const results = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.category, category))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(crop => ({
      ...crop,
      estimated_cost: parseFloat(crop.estimated_cost),
      potential_profit: parseFloat(crop.potential_profit)
    }));
  } catch (error) {
    console.error('Failed to get crops by category:', error);
    throw error;
  }
};