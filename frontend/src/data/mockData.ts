export interface FoodItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
}

export interface Category {
    id: string;
    name: string;
}

export const MOCK_CATEGORIES: Category[] = [
    { id: 'cat_bunbo', name: 'BÚN BÒ' },
    { id: 'cat_drinks', name: 'ĐỒ UỐNG' },
];

export const MOCK_FOODS: FoodItem[] = [
    {
        id: 'f_1',
        name: 'Tái Nạm',
        description: 'Bò tái mềm và nạm gân giòn.',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },
    {
        id: 'f_2',
        name: 'Tái Xương',
        description: 'Bò tái và xương ống ngọt tủy.',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },
    {
        id: 'f_3',
        name: 'Tái Gân',
        description: 'Gân trong giòn sần sật.',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },
    {
        id: 'f_4',
        name: 'Nạm Xương',
        description: 'Nạm bò pha lẫn xương hầm.',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1518133663762-a256e44311be?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },
    {
        id: 'f_5',
        name: 'Xương Gân',
        description: 'Sự kết hợp hoàn hảo.',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1631709497515-27a330a1209b?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },
    {
        id: 'f_6',
        name: 'Đặc Biệt',
        description: 'Full topping: Tái, Nạm, Gân, Xương, Chả.',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1565256221193-4a0003058f4a?w=800&q=60&fit=crop',
        categoryId: 'cat_bunbo'
    },

    // ĐỒ UỐNG
    {
        id: 'd_1',
        name: 'Cà Phê Đen',
        description: 'Đậm đà hương vị Việt.',
        price: 39000,
        image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    },
    {
        id: 'd_2',
        name: 'Cà Phê Sữa',
        description: 'Sữa đặc Ngôi Sao Phương Nam.',
        price: 49000,
        image: 'https://images.unsplash.com/photo-1572097662444-653d6bf1dd0e?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    },
    {
        id: 'd_3',
        name: 'Bạc Xỉu',
        description: 'Nhiều sữa ít cafe.',
        price: 29000,
        image: 'https://images.unsplash.com/photo-1536417332223-93339bb5ce18?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    },
    {
        id: 'd_4',
        name: 'Latte',
        description: 'Art hình trái tim.',
        price: 39000,
        image: 'https://images.unsplash.com/photo-1594910006727-46487e35b75b?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    },
    {
        id: 'd_5',
        name: 'Soda',
        description: 'Mát lạnh sảng khoái.',
        price: 21000,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    },
    {
        id: 'd_6',
        name: 'Juice',
        description: 'Nước ép trái cây tươi.',
        price: 21000,
        image: 'https://images.unsplash.com/photo-1626084478174-83935817d23d?w=800&q=60&fit=crop',
        categoryId: 'cat_drinks'
    }
];
