const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('../models/db');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(session({
    secret: 'test', //make dotenv after i worjjjk
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.post('/auth/login', async function(req, res, next) {
    try {
        const user = await db.query(`SELECT * FROM Users WHERE username = ${req.body.username};`);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
        }
        
    } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Export the app instead of listening here
module.exports = app;
