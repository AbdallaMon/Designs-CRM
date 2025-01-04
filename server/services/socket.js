import {Server} from 'socket.io';

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ORIGIN,
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        // socket.on('join-admin-room', ({userId}) => {
        //     socket.join(userId.toString());
        // });
        socket.on('join-room', ({userId}) => {
            socket.join(userId.toString());
        });

    });
}

export function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}
