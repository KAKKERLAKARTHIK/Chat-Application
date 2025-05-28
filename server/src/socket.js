// socket.js
import { Server } from 'socket.io';

let io;   // will hold our Server instance

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: '*' } });
  io.on('connection', socket => {
    console.log('⚡ [Server] client connected:', socket.id);
    socket.on('joinChat', chatId => {
      socket.join(`chat_${chatId}`);
    });
  });
  return io;
}

// expose it for other modules
export function getIO() {
  if (!io) throw new Error('Socket not initialized!');
  return io;
}
