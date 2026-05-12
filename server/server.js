import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initializeDatabase, pool } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);

// ❗ важно: без fallback
if (!process.env.SECRET_KEY) {
  console.error('SECRET_KEY is missing in environment variables');
  process.exit(1);
}

const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Wordle API is running!' });
});

// JWT
function createToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
}

// DB helpers
async function findUserByUsername(username) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.password_hash,
      COALESCE(s.plays, 0) AS plays,
      COALESCE(s.wins, 0) AS wins,
      COALESCE(s.current_streak, 0) AS current_streak,
      COALESCE(s.best_streak, 0) AS best_streak,
      s.last_played_at
    FROM users u
    LEFT JOIN user_stats s ON s.user_id = u.id
    WHERE u.username = $1
    `,
    [username]
  );

  return rows[0] || null;
}

async function getUserProfileById(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      COALESCE(s.plays, 0) AS plays,
      COALESCE(s.wins, 0) AS wins,
      COALESCE(s.current_streak, 0) AS current_streak,
      COALESCE(s.best_streak, 0) AS best_streak,
      s.last_played_at
    FROM users u
    LEFT JOIN user_stats s ON s.user_id = u.id
    WHERE u.id = $1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function getRandomWord() {
  const { rows } = await pool.query(`
    SELECT word
    FROM wordle_words
    WHERE is_active = TRUE
    ORDER BY RANDOM()
    LIMIT 1
  `);

  return rows[0]?.word || null;
}

// format
function formatProfile(user) {
  const plays = Number(user.plays || 0);
  const wins = Number(user.wins || 0);

  return {
    id: user.id,
    username: user.username,
    stats: {
      plays,
      wins,
      losses: plays - wins,
      winRate: plays ? Math.round((wins / plays) * 100) : 0,
      currentStreak: Number(user.current_streak || 0),
      bestStreak: Number(user.best_streak || 0),
      lastPlayedAt: user.last_played_at,
    },
  };
}

// auth middleware
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await getUserProfileById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await findUserByUsername(username.trim());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username
      `,
      [username.trim(), hashedPassword]
    );

    const user = rows[0];

    await pool.query(
      `
      INSERT INTO user_stats (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [user.id]
    );

    const token = createToken(user);
    const profile = await getUserProfileById(user.id);

    res.json({ token, ...formatProfile(profile) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await findUserByUsername(username?.trim());

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = createToken(user);

    res.json({ token, ...formatProfile(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', authenticate, (req, res) => {
  res.json(formatProfile(req.user));
});

app.get('/api/words/random', async (req, res) => {
  try {
    const word = await getRandomWord();

    if (!word) {
      return res.status(404).json({ error: 'No active words found' });
    }

    res.json({ word });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stats', authenticate, async (req, res) => {
  try {
    const { won } = req.body;

    if (typeof won !== 'boolean') {
      return res.status(400).json({ error: 'The "won" field must be a boolean' });
    }

    await pool.query(
      `
      INSERT INTO user_stats (user_id, plays, wins, current_streak, best_streak, last_played_at)
      VALUES ($1, 1, $2, $3, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        plays = user_stats.plays + 1,
        wins = user_stats.wins + $2,
        current_streak = CASE
          WHEN $4 THEN user_stats.current_streak + 1
          ELSE 0
        END,
        best_streak = GREATEST(
          user_stats.best_streak,
          CASE
            WHEN $4 THEN user_stats.current_streak + 1
            ELSE user_stats.best_streak
          END
        ),
        last_played_at = NOW()
      `,
      [req.user.id, won ? 1 : 0, won ? 1 : 0, won]
    );

    const updated = await getUserProfileById(req.user.id);

    res.json(formatProfile(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER (FIXED FOR DOCKER)
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });