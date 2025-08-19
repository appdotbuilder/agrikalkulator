import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type SearchCropsInput, type Crop } from '../schema';
import { eq, ilike, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function searchCrops(input: SearchCropsInput): Promise<Crop[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by category if provided
    if (input.category) {
      conditions.push(eq(cropsTable.category, input.category));
    }

    // Filter by search query (name matching) if provided
    if (input.query && input.query.trim() !== '') {
      conditions.push(ilike(cropsTable.name, `%${input.query.trim()}%`));
    }

    // Filter by authentication status - show only public crops for unauthenticated users
    if (!input.is_authenticated) {
      conditions.push(eq(cropsTable.is_public, true));
    }

    // Build query with conditions
    const query = conditions.length > 0
      ? db.select().from(cropsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(cropsTable);

    // Execute query
    const results = await query.execute();

    // Convert numeric fields from strings to numbers
    return results.map(crop => ({
      ...crop,
      estimated_cost: parseFloat(crop.estimated_cost),
      potential_profit: parseFloat(crop.potential_profit)
    }));
  } catch (error) {
    console.error('Search crops failed:', error);
    throw error;
  }
}