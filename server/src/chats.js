// server/src/chats.js
import express from 'express'
import { sequelize } from './db.js'
import { QueryTypes } from 'sequelize'
import { getIO } from './socket.js'   // no getIO() at top

const router = express.Router()

// GET /api/chats/user/:userId
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10)
  try {
    const chats = await sequelize.query(
      `
      SELECT
        cm.chat_id               AS chatId,
        cm2.user_id              AS participantId,
        u.name                   AS participantName,
        p.avatar_url             AS avatarUrl,
        p.status_message         AS statusMessage,
        p.last_seen              AS lastSeen,
        (SELECT m.text
           FROM messages m
          WHERE m.chat_id = cm.chat_id
          ORDER BY m.created_at DESC
          LIMIT 1)                AS lastMessage,
        (SELECT m.created_at
           FROM messages m
          WHERE m.chat_id = cm.chat_id
          ORDER BY m.created_at DESC
          LIMIT 1)                AS lastMessageTime
      FROM chat_members cm
      JOIN chat_members cm2
        ON cm2.chat_id = cm.chat_id
       AND cm2.user_id != :userId
      JOIN users u
        ON u.id = cm2.user_id
      LEFT JOIN profiles p
        ON p.user_id = cm2.user_id
      WHERE cm.user_id = :userId
      ORDER BY lastMessageTime DESC
      `,
      { replacements: { userId }, type: QueryTypes.SELECT }
    )
    return res.json(chats)
  } catch (err) {
    console.error('Error fetching chat list:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/chats
router.post('/', async (req, res) => {
  const { participantIds } = req.body
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    return res.status(400).json({ error: 'Provide at least two participantIds' })
  }
  try {
    const chatId = await sequelize.transaction(async (t) => {
      const [inserted] = await sequelize.query(
        `INSERT INTO chats () VALUES ();`,
        { type: QueryTypes.INSERT, transaction: t }
      )
      const rows = participantIds.map(uid => `(${inserted}, ${uid})`).join(',')
      await sequelize.query(
        `INSERT INTO chat_members (chat_id, user_id) VALUES ${rows};`,
        { transaction: t }
      )
      return inserted
    })
    return res.status(201).json({ chatId })
  } catch (err) {
    console.error('Error creating chat:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/chats/:chatId
router.get('/:chatId', async (req, res) => {
  const chatId = parseInt(req.params.chatId, 10)
  try {
    const participants = await sequelize.query(
      `
      SELECT
        u.id,
        u.name,
        p.avatar_url     AS avatarUrl,
        p.status_message AS statusMessage,
        p.last_seen      AS lastSeen
      FROM chat_members cm
      JOIN users u
        ON cm.user_id = u.id
      LEFT JOIN profiles p
        ON p.user_id = u.id
      WHERE cm.chat_id = :chatId
      `,
      { replacements: { chatId }, type: QueryTypes.SELECT }
    )

    const messages = await sequelize.query(
      `
      SELECT
        m.id,
        m.text,
        m.created_at     AS createdAt,
        u.id             AS senderId,
        u.name           AS senderName,
        p.avatar_url     AS senderAvatar,
        p.status_message AS senderStatus
      FROM messages m
      JOIN users u
        ON m.sender_id = u.id
      LEFT JOIN profiles p
        ON p.user_id = u.id
      WHERE m.chat_id = :chatId
      ORDER BY m.created_at ASC
      `,
      { replacements: { chatId }, type: QueryTypes.SELECT }
    )

    return res.json({ chatId, participants, messages })
  } catch (err) {
    console.error('Error loading chat details:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/chats/message
router.post('/message', async (req, res) => {
  let { senderId, receiverId, text } = req.body
  senderId   = parseInt(senderId, 10)
  receiverId = parseInt(receiverId, 10)

  if (!senderId || !receiverId || !text) {
    return res
      .status(400)
      .json({ error: 'senderId, receiverId and text are required' })
  }

  try {
    const newMsg = await sequelize.transaction(async (t) => {
      // 1️⃣ Lookup or create chat
      const [found] = await sequelize.query(
        `
        SELECT cm1.chat_id
          FROM chat_members cm1
          JOIN chat_members cm2
            ON cm2.chat_id = cm1.chat_id
           AND cm2.user_id = :receiverId
         WHERE cm1.user_id = :senderId
         LIMIT 1
        `,
        {
          replacements: { senderId, receiverId },
          type: QueryTypes.SELECT,
          transaction: t,
        }
      )

      let chatId = found?.chat_id
      if (!chatId) {
        const [created] = await sequelize.query(
          `INSERT INTO chats () VALUES ();`,
          { type: QueryTypes.INSERT, transaction: t }
        )
        chatId = created
        await sequelize.query(
          `
          INSERT INTO chat_members (chat_id, user_id)
          VALUES
            (:chatId, :senderId),
            (:chatId, :receiverId)
          `,
          {
            replacements: { chatId, senderId, receiverId },
            type: QueryTypes.INSERT,
            transaction: t,
          }
        )
      }

      // 2️⃣ Insert message
      const [msgId] = await sequelize.query(
        `
        INSERT INTO messages (chat_id, sender_id, text, created_at)
        VALUES (:chatId, :senderId, :text, NOW());
        `,
        { replacements: { chatId, senderId, text }, type: QueryTypes.INSERT, transaction: t }
      )

      // 3️⃣ Fetch and return it
      const [msg] = await sequelize.query(
        `
        SELECT
          m.id,
          m.chat_id     AS chatId,
          m.text,
          m.created_at  AS createdAt,
          u.id          AS senderId,
          u.name        AS senderName,
          p.avatar_url  AS senderAvatar,
          p.status_message AS senderStatus
        FROM messages m
        JOIN users u
          ON u.id = m.sender_id
        LEFT JOIN profiles p
          ON p.user_id = u.id
        WHERE m.id = :msgId
        `,
        { replacements: { msgId }, type: QueryTypes.SELECT, transaction: t }
      )

      return msg
    })

    // 4️⃣ Broadcast after transaction
    const io = getIO()
    io.to(`chat_${newMsg.chatId}`).emit('newMessage', newMsg)

    // 5️⃣ Send response
    return res.status(201).json(newMsg)
  } catch (err) {
    console.error('Error saving message:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
