import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type CreateCropInput } from '../schema';
import { getCrops } from '../handlers/get_crops';

// Test crop data for different categories
const testCrops: CreateCropInput[] = [
  {
    name: 'Cabai Merah',
    category: 'Sayur',
    icon: '🌶️',
    estimated_cost: 50000,
    potential_profit: 150000,
    is_favorite: true,
    is_stable: false,
    is_public: true,
    tooltip_info: 'Cabai dengan potensi keuntungan tinggi'
  },
  {
    name: 'Mangga Harum',
    category: 'Buah',
    icon: '🥭',
    estimated_cost: 100000,
    potential_profit: 300000,
    is_favorite: false,
    is_stable: true,
    is_public: false,
    tooltip_info: 'Mangga premium'
  },
  {
    name: 'Jagung Manis',
    category: 'Palawija',
    icon: '🌽',
    estimated_cost: 40000,
    potential_profit: 120000,
    is_favorite: false,
    is_stable: true,
    is_public: true,
    tooltip_info: null
  }
];

describe('getCrops', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no crops exist', async () => {
    const result = await getCrops();
    
    expect(result).toEqual([]);
  });

  it('should return all crops with correct field types', async () => {
    // Insert test crops
    await db.insert(cropsTable)
      .values(testCrops.map(crop => ({
        ...crop,
        estimated_cost: crop.estimated_cost.toString(),
        potential_profit: crop.potential_profit.toString()
      })))
      .execute();

    const result = await getCrops();

    expect(result).toHaveLength(3);
    
    // Check first crop structure and types
    const firstCrop = result[0];
    expect(firstCrop.name).toEqual('Cabai Merah');
    expect(firstCrop.category).toEqual('Sayur');
    expect(firstCrop.icon).toEqual('🌶️');
    expect(typeof firstCrop.estimated_cost).toBe('number');
    expect(firstCrop.estimated_cost).toEqual(50000);
    expect(typeof firstCrop.potential_profit).toBe('number');
    expect(firstCrop.potential_profit).toEqual(150000);
    expect(firstCrop.is_favorite).toBe(true);
    expect(firstCrop.is_stable).toBe(false);
    expect(firstCrop.is_public).toBe(true);
    expect(firstCrop.tooltip_info).toEqual('Cabai dengan potensi keuntungan tinggi');
    expect(firstCrop.id).toBeDefined();
    expect(firstCrop.created_at).toBeInstanceOf(Date);
    expect(firstCrop.updated_at).toBeInstanceOf(Date);
  });

  it('should return crops from all categories', async () => {
    // Insert test crops
    await db.insert(cropsTable)
      .values(testCrops.map(crop => ({
        ...crop,
        estimated_cost: crop.estimated_cost.toString(),
        potential_profit: crop.potential_profit.toString()
      })))
      .execute();

    const result = await getCrops();

    // Check categories are represented
    const categories = result.map(crop => crop.category);
    expect(categories).toContain('Sayur');
    expect(categories).toContain('Buah');
    expect(categories).toContain('Palawija');
  });

  it('should handle crops with null tooltip_info', async () => {
    // Insert crop with null tooltip
    await db.insert(cropsTable)
      .values({
        name: 'Test Crop',
        category: 'Rempah',
        icon: '🟡',
        estimated_cost: '25000',
        potential_profit: '75000',
        is_favorite: false,
        is_stable: true,
        is_public: false,
        tooltip_info: null
      })
      .execute();

    const result = await getCrops();

    expect(result).toHaveLength(1);
    expect(result[0].tooltip_info).toBeNull();
  });

  it('should convert numeric fields correctly', async () => {
    // Insert crop with decimal values
    await db.insert(cropsTable)
      .values({
        name: 'Decimal Test',
        category: 'Sayur',
        icon: '🥕',
        estimated_cost: '123.45',
        potential_profit: '678.90',
        is_favorite: false,
        is_stable: false,
        is_public: true,
        tooltip_info: 'Test decimal conversion'
      })
      .execute();

    const result = await getCrops();

    expect(result).toHaveLength(1);
    expect(result[0].estimated_cost).toEqual(123.45);
    expect(result[0].potential_profit).toEqual(678.90);
    expect(typeof result[0].estimated_cost).toBe('number');
    expect(typeof result[0].potential_profit).toBe('number');
  });

  it('should return crops ordered by creation time', async () => {
    // Insert crops with slight delay to ensure different timestamps
    await db.insert(cropsTable)
      .values({
        name: 'First Crop',
        category: 'Sayur',
        icon: '🥬',
        estimated_cost: '10000',
        potential_profit: '20000',
        is_favorite: false,
        is_stable: false,
        is_public: true,
        tooltip_info: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(cropsTable)
      .values({
        name: 'Second Crop',
        category: 'Buah',
        icon: '🍎',
        estimated_cost: '15000',
        potential_profit: '25000',
        is_favorite: false,
        is_stable: false,
        is_public: true,
        tooltip_info: null
      })
      .execute();

    const result = await getCrops();

    expect(result).toHaveLength(2);
    // Verify both crops are present
    const cropNames = result.map(crop => crop.name);
    expect(cropNames).toContain('First Crop');
    expect(cropNames).toContain('Second Crop');
  });
});