import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
    userId: string;
    username: string;
    email: string;
    role: string;
}

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    login: (token: string, refreshToken: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            login: (token, refreshToken, user) => set({ token, refreshToken, user }),
            logout: () => set({ token: null, refreshToken: null, user: null }),
        }),
        {
            name: 'auth-storage', // Key lưu trên localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
