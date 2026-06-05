import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';

beforeEach(() => {
    useAuthStore.setState({
        user: null,
    });
});

describe('useAuthStore', () => {

    it('starts with null state', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
    });

    it('stores credentials on login', () => {
        const user = { userId: 'u1', username: 'huyngo', email: 'huy@test.com', role: 'Admin' };
        useAuthStore.getState().login(user);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(user);
    });

    it('clears all credentials on logout', () => {
        const user = { userId: 'u1', username: 'huyngo', email: 'huy@test.com', role: 'Admin' };
        useAuthStore.getState().login(user);
        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
    });

    it('overwrites previous login on re-login', () => {
        const user1 = { userId: 'u1', username: 'user1', email: 'u1@test.com', role: 'Customer' };
        const user2 = { userId: 'u2', username: 'user2', email: 'u2@test.com', role: 'Admin' };

        useAuthStore.getState().login(user1);
        useAuthStore.getState().login(user2);

        const state = useAuthStore.getState();
        expect(state.user?.username).toBe('user2');
        expect(state.user?.role).toBe('Admin');
    });

    it('preserves user fields correctly', () => {
        const user = { userId: 'u1', username: 'huyngo', email: 'huy@bunbo.vn', role: 'Admin' };
        useAuthStore.getState().login(user);

        const stored = useAuthStore.getState().user!;
        expect(stored.userId).toBe('u1');
        expect(stored.username).toBe('huyngo');
        expect(stored.email).toBe('huy@bunbo.vn');
        expect(stored.role).toBe('Admin');
    });
});
