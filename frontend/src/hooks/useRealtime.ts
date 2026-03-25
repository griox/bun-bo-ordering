'use client';

import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderNotificationStore, OrderNotification } from '@/store/useOrderNotificationStore';
import { useOrderStore } from '@/store/useOrderStore';
import { toast } from 'sonner';

const getHubUrl = () => {
    // Priority: 1. ENV VAR, 2. Current origin if accessing through gateway, 3. Localhost:8000
    if (process.env.NEXT_PUBLIC_HUB_URL) return process.env.NEXT_PUBLIC_HUB_URL;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${baseUrl}/hub/notifications`;
};

const HUB_URL = getHubUrl();

let globalConnection: signalR.HubConnection | null = null;

export const useRealtime = () => {
    const [connectionStatus, setConnectionStatus] = useState<signalR.HubConnectionState>(
        globalConnection?.state || signalR.HubConnectionState.Disconnected
    );

    const { token, user } = useAuthStore();
    const { session, setPaymentSuccess } = useOrderStore();
    const addOrder = useOrderNotificationStore((state) => state.addOrder);

    useEffect(() => {
        console.log("SignalR Effect Sync:", {
            hasToken: !!token,
            role: user?.role,
            sessionId: session?.id,
            connectionState: globalConnection?.state
        });

        // Sound notification
        const playNotificationSound = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.warn("Browser autoplay blocked the notification sound.", e));
        };

        let isStopped = false;

        if (!globalConnection) {
            globalConnection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    accessTokenFactory: () => useAuthStore.getState().token || ""
                })
                .configureLogging(signalR.LogLevel.Information) // Show detailed logs for debugging
                .withAutomaticReconnect()
                .build();

            globalConnection.on("JoinedGroup", (groupName: string) => {
                console.log("!!! SIGNALR GROUP JOIN CONFIRMED !!!", groupName);
            });

            globalConnection.on("ReceiveNewOrder", (order: OrderNotification) => {
                console.log("New order received:", order);
                addOrder(order);
                playNotificationSound();
                toast.success(`Đơn hàng mới từ bàn ${order.tableNumber}`, {
                    description: "Nhấn vào chuông để xem chi tiết",
                    duration: 5000,
                });
            });

            globalConnection.on("PaymentSuccess", (data: any) => {
                const orderId = data.orderId || data.OrderId;
                const transactionId = data.transactionId || data.TransactionId;

                console.log("!!! SignalR PaymentSuccess RECEIVED !!!", { orderId, transactionId });

                if (orderId) {
                    console.log("Updating paymentSuccessOrderId in store:", orderId);
                    useOrderStore.getState().setPaymentSuccess(orderId);
                } else {
                    console.error("SignalR PaymentSuccess received but orderId is missing!", data);
                }

                playNotificationSound();
                toast.success(`Thanh toán thành công!`, {
                    description: `Mã giao dịch: ${transactionId || ""}`
                });
            });
        }

        const connection = globalConnection;

        const syncGroups = async () => {
            if (connection.state !== signalR.HubConnectionState.Connected) return;

            try {
                if (user?.role === 'Admin') {
                    await connection.invoke("JoinKitchenGroup").catch(() => { });
                }

                if (session?.id) {
                    console.log(`!!! SIGNALR: Attempting to join Table-${session.id}. Connection state: ${connection.state}`);
                    await connection.invoke("JoinTableGroup", session.id).catch((err) => {
                        console.error(`!!! SIGNALR ERROR: Failed to join Table-${session.id}:`, err);
                    });
                } else {
                    console.log("!!! SIGNALR: Skipping table join because session.id is missing.");
                }
            } catch (err) {
                console.warn("Failed to sync SignalR groups:", err);
            }
        };

        connection.onreconnecting(() => {
            console.log("!!! SIGNALR: Attempting to reconnect...");
            setConnectionStatus(signalR.HubConnectionState.Reconnecting);
        });

        connection.onreconnected(() => {
            console.log("!!! SIGNALR: Reconnected successfully !!!");
            setConnectionStatus(signalR.HubConnectionState.Connected);
        });

        connection.onclose(() => {
            console.warn("!!! SIGNALR: Connection closed.");
            setConnectionStatus(signalR.HubConnectionState.Disconnected);
        });

        const startConnection = async () => {
            if (connection.state === signalR.HubConnectionState.Disconnected) {
                try {
                    await connection.start();
                    console.log("Connected to SignalR Hub");
                    setConnectionStatus(signalR.HubConnectionState.Connected);
                } catch (err: any) {
                    console.warn("SignalR Connection Error (will retry):", err);
                    setConnectionStatus(signalR.HubConnectionState.Disconnected);
                    if (!isStopped) setTimeout(startConnection, 5000);
                }
            }
        };

        startConnection();

        return () => {
            isStopped = true;
            // We DON'T stop the global connection here to avoid churn.
            // It will stay alive for the lifetime of the app.
        };
    }, [token, addOrder]);

    // Separate effect for syncing groups to avoid connection churn
    useEffect(() => {
        const sync = async () => {
            if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) return;

            try {
                if (user?.role === 'Admin') {
                    console.log("!!! SIGNALR: Joining KitchenGroup");
                    await globalConnection.invoke("JoinKitchenGroup").catch(() => { });
                }

                if (session?.id) {
                    console.log(`!!! SIGNALR: Joining Table-${session.id}`);
                    await globalConnection.invoke("JoinTableGroup", session.id).catch((err) => {
                        console.error(`!!! SIGNALR ERROR: Failed to join Table-${session.id}:`, err);
                    });
                } else {
                    console.log("!!! SIGNALR: No session ID found - skipping table join.");
                }
            } catch (err) {
                console.error("!!! SIGNALR SYNC ERROR:", err);
            }
        };

        sync();
    }, [session?.id, user?.role, connectionStatus]);

    return { connection: globalConnection, connectionStatus };
};
