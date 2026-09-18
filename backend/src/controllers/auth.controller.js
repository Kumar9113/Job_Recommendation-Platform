const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

const SALT_ROUNDS = 10;

// POST /api/auth/register
// Flow: validate input -> check duplicate email -> hash password ->
// insert user -> create an empty profile row -> return JWT
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Never store plain-text passwords. bcrypt.hash adds a random "salt"
  // and runs the hashing algorithm SALT_ROUNDS times, making brute
  // force / rainbow-table attacks impractical.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const userResult = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  const user = userResult.rows[0];

  await pool.query(
    'INSERT INTO profiles (user_id, full_name) VALUES ($1, $2)',
    [user.id, fullName || null]
  );

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({
    message: 'Registration successful.',
    token,
    user: { id: user.id, email: user.email },
  });
});

// POST /api/auth/login
// Flow: find user by email -> compare password with stored hash ->
// issue JWT if correct
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  // Same error message whether email doesn't exist or password is
  // wrong -- this avoids leaking which emails are registered.
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: { id: user.id, email: user.email },
  });
});

module.exports = { register, login };
