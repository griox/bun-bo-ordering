'use client';

import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderNotificationStore, OrderNotification } from '@/store/useOrderNotificationStore';
import { useOrderStore } from '@/store/useOrderStore';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
    const { session } = useOrderStore();
    const addOrder = useOrderNotificationStore((state) => state.addOrder);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Don't attempt SignalR connection without a valid token
        // The hub requires [Authorize], so connecting without token = 401 infinite retry
        if (!token) {
            // If user logged out and connection exists, stop it
            if (globalConnection && globalConnection.state !== signalR.HubConnectionState.Disconnected) {
                globalConnection.stop().catch(() => {});
                globalConnection = null;
            }
            queueMicrotask(() => setConnectionStatus(signalR.HubConnectionState.Disconnected));
            return;
        }

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            globalConnection.on("ReceiveNewOrder", (rawOrder: any) => {
                console.log("New order received:", rawOrder);

                const order: OrderNotification = {
                    orderId: rawOrder.orderId || rawOrder.OrderId,
                    tableNumber: rawOrder.tableNumber || rawOrder.TableNumber || rawOrder.tableCode || rawOrder.TableCode || "N/A",
                    items: rawOrder.items || rawOrder.Items || [],
                    status: rawOrder.status || rawOrder.Status || 'Created',
                    createdAt: rawOrder.createdAt || rawOrder.CreatedAt || new Date().toISOString()
                };

                addOrder(order);
                playNotificationSound();
                toast.success(`Đơn hàng mới từ bàn ${order.tableNumber}`, {
                    description: "Nhấn vào chuông để xem chi tiết",
                    duration: 5000,
                });
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['unread-orders'] });
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            globalConnection.on("OrderConfirmed", (data: any) => {
                console.log("OrderConfirmed received:", data);
                const orderId = data.orderId || data.OrderId;
                toast.success("Đơn hàng của bạn đã được tiếp nhận!", {
                    description: orderId ? `Mã đơn: #${orderId.substring(0, 8).toUpperCase()}` : ""
                });
                queryClient.invalidateQueries({ queryKey: ['sessionData'] });
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['unread-orders'] });
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            globalConnection.on("OrderUpdated", (rawUpdate: any) => {
                console.log("OrderUpdated received:", rawUpdate);
                const orderId = rawUpdate.orderId || rawUpdate.OrderId;
                const newStatus = rawUpdate.newStatus || rawUpdate.NewStatus;

                if (orderId && newStatus) {
                    useOrderNotificationStore.getState().updateOrderStatus(orderId, newStatus);

                    toast.info(`Đơn hàng ${orderId.substring(0, 8).toUpperCase()} đã chuyển sang: ${newStatus}`);
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    queryClient.invalidateQueries({ queryKey: ['unread-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['sessionData'] });
                }
            });

            globalConnection.on("PaymentSuccess", (data: { orderId?: string; OrderId?: string; transactionId?: string; TransactionId?: string }) => {
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
                queryClient.invalidateQueries({ queryKey: ['orders'] });
                queryClient.invalidateQueries({ queryKey: ['unread-orders'] });
                queryClient.invalidateQueries({ queryKey: ['sessionData'] });
            });
        }

        const connection = globalConnection;

        const syncGroups = async () => {
            if (connection.state !== signalR.HubConnectionState.Connected) return;

            try {
                if (user?.role === 'Admin') {
                    await connection.invoke("JoinKitchenGroup").catch((err) => {
                        console.error("!!! SIGNALR ERROR: Failed to join KitchenGroup:", err);
                    });
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

        // Call it immediately
        syncGroups();

        const startConnection = async () => {
            const currentToken = useAuthStore.getState().token;
            if (!currentToken) return; // Abort if logged out

            if (connection.state === signalR.HubConnectionState.Disconnected) {
                try {
                    await connection.start();
                    console.log("Connected to SignalR Hub");
                    setConnectionStatus(signalR.HubConnectionState.Connected);
                } catch (err: unknown) {
                    console.warn("SignalR Connection Error (will retry):", err);
                    setConnectionStatus(signalR.HubConnectionState.Disconnected);
                    if (!isStopped) setTimeout(startConnection, 5000);
                }
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
            console.warn("!!! SIGNALR: Connection closed permanently. Attempting to start a fresh connection...");
            setConnectionStatus(signalR.HubConnectionState.Disconnected);
            if (!isStopped) setTimeout(startConnection, 5000);
        });

        startConnection();

        return () => {
            isStopped = true;
            // We DON'T stop the global connection here to avoid churn.
            // It will stay alive for the lifetime of the app.
        };
    }, [token, addOrder, user?.role, session?.id, queryClient]);

    // Separate effect for syncing groups to avoid connection churn
    useEffect(() => {
        const sync = async () => {
            if (!globalConnection || globalConnection.state !== signalR.HubConnectionState.Connected) return;

            try {
                if (user?.role === 'Admin') {
                    console.log("!!! SIGNALR: Joining KitchenGroup");
                    await globalConnection.invoke("JoinKitchenGroup").catch((err) => {
                        console.error("!!! SIGNALR ERROR: Failed to join KitchenGroup in dynamic sync:", err);
                    });
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
