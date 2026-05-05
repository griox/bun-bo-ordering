import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/layout/Header';
import { MenuClient } from './MenuClient';

async function getCategories() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/api/catalog/categories`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

async function getFoodsByCategory(categoryId: number) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${apiUrl}/api/catalog/foods/category/${categoryId}`, {
            next: { revalidate: 600 } // Cache for 10 minutes
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error(`Error fetching foods for category ${categoryId}:`, error);
        return [];
    }
}

export default async function MenuPage() {
    const categories = await getCategories();
    const initialFoods = categories.length > 0 ? await getFoodsByCategory(categories[0].id) : [];

    return (
        <div className="flex flex-col min-h-screen font-main text-text">
            <Header />
            <MenuClient initialCategories={categories} initialFoods={initialFoods} />
            <Footer />
        </div>
    );
}
