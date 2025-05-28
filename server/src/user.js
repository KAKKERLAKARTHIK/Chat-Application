// server/src/routes/users.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sequelize } from './db.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();

// Shim __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage for avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// POST /api/users — Sign up
router.post('/', upload.single('avatar'), async (req, res) => {
  const { username, name, email, password } = req.body;
  const avatarFile = req.file;
  if (!username || !name || !email || !password || !avatarFile) {
    return res.status(400).json({ error: 'username, name, email, password & avatar required' });
  }
  const t = await sequelize.transaction();
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [insertId] = await sequelize.query(
      `INSERT INTO users (username, name, email, password_hash)
       VALUES (:username, :name, :email, :passwordHash)`,
      { replacements: { username, name, email, passwordHash: hashed }, transaction: t, type: QueryTypes.INSERT }
    );
    const avatarUrl = `/uploads/${avatarFile.filename}`;
    await sequelize.query(
      `INSERT INTO profiles (user_id, avatar_url, last_seen)
       VALUES (:userId, :avatarUrl, NOW())`,
      { replacements: { userId: insertId, avatarUrl }, transaction: t, type: QueryTypes.INSERT }
    );
    await t.commit();
    const [user] = await sequelize.query(
      `SELECT u.id, u.username, u.name, u.email,
              p.avatar_url AS avatarUrl, p.status_message AS statusMessage, p.last_seen AS lastSeen
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = :userId`,
      { replacements: { userId: insertId }, type: QueryTypes.SELECT }
    );
    res.status(201).json({ user, chats: [] }); // empty chats initially
  } catch (err) {
    await t.rollback();
    console.error('Signup error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login — Authenticate & return user + chats
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  console.log('Login attempt with identifier:', identifier);
  console.log('Login attempt with password:', password);
  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier and password required' });
  }
try{
  const [userRecord] = await sequelize.query(
    `SELECT
       u.id,
       u.username,
       u.name,
       u.email,
       u.password_hash    AS hash,
       p.avatar_url       AS avatarUrl,
       p.status_message   AS statusMessage,
       p.last_seen        AS lastSeen
     FROM users u
     JOIN profiles p
       ON p.user_id = u.id
     WHERE u.username = :identifier
        OR u.email    = :identifier`,
    { replacements: { identifier }, type: QueryTypes.SELECT }
  );

    // invalid email or bad password
    if (!userRecord || !(await bcrypt.compare(password, userRecord.hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // update last_seen
    await sequelize.query(
      `UPDATE profiles 
         SET last_seen = NOW() 
       WHERE user_id = :userId`,
      { replacements: { userId: userRecord.id }, type: QueryTypes.UPDATE }
    );

    // fetch chats as before
    const chats = await sequelize.query(
      `SELECT 
         cm.chat_id            AS chatId, 
         cm2.user_id           AS participantId, 
         u.name                AS participantName,
         p.avatar_url          AS avatarUrl, 
         p.status_message      AS statusMessage, 
         p.last_seen           AS lastSeen,
         (SELECT m.text 
            FROM messages m 
           WHERE m.chat_id = cm.chat_id 
           ORDER BY m.created_at DESC 
           LIMIT 1)            AS lastMessage,
         (SELECT m.created_at 
            FROM messages m 
           WHERE m.chat_id = cm.chat_id 
           ORDER BY m.created_at DESC 
           LIMIT 1)            AS lastMessageTime
       FROM chat_members cm
       JOIN chat_members cm2 
         ON cm2.chat_id = cm.chat_id 
        AND cm2.user_id != :userId
       JOIN users u 
         ON u.id = cm2.user_id
       LEFT JOIN profiles p 
         ON p.user_id = cm2.user_id
       WHERE cm.user_id = :userId
       ORDER BY lastMessageTime DESC;`,
      { replacements: { userId: userRecord.id }, type: QueryTypes.SELECT }
    );

    delete userRecord.hash;
    res.json({ user: userRecord, chats });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


 

// GET /api/users/:id/contacts — Fetch list of unique chat participants
router.get('/:id/contacts', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  try {
    const contacts = await sequelize.query(
      `SELECT DISTINCT
         u.id            AS id,
         u.username      AS username,
         u.name          AS name,
         p.avatar_url    AS avatarUrl,
         p.status_message AS statusMessage,
         p.last_seen     AS lastSeen
       FROM chat_members cm
       JOIN chat_members cm2 ON cm2.chat_id = cm.chat_id AND cm2.user_id != :userId
       JOIN users u ON u.id = cm2.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE cm.user_id = :userId;`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/:id/contacts', async (req, res) => {
  console.log('💬 POST /api/users/:id/contacts hit for user', req.params.id);
  const userId = parseInt(req.params.id, 10);
  const { contactId } = req.body;
  if (!contactId) {
    return res.status(400).json({ error: 'contactId is required' });
  }

  const t = await sequelize.transaction();
  try {
    // 1) Create a new chat
    const [chatResult] = await sequelize.query(
      `INSERT INTO chats () VALUES ()`,
      { transaction: t, type: QueryTypes.INSERT }
    );
    const chatId = chatResult;

    // 2) Add both participants
    await sequelize.query(
      `INSERT INTO chat_members (chat_id, user_id)
       VALUES (:chatId, :userId), (:chatId, :contactId)`,
      {
        replacements: { chatId, userId, contactId },
        transaction: t,
        type: QueryTypes.INSERT
      }
    );

    await t.commit();

    // 3) Fetch and return the new contact info
    const [newContact] = await sequelize.query(
      `SELECT cm2.chat_id       AS chatId,
              cm2.user_id       AS id,
              u.username        AS username,
              u.name            AS name,
              p.avatar_url      AS avatarUrl,
              p.status_message  AS statusMessage,
              p.last_seen       AS lastSeen
       FROM chat_members cm2
       JOIN users u ON u.id = cm2.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE cm2.chat_id = :chatId
         AND cm2.user_id != :userId`,
      { replacements: { chatId, userId }, type: QueryTypes.SELECT }
    );

    res.status(201).json(newContact);
  } catch (err) {
    await t.rollback();
    console.error('Error creating contact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
