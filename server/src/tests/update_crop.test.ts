import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type UpdateCropInput, type CreateCropInput } from '../schema';
import { updateCrop } from '../handlers/update_crop';
import { eq } from 'drizzle-orm';

describe('updateCrop', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test crop
  const createTestCrop = async (): Promise<number> => {
    const testCropData: CreateCropInput = {
      name: 'Original Crop',
      category: 'Sayur',
      icon: '🥬',
      estimated_cost: 100.50,
      potential_profit: 200.75,
      is_favorite: false,
      is_stable: true,
      is_public: true,
      tooltip_info: 'Original tooltip'
    };

    const result = await db.insert(cropsTable)
      .values({
        name: testCropData.name,
        category: testCropData.category,
        icon: testCropData.icon,
        estimated_cost: testCropData.estimated_cost.toString(),
        potential_profit: testCropData.potential_profit.toString(),
        is_favorite: testCropData.is_favorite,
        is_stable: testCropData.is_stable,
        is_public: testCropData.is_public,
        tooltip_info: testCropData.tooltip_info
      })
      .returning()
      .execute();

    return result[0].id;
  };

  it('should update crop name only', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      name: 'Updated Crop Name'
    };

    const result = await updateCrop(updateInput);

    expect(result.id).toEqual(cropId);
    expect(result.name).toEqual('Updated Crop Name');
    expect(result.category).toEqual('Sayur'); // Should remain unchanged
    expect(result.estimated_cost).toEqual(100.50); // Should remain unchanged
    expect(typeof result.estimated_cost).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      name: 'Completely Updated Crop',
      category: 'Buah',
      icon: '🍎',
      estimated_cost: 150.25,
      potential_profit: 300.00,
      is_favorite: true,
      is_stable: false,
      is_public: false,
      tooltip_info: 'Updated tooltip information'
    };

    const result = await updateCrop(updateInput);

    expect(result.id).toEqual(cropId);
    expect(result.name).toEqual('Completely Updated Crop');
    expect(result.category).toEqual('Buah');
    expect(result.icon).toEqual('🍎');
    expect(result.estimated_cost).toEqual(150.25);
    expect(result.potential_profit).toEqual(300.00);
    expect(result.is_favorite).toEqual(true);
    expect(result.is_stable).toEqual(false);
    expect(result.is_public).toEqual(false);
    expect(result.tooltip_info).toEqual('Updated tooltip information');
    expect(typeof result.estimated_cost).toEqual('number');
    expect(typeof result.potential_profit).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update crop to have null tooltip_info', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      tooltip_info: null
    };

    const result = await updateCrop(updateInput);

    expect(result.id).toEqual(cropId);
    expect(result.tooltip_info).toBeNull();
    expect(result.name).toEqual('Original Crop'); // Should remain unchanged
  });

  it('should save updated crop to database', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      name: 'Database Test Crop',
      estimated_cost: 99.99
    };

    await updateCrop(updateInput);

    // Verify the changes were persisted to the database
    const crops = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.id, cropId))
      .execute();

    expect(crops).toHaveLength(1);
    expect(crops[0].name).toEqual('Database Test Crop');
    expect(parseFloat(crops[0].estimated_cost)).toEqual(99.99);
    expect(crops[0].category).toEqual('Sayur'); // Unchanged
    expect(crops[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update numeric values correctly', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      estimated_cost: 0.01, // Very small decimal
      potential_profit: 9999.99 // Large decimal
    };

    const result = await updateCrop(updateInput);

    expect(result.estimated_cost).toEqual(0.01);
    expect(result.potential_profit).toEqual(9999.99);
    expect(typeof result.estimated_cost).toEqual('number');
    expect(typeof result.potential_profit).toEqual('number');

    // Verify precision is maintained in database
    const dbCrop = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.id, cropId))
      .execute();

    expect(parseFloat(dbCrop[0].estimated_cost)).toEqual(0.01);
    expect(parseFloat(dbCrop[0].potential_profit)).toEqual(9999.99);
  });

  it('should throw error for non-existent crop', async () => {
    const updateInput: UpdateCropInput = {
      id: 99999, // Non-existent crop ID
      name: 'This should fail'
    };

    await expect(updateCrop(updateInput)).rejects.toThrow(/crop with id 99999 not found/i);
  });

  it('should update boolean fields correctly', async () => {
    const cropId = await createTestCrop();
    
    // Test updating boolean fields to opposite values
    const updateInput: UpdateCropInput = {
      id: cropId,
      is_favorite: true,  // was false
      is_stable: false,   // was true
      is_public: false    // was true
    };

    const result = await updateCrop(updateInput);

    expect(result.is_favorite).toEqual(true);
    expect(result.is_stable).toEqual(false);
    expect(result.is_public).toEqual(false);
  });

  it('should handle partial updates with mixed field types', async () => {
    const cropId = await createTestCrop();
    
    const updateInput: UpdateCropInput = {
      id: cropId,
      category: 'Rempah',
      estimated_cost: 75.50,
      is_favorite: true
    };

    const result = await updateCrop(updateInput);

    // Updated fields
    expect(result.category).toEqual('Rempah');
    expect(result.estimated_cost).toEqual(75.50);
    expect(result.is_favorite).toEqual(true);

    // Unchanged fields
    expect(result.name).toEqual('Original Crop');
    expect(result.icon).toEqual('🥬');
    expect(result.potential_profit).toEqual(200.75);
    expect(result.is_stable).toEqual(true);
    expect(result.is_public).toEqual(true);
    expect(result.tooltip_info).toEqual('Original tooltip');
  });
});