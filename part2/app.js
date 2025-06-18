const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const session = require('express-session');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(session({
    secret: 'test',
    resave: false,
    saveUninitialised: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Export the app instead of listening here
module.exports = app;
