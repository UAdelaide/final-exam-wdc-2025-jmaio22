const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const session = require('express-session');
const db = require('./models/db');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(session({
    secret: 'secret', // in real application i would use process.env.SECRET or something similar, but hardcoded right now to allow tutor testing
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// final question route
app.get('/api/dogs', async function(req, res, next) {
    try {
        const [dogs] = await db.query('SELECT Dogs.name AS dog_name, size, Users.username AS owner_username FROM Dogs JOIN Users ON Users.user_id = Dogs.owner_id;');
        res.json(dogs);
    } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Export the app instead of listening here
module.exports = app;
