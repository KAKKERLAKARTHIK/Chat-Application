// src/socket.js
import { io } from 'socket.io-client';

// point this at your API server
const SOCKET_URL =   'http://localhost:3000';

const socket = io(SOCKET_URL, {
  autoConnect: false,        // we’ll connect when ChatWindow mounts
  transports: ['websocket'], // optional, forces WebSocket
});

export default socket;
