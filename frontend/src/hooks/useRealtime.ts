'use client';

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderNotificationStore, OrderNotification } from '@/store/useOrderNotificationStore';
import { useOrderStore } from '@/store/useOrderStore';
import { toast } from 'sonner';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:8000/hub/notifications';

export const useRealtime = () => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const { token, user } = useAuthStore();
    const addOrder = useOrderNotificationStore((state) => state.addOrder);

    useEffect(() => {
        if (!token || !user) return;

        // Sound notification
        const playNotificationSound = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            // Browser autoplay policies might block this if user hasn't interacted
            // Using console.warn instead of console.error to prevent Next.js dev overlay from crashing
            audio.play().catch(e => console.warn("Browser autoplay blocked the notification sound.", e));
        };

        let isStopped = false;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveNewOrder", (order: OrderNotification) => {
            console.log("New order received:", order);
            addOrder(order);
            playNotificationSound();
            toast.success(`Đơn hàng mới từ bàn ${order.tableNumber}`, {
                description: "Nhấn vào chuông để xem chi tiết",
                duration: 5000,
            });
        });

        connection.on("PaymentSuccess", (data: { orderId: string, transactionId: string }) => {
            console.log("Payment completed via SePay:", data);
            useOrderStore.getState().setPaymentSuccess(data.orderId);
            playNotificationSound();
            toast.success(`Thanh toán thành công!`, {
                description: `Mã giao dịch: ${data.transactionId}`
            });
        });

        const startConnection = async () => {
            if (isStopped) return;
            if (connection.state !== signalR.HubConnectionState.Disconnected) return;

            try {
                await connection.start();
                if (isStopped) {
                    await connection.stop();
                    return;
                }
                console.log("Connected to SignalR Hub");

                // Join Kitchen group if user is Admin
                if (user.role === 'Admin') {
                    await connection.invoke("JoinKitchenGroup");
                    console.log("Joined Kitchen Group");
                }
            } catch (err: unknown) {
                if (isStopped) return;

                const errorMsg = err instanceof Error ? err.message : String(err);

                // SignalR standard error message for aborted connections
                if (errorMsg.includes("stopped during negotiation") ||
                    errorMsg.includes("aborted")) {
                    return;
                }

                console.error("SignalR Connection Error: ", err);
                setTimeout(startConnection, 5000);
            }
        };

        startConnection();
        connectionRef.current = connection;

        return () => {
            isStopped = true;
            if (connection.state !== signalR.HubConnectionState.Disconnected) {
                connection.stop().catch(() => { }); // Silence stop errors during unmount
            }
        };
    }, [token, user, addOrder]);

    return { connectionRef };
};
