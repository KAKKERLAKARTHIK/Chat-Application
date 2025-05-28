// server/src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { sequelize } from './db.js';
import { initSocket } from './socket.js';

import searchRouter from './search.js';
import usersRouter from './user.js';
import chatsRouter from './chats.js';

const app = express();
const server = http.createServer(app);

// 1️⃣ initialize Socket.IO
initSocket(server);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });

app.use('/api/users/search', searchRouter);
app.use('/api/users', usersRouter);

// 2️⃣ mount the chats router **without** req.io middleware
app.use('/api/chats', chatsRouter);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connection OK');
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('DB connection failed:', err);
  }
})();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`API listening on port ${PORT}`));
