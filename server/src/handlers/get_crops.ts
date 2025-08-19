import { type Crop } from '../schema';

export async function getCrops(): Promise<Crop[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch all crops from the database
    // Should return pre-populated crop data for all categories
    
    // Placeholder crop data matching the application requirements
    const mockCrops: Crop[] = [
        // Sayur category
        {
            id: 1,
            name: 'Cabai',
            category: 'Sayur',
            icon: '🌶️',
            estimated_cost: 50000,
            potential_profit: 150000,
            is_favorite: true,
            is_stable: false,
            is_public: true, // Accessible without login
            tooltip_info: 'Cabai merah keriting dengan potensi keuntungan tinggi',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            name: 'Tomat',
            category: 'Sayur',
            icon: '🍅',
            estimated_cost: 30000,
            potential_profit: 80000,
            is_favorite: false,
            is_stable: true,
            is_public: false,
            tooltip_info: 'Tomat cherry dengan hasil stabil',
            created_at: new Date(),
            updated_at: new Date()
        },
        // Buah category
        {
            id: 3,
            name: 'Mangga',
            category: 'Buah',
            icon: '🥭',
            estimated_cost: 100000,
            potential_profit: 300000,
            is_favorite: true,
            is_stable: true,
            is_public: false,
            tooltip_info: 'Mangga harum manis dengan market yang stabil',
            created_at: new Date(),
            updated_at: new Date()
        },
        // Palawija category
        {
            id: 4,
            name: 'Jagung',
            category: 'Palawija',
            icon: '🌽',
            estimated_cost: 40000,
            potential_profit: 120000,
            is_favorite: false,
            is_stable: true,
            is_public: false,
            tooltip_info: 'Jagung manis dengan permintaan tinggi',
            created_at: new Date(),
            updated_at: new Date()
        },
        // Perkebunan category
        {
            id: 5,
            name: 'Kopi',
            category: 'Perkebunan',
            icon: '☕',
            estimated_cost: 200000,
            potential_profit: 500000,
            is_favorite: true,
            is_stable: false,
            is_public: false,
            tooltip_info: 'Kopi arabika premium dengan harga tinggi',
            created_at: new Date(),
            updated_at: new Date()
        },
        // Rempah category
        {
            id: 6,
            name: 'Kunyit',
            category: 'Rempah',
            icon: '🟡',
            estimated_cost: 25000,
            potential_profit: 75000,
            is_favorite: false,
            is_stable: true,
            is_public: false,
            tooltip_info: 'Kunyit organik dengan permintaan stabil',
            created_at: new Date(),
            updated_at: new Date()
        }
    ];
    
    return mockCrops;
}