import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cropsTable } from '../db/schema';
import { type SearchCropsInput } from '../schema';
import { searchCrops } from '../handlers/search_crops';

// Test data
const testCrops = [
  {
    name: 'Tomat',
    category: 'Sayur' as const,
    icon: 'tomato.png',
    estimated_cost: 50000,
    potential_profit: 75000,
    is_favorite: false,
    is_stable: true,
    is_public: true,
    tooltip_info: 'Tomat mudah ditanam'
  },
  {
    name: 'Apel',
    category: 'Buah' as const,
    icon: 'apple.png',
    estimated_cost: 100000,
    potential_profit: 150000,
    is_favorite: true,
    is_stable: false,
    is_public: false,
    tooltip_info: 'Apel membutuhkan perawatan khusus'
  },
  {
    name: 'Jagung',
    category: 'Palawija' as const,
    icon: 'corn.png',
    estimated_cost: 30000,
    potential_profit: 45000,
    is_favorite: false,
    is_stable: true,
    is_public: true,
    tooltip_info: null
  },
  {
    name: 'Kopi',
    category: 'Perkebunan' as const,
    icon: 'coffee.png',
    estimated_cost: 200000,
    potential_profit: 300000,
    is_favorite: true,
    is_stable: true,
    is_public: false,
    tooltip_info: 'Kopi investasi jangka panjang'
  }
];

describe('searchCrops', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(cropsTable)
      .values(testCrops.map(crop => ({
        ...crop,
        estimated_cost: crop.estimated_cost.toString(),
        potential_profit: crop.potential_profit.toString()
      })))
      .execute();
  });
  
  afterEach(resetDB);

  it('should return all crops when no filters applied and authenticated', async () => {
    const input: SearchCropsInput = {
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(4);
    
    // Verify numeric fields are properly converted
    results.forEach(crop => {
      expect(typeof crop.estimated_cost).toBe('number');
      expect(typeof crop.potential_profit).toBe('number');
    });

    // Verify all test crops are included
    const cropNames = results.map(c => c.name).sort();
    expect(cropNames).toEqual(['Apel', 'Jagung', 'Kopi', 'Tomat']);
  });

  it('should return only public crops when unauthenticated', async () => {
    const input: SearchCropsInput = {
      is_authenticated: false
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(2);
    
    const cropNames = results.map(c => c.name).sort();
    expect(cropNames).toEqual(['Jagung', 'Tomat']);
    
    // Verify all returned crops are public
    results.forEach(crop => {
      expect(crop.is_public).toBe(true);
    });
  });

  it('should filter by category correctly', async () => {
    const input: SearchCropsInput = {
      category: 'Sayur',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tomat');
    expect(results[0].category).toBe('Sayur');
  });

  it('should filter by search query (case insensitive)', async () => {
    const input: SearchCropsInput = {
      query: 'tom',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tomat');
  });

  it('should filter by partial search query', async () => {
    const input: SearchCropsInput = {
      query: 'ko',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Kopi');
  });

  it('should filter by partial search query matching multiple crops', async () => {
    const input: SearchCropsInput = {
      query: 'a',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(3);
    const cropNames = results.map(c => c.name).sort();
    expect(cropNames).toEqual(['Apel', 'Jagung', 'Tomat']);
  });

  it('should combine category and authentication filters', async () => {
    const input: SearchCropsInput = {
      category: 'Perkebunan',
      is_authenticated: false
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(0); // Kopi is Perkebunan but not public
  });

  it('should combine all filters correctly', async () => {
    const input: SearchCropsInput = {
      query: 'tom',
      category: 'Sayur',
      is_authenticated: false
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tomat');
    expect(results[0].category).toBe('Sayur');
    expect(results[0].is_public).toBe(true);
  });

  it('should return empty array when no matches found', async () => {
    const input: SearchCropsInput = {
      query: 'nonexistent',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(0);
  });

  it('should handle empty query string correctly', async () => {
    const input: SearchCropsInput = {
      query: '',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(4); // Should return all crops when query is empty
  });

  it('should handle query with only whitespace', async () => {
    const input: SearchCropsInput = {
      query: '   ',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(4); // Should return all crops when query is whitespace
  });

  it('should verify numeric field conversions are correct', async () => {
    const input: SearchCropsInput = {
      query: 'Tomat',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    const tomat = results[0];
    
    expect(tomat.estimated_cost).toBe(50000);
    expect(tomat.potential_profit).toBe(75000);
    expect(typeof tomat.estimated_cost).toBe('number');
    expect(typeof tomat.potential_profit).toBe('number');
  });

  it('should preserve all crop fields in response', async () => {
    const input: SearchCropsInput = {
      query: 'Tomat',
      is_authenticated: true
    };

    const results = await searchCrops(input);

    expect(results).toHaveLength(1);
    const crop = results[0];
    
    // Verify all expected fields are present
    expect(crop.id).toBeDefined();
    expect(crop.name).toBe('Tomat');
    expect(crop.category).toBe('Sayur');
    expect(crop.icon).toBe('tomato.png');
    expect(crop.estimated_cost).toBe(50000);
    expect(crop.potential_profit).toBe(75000);
    expect(crop.is_favorite).toBe(false);
    expect(crop.is_stable).toBe(true);
    expect(crop.is_public).toBe(true);
    expect(crop.tooltip_info).toBe('Tomat mudah ditanam');
    expect(crop.created_at).toBeInstanceOf(Date);
    expect(crop.updated_at).toBeInstanceOf(Date);
  });
});