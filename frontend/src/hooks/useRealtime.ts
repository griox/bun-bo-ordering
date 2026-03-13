'use client';

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/useAuthStore';
import { useKitchenStore, KitchenOrder } from '@/store/useKitchenStore';
import { toast } from 'sonner';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:6000/hub/notifications';

export const useRealtime = () => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const { token, user } = useAuthStore();
    const addOrder = useKitchenStore((state) => state.addOrder);
    
    useEffect(() => {
        if (!token || !user) return;

        // Sound notification
        const playNotificationSound = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.error("Error playing sound:", e));
        };

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveNewOrder", (order: KitchenOrder) => {
            console.log("New order received:", order);
            addOrder(order);
            playNotificationSound();
            toast.success(`Đơn hàng mới từ bàn ${order.tableNumber}`, {
                description: "Nhấn vào chuông để xem chi tiết",
                duration: 5000,
            });
        });

        const startConnection = async () => {
            try {
                await connection.start();
                console.log("Connected to SignalR Hub");
                
                // Join Kitchen group if user is Admin or Staff
                if (user.role === 'Admin' || user.role === 'Staff' || user.role === 'Kitchen') {
                    await connection.invoke("JoinKitchenGroup");
                    console.log("Joined Kitchen Group");
                }
            } catch (err) {
                console.error("SignalR Connection Error: ", err);
                setTimeout(startConnection, 5000);
            }
        };

        startConnection();
        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [token, user, addOrder]);

    return { connection: connectionRef.current };
};
