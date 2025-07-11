const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // const password_hash = await bcrypt.hash(password, 10);

  // would use the above password_hash in the queries below to properly hash before searching,
  // example users in the db are not setup for this though, as they dont use proper hashes
  try {
    // search for users by email
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);
    // search for users by username
    const [rows2] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE username = ? AND password_hash = ?
    `, [email, password]);

    // if no users found by email OR username, return invalid credentials
    if (rows.length === 0 && rows2.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // get user that returned valid search
    const user = rows[0] ? rows[0] : rows2[0];
    // store user login in the session cookie
    req.session.user = user;
    // return the users role and success message
    res.json({ message: 'Login successful', role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed'+error });
  }
});

// logout route
router.get('/logout', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  req.session.destroy();
  return res.json({ logout: 'Successfully logged out' });
});

// get session user's dogs
router.get('/dogs', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  // get all dogs from current session user
  const [dogs] = await db.query(`SELECT * FROM Dogs WHERE owner_id = ${req.session.user.user_id};`);
  // create and return array of dog names and ids (returns empty array if none owned)
  const dognames = [];
  for (let dog of dogs) {
    dognames.push({ name: dog.name, id: dog.dog_id });
  }
  return res.json(dognames);
});

module.exports = router;
