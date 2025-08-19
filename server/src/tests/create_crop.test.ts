import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type CreateCropInput } from '../schema';
import { createCrop } from '../handlers/create_crop';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCropInput = {
  name: 'Tomat Cherry',
  category: 'Sayur',
  icon: '🍅',
  estimated_cost: 150000,
  potential_profit: 250000,
  is_favorite: true,
  is_stable: false,
  is_public: true,
  tooltip_info: 'Tomat cherry sangat cocok untuk hidroponik'
};

// Test input with minimal required fields (using defaults)
const minimalInput: CreateCropInput = {
  name: 'Bayam Hijau',
  category: 'Sayur',
  icon: '🥬',
  estimated_cost: 25000,
  potential_profit: 45000,
  is_favorite: false,
  is_stable: false,
  is_public: false
};

describe('createCrop', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a crop with all fields specified', async () => {
    const result = await createCrop(testInput);

    // Verify all field values
    expect(result.name).toEqual('Tomat Cherry');
    expect(result.category).toEqual('Sayur');
    expect(result.icon).toEqual('🍅');
    expect(result.estimated_cost).toEqual(150000);
    expect(result.potential_profit).toEqual(250000);
    expect(result.is_favorite).toEqual(true);
    expect(result.is_stable).toEqual(false);
    expect(result.is_public).toEqual(true);
    expect(result.tooltip_info).toEqual('Tomat cherry sangat cocok untuk hidroponik');

    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.estimated_cost).toBe('number');
    expect(typeof result.potential_profit).toBe('number');
  });

  it('should create a crop with minimal fields and apply defaults', async () => {
    const result = await createCrop(minimalInput);

    // Verify required fields
    expect(result.name).toEqual('Bayam Hijau');
    expect(result.category).toEqual('Sayur');
    expect(result.icon).toEqual('🥬');
    expect(result.estimated_cost).toEqual(25000);
    expect(result.potential_profit).toEqual(45000);

    // Verify default values are applied
    expect(result.is_favorite).toEqual(false);
    expect(result.is_stable).toEqual(false);
    expect(result.is_public).toEqual(false);
    expect(result.tooltip_info).toBeNull();

    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save crop to database correctly', async () => {
    const result = await createCrop(testInput);

    // Query the database to verify the crop was saved
    const crops = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.id, result.id))
      .execute();

    expect(crops).toHaveLength(1);
    const savedCrop = crops[0];

    // Verify saved data matches input
    expect(savedCrop.name).toEqual('Tomat Cherry');
    expect(savedCrop.category).toEqual('Sayur');
    expect(savedCrop.icon).toEqual('🍅');
    expect(parseFloat(savedCrop.estimated_cost)).toEqual(150000);
    expect(parseFloat(savedCrop.potential_profit)).toEqual(250000);
    expect(savedCrop.is_favorite).toEqual(true);
    expect(savedCrop.is_stable).toEqual(false);
    expect(savedCrop.is_public).toEqual(true);
    expect(savedCrop.tooltip_info).toEqual('Tomat cherry sangat cocok untuk hidroponik');
    expect(savedCrop.created_at).toBeInstanceOf(Date);
    expect(savedCrop.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different crop categories', async () => {
    const fruitInput: CreateCropInput = {
      name: 'Strawberry Hidroponik',
      category: 'Buah',
      icon: '🍓',
      estimated_cost: 300000,
      potential_profit: 500000,
      is_favorite: false,
      is_stable: false,
      is_public: false
    };

    const result = await createCrop(fruitInput);

    expect(result.name).toEqual('Strawberry Hidroponik');
    expect(result.category).toEqual('Buah');
    expect(result.icon).toEqual('🍓');
    expect(result.estimated_cost).toEqual(300000);
    expect(result.potential_profit).toEqual(500000);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreateCropInput = {
      name: 'Microgreens',
      category: 'Sayur',
      icon: '🌱',
      estimated_cost: 12.50,
      potential_profit: 35.75,
      is_favorite: false,
      is_stable: false,
      is_public: false
    };

    const result = await createCrop(decimalInput);

    expect(result.estimated_cost).toEqual(12.50);
    expect(result.potential_profit).toEqual(35.75);
    expect(typeof result.estimated_cost).toBe('number');
    expect(typeof result.potential_profit).toBe('number');

    // Verify in database
    const crops = await db.select()
      .from(cropsTable)
      .where(eq(cropsTable.id, result.id))
      .execute();

    const savedCrop = crops[0];
    expect(parseFloat(savedCrop.estimated_cost)).toEqual(12.50);
    expect(parseFloat(savedCrop.potential_profit)).toEqual(35.75);
  });

  it('should handle negative potential profit', async () => {
    const negativeInput: CreateCropInput = {
      name: 'Experimental Crop',
      category: 'Perkebunan',
      icon: '🌿',
      estimated_cost: 100000,
      potential_profit: -20000, // Potential loss
      is_favorite: false,
      is_stable: false,
      is_public: false
    };

    const result = await createCrop(negativeInput);

    expect(result.potential_profit).toEqual(-20000);
    expect(typeof result.potential_profit).toBe('number');
  });

  it('should handle null tooltip_info explicitly', async () => {
    const nullTooltipInput: CreateCropInput = {
      name: 'Simple Crop',
      category: 'Rempah',
      icon: '🌶️',
      estimated_cost: 50000,
      potential_profit: 80000,
      is_favorite: false,
      is_stable: false,
      is_public: false,
      tooltip_info: null
    };

    const result = await createCrop(nullTooltipInput);

    expect(result.tooltip_info).toBeNull();
  });

  it('should create multiple crops with different timestamps', async () => {
    const firstResult = await createCrop(testInput);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secondResult = await createCrop(minimalInput);

    // Verify different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);

    // Verify both crops exist in database
    const crops = await db.select()
      .from(cropsTable)
      .execute();

    expect(crops).toHaveLength(2);
    
    // Find crops by name to verify both were saved
    const tomatCrop = crops.find(crop => crop.name === 'Tomat Cherry');
    const bayamCrop = crops.find(crop => crop.name === 'Bayam Hijau');
    
    expect(tomatCrop).toBeDefined();
    expect(bayamCrop).toBeDefined();
  });
});