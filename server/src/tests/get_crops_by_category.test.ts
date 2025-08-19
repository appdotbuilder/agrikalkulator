import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type CreateCropInput, type CropCategory } from '../schema';
import { getCropsByCategory } from '../handlers/get_crops_by_category';

// Test crop data for different categories
const testCrops: CreateCropInput[] = [
  {
    name: 'Tomat',
    category: 'Sayur',
    icon: '🍅',
    estimated_cost: 50000,
    potential_profit: 25000,
    is_favorite: true,
    is_stable: true,
    is_public: true,
    tooltip_info: 'Sayuran populer'
  },
  {
    name: 'Cabai',
    category: 'Sayur',
    icon: '🌶️',
    estimated_cost: 75000,
    potential_profit: 40000,
    is_favorite: false,
    is_stable: false,
    is_public: true,
    tooltip_info: null
  },
  {
    name: 'Apel',
    category: 'Buah',
    icon: '🍎',
    estimated_cost: 100000,
    potential_profit: 60000,
    is_favorite: true,
    is_stable: true,
    is_public: false,
    tooltip_info: 'Buah populer'
  },
  {
    name: 'Mangga',
    category: 'Buah',
    icon: '🥭',
    estimated_cost: 150000,
    potential_profit: 80000,
    is_favorite: false,
    is_stable: true,
    is_public: true,
    tooltip_info: 'Buah tropis'
  },
  {
    name: 'Jagung',
    category: 'Palawija',
    icon: '🌽',
    estimated_cost: 30000,
    potential_profit: 15000,
    is_favorite: false,
    is_stable: true,
    is_public: true,
    tooltip_info: 'Tanaman palawija utama'
  }
];

describe('getCropsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test crops
    for (const crop of testCrops) {
      await db.insert(cropsTable)
        .values({
          name: crop.name,
          category: crop.category,
          icon: crop.icon,
          estimated_cost: crop.estimated_cost.toString(),
          potential_profit: crop.potential_profit.toString(),
          is_favorite: crop.is_favorite || false,
          is_stable: crop.is_stable || false,
          is_public: crop.is_public || false,
          tooltip_info: crop.tooltip_info
        })
        .execute();
    }
  });

  it('should return crops filtered by Sayur category', async () => {
    const result = await getCropsByCategory('Sayur');

    expect(result).toHaveLength(2);
    
    // Verify all returned crops are Sayur category
    result.forEach(crop => {
      expect(crop.category).toBe('Sayur');
    });

    // Check specific crops
    const cropNames = result.map(c => c.name).sort();
    expect(cropNames).toEqual(['Cabai', 'Tomat']);

    // Verify numeric conversions
    const tomatCrop = result.find(c => c.name === 'Tomat');
    expect(tomatCrop).toBeDefined();
    expect(typeof tomatCrop!.estimated_cost).toBe('number');
    expect(typeof tomatCrop!.potential_profit).toBe('number');
    expect(tomatCrop!.estimated_cost).toBe(50000);
    expect(tomatCrop!.potential_profit).toBe(25000);
  });

  it('should return crops filtered by Buah category', async () => {
    const result = await getCropsByCategory('Buah');

    expect(result).toHaveLength(2);
    
    // Verify all returned crops are Buah category
    result.forEach(crop => {
      expect(crop.category).toBe('Buah');
    });

    // Check specific crops
    const cropNames = result.map(c => c.name).sort();
    expect(cropNames).toEqual(['Apel', 'Mangga']);

    // Verify numeric conversions for Buah crops
    const manggaCrop = result.find(c => c.name === 'Mangga');
    expect(manggaCrop).toBeDefined();
    expect(typeof manggaCrop!.estimated_cost).toBe('number');
    expect(typeof manggaCrop!.potential_profit).toBe('number');
    expect(manggaCrop!.estimated_cost).toBe(150000);
    expect(manggaCrop!.potential_profit).toBe(80000);
  });

  it('should return crops filtered by Palawija category', async () => {
    const result = await getCropsByCategory('Palawija');

    expect(result).toHaveLength(1);
    
    const crop = result[0];
    expect(crop.category).toBe('Palawija');
    expect(crop.name).toBe('Jagung');
    expect(crop.icon).toBe('🌽');
    
    // Verify numeric conversions
    expect(typeof crop.estimated_cost).toBe('number');
    expect(typeof crop.potential_profit).toBe('number');
    expect(crop.estimated_cost).toBe(30000);
    expect(crop.potential_profit).toBe(15000);
  });

  it('should return empty array for category with no crops', async () => {
    const result = await getCropsByCategory('Rempah');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return crops with all required fields', async () => {
    const result = await getCropsByCategory('Sayur');

    expect(result.length).toBeGreaterThan(0);
    
    const crop = result[0];
    
    // Verify all required fields are present
    expect(crop.id).toBeDefined();
    expect(typeof crop.id).toBe('number');
    expect(crop.name).toBeDefined();
    expect(typeof crop.name).toBe('string');
    expect(crop.category).toBeDefined();
    expect(crop.icon).toBeDefined();
    expect(typeof crop.icon).toBe('string');
    expect(crop.estimated_cost).toBeDefined();
    expect(typeof crop.estimated_cost).toBe('number');
    expect(crop.potential_profit).toBeDefined();
    expect(typeof crop.potential_profit).toBe('number');
    expect(typeof crop.is_favorite).toBe('boolean');
    expect(typeof crop.is_stable).toBe('boolean');
    expect(typeof crop.is_public).toBe('boolean');
    expect(crop.created_at).toBeInstanceOf(Date);
    expect(crop.updated_at).toBeInstanceOf(Date);
    
    // tooltip_info can be null or string
    expect(crop.tooltip_info === null || typeof crop.tooltip_info === 'string').toBe(true);
  });

  it('should handle all valid crop categories', async () => {
    const categories: CropCategory[] = ['Sayur', 'Buah', 'Palawija', 'Perkebunan', 'Rempah'];
    
    for (const category of categories) {
      const result = await getCropsByCategory(category);
      expect(Array.isArray(result)).toBe(true);
      
      // If crops exist for this category, verify they match
      if (result.length > 0) {
        result.forEach(crop => {
          expect(crop.category).toBe(category);
        });
      }
    }
  });

  it('should preserve boolean field values correctly', async () => {
    const result = await getCropsByCategory('Sayur');

    const tomatCrop = result.find(c => c.name === 'Tomat');
    const cabaiCrop = result.find(c => c.name === 'Cabai');

    expect(tomatCrop).toBeDefined();
    expect(cabaiCrop).toBeDefined();

    // Verify boolean values are preserved correctly
    expect(tomatCrop!.is_favorite).toBe(true);
    expect(tomatCrop!.is_stable).toBe(true);
    expect(tomatCrop!.is_public).toBe(true);

    expect(cabaiCrop!.is_favorite).toBe(false);
    expect(cabaiCrop!.is_stable).toBe(false);
    expect(cabaiCrop!.is_public).toBe(true);
  });
});