import {Server} from 'socket.io';
import prisma from '../prisma/prisma.js';

let io;

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ORIGIN,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {

    });
}

export function getIo() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}
