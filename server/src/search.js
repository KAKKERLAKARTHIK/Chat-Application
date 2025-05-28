// server/src/routes/search.js
import express from 'express';
import { sequelize } from './db.js';
import { QueryTypes } from 'sequelize';

const router = express.Router();

/**
 * GET /api/users/search
 * Query params: query (string), exclude (userId)
 * Returns list of users whose email or name matches `query`, excluding the current user.
 */
router.get('/', async (req, res) => {
  const { query = '', exclude } = req.query;
  if (query.length < 1) return res.json([]);
  try {
    const users = await sequelize.query(
      `SELECT id, name, email
       FROM users
       WHERE (email LIKE :q OR name LIKE :q)
         AND id != :exclude
       LIMIT 10`,
      {
        replacements: { q: `%${query}%`, exclude: parseInt(exclude, 10) || 0 },
        type: QueryTypes.SELECT
      }
    );
    res.json(users);
  } catch (err) {
    console.error('Search API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/contacts — Create a new chat with another user


export default router;