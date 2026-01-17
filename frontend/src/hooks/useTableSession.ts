import { useEffect, useState } from 'react';
import api from '@/services/api';
import { TableResponseDto, TableSessionResponseDto } from '@/types';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/store/useOrderStore';

export function useTableSession(tableCode: string) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use Global Store
    const { table, session, setTable, setSession } = useOrderStore();

    useEffect(() => {
        if (!tableCode) return;

        const initSession = async () => {
            try {
                setIsLoading(true);
                // 1. Verify Table
                const tableRes = await api.get<TableResponseDto>(`/table/verify/${tableCode}`);
                const tableData = tableRes.data;
                setTable(tableData);

                // 2. Check LocalStorage
                const storedSessionId = localStorage.getItem('bunbo_session_id');

                if (storedSessionId) {
                    try {
                        // Check if session is valid
                        const sessionRes = await api.get<TableSessionResponseDto>(`/table/session/${storedSessionId}`);
                        const sessionData = sessionRes.data;

                        // 3. Mismatch Logic
                        if (sessionData.isClosed || sessionData.tableId !== tableData.id) {
                            // Discard old, Open New
                            console.log("Session mismatch/valid, starting new");
                            await openNewSession(tableData.id);
                        } else {
                            // Resume
                            console.log("Resuming session");
                            setSession(sessionData);
                        }
                    } catch (e) {
                        // Session not found (404) -> Open New
                        console.log("Session not found, starting new");
                        await openNewSession(tableData.id);
                    }
                } else {
                    // No session -> Open New
                    await openNewSession(tableData.id);
                }

            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to access table');
                localStorage.removeItem('bunbo_session_id'); // Clear if table invalid
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, [tableCode]);

    const openNewSession = async (tableId: string) => {
        const res = await api.post<TableSessionResponseDto>('/table/session', { tableId });
        const newSession = res.data;
        localStorage.setItem('bunbo_session_id', newSession.id);
        setSession(newSession);
    };

    return { table, session, isLoading, error };
}
