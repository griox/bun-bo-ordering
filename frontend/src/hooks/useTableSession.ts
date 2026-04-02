import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { TableResponseDto, TableSessionResponseDto } from '@/types';
import { useOrderStore } from '@/store/useOrderStore';

export function useTableSession(tableCode: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use Global Store
    const { table, session, setTable, setSession } = useOrderStore();

    useEffect(() => {
        if (!tableCode) return;

        const openNewSession = async (tableId: string) => {
            const res = await axiosInstance.post<TableSessionResponseDto>('/table/session', { tableId });
            const newSession = res.data;
            localStorage.setItem('bunbo_session_id', newSession.id);
            setSession(newSession);
        };

        const initSession = async () => {
            try {
                setIsLoading(true);
                // 1. Verify Table
                const tableRes = await axiosInstance.get<TableResponseDto>(`/table/verify/${tableCode}`);
                const tableData = tableRes.data;
                setTable(tableData);

                // 2. Check LocalStorage
                const storedSessionId = localStorage.getItem('bunbo_session_id');

                if (storedSessionId) {
                    try {
                        // Check if session is valid
                        const sessionRes = await axiosInstance.get<TableSessionResponseDto>(`/table/session/${storedSessionId}`);
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
                    } catch {
                        // Session not found (404) -> Open New
                        console.log("Session not found, starting new");
                        await openNewSession(tableData.id);
                    }
                } else {
                    // No session -> Open New
                    await openNewSession(tableData.id);
                }

            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to access table';
                // Type assertion for axios error matching structure
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || errorMsg);
                localStorage.removeItem('bunbo_session_id'); // Clear if table invalid
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();
    }, [tableCode, setSession, setTable]);

    return { table, session, isLoading, error };
}
