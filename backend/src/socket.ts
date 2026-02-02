import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: SocketServer;

export const initSocket = (server: HttpServer) => {
    io = new SocketServer(server, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a room based on store_id for targeted KDS updates
        socket.on('join_store', (storeId: string) => {
            socket.join(`store:${storeId}`);
            console.log(`Socket ${socket.id} joined store:${storeId}`);
        });

        // Join specific station rooms
        socket.on('join_station', ({ storeId, station }: { storeId: string, station: string }) => {
            const room = `store:${storeId}:station:${station}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const emitOrderFired = (storeId: string, orderData: any) => {
    if (io) {
        // 1. Emit full order to the general store room
        io.to(`store:${storeId}`).emit('order:fired', orderData);

        // 2. Emit station-specific updates if items exist
        if (orderData.items && Array.isArray(orderData.items)) {
            const stations = [...new Set(orderData.items.map((it: any) => it.kds_station))];

            for (const station of stations) {
                const stationItems = orderData.items.filter((it: any) => it.kds_station === station);
                io.to(`store:${storeId}:station:${station}`).emit('order:fired', {
                    ...orderData,
                    items: stationItems
                });
            }
        }
    }
};
