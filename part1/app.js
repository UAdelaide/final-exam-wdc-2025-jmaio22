var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
var fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api',apiRouter);

let db;

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: ''
    });

    // create dogwalk db
    const schema_path = path.join(__dirname, 'dogwalks.sql');
    const schema = fs.readFileSync(schema_path, 'utf8');
    await connection.query(schema);
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // insert test data into db
    await db.execute(`
INSERT INTO Users (username, email, password_hash, role) VALUES ('alice123', 'alice@example.com', 'hashed123', 'owner');
INSERT INTO Users (username, email, password_hash, role) VALUES ('bobwalker', 'bob@example.com', 'hashed456', 'walker');
INSERT INTO Users (username, email, password_hash, role) VALUES ('carol123', 'carol@example.com', 'hashed789', 'owner');
INSERT INTO Users (username, email, password_hash, role) VALUES ('bobbert12', 'bbb@example.com', 'hashed000', 'walker');
INSERT INTO Users (username, email, password_hash, role) VALUES ('idontknow', 'hello@example.com', 'hashed111', 'walker');
INSERT INTO Dogs (owner_id, name, size) SELECT user_id, 'Max' , 'medium' FROM Users WHERE username = 'alice123';
INSERT INTO Dogs (owner_id, name, size) SELECT user_id, 'Bella' , 'small' FROM Users WHERE username = 'carol123';
INSERT INTO Dogs (owner_id, name, size) SELECT user_id, 'Teddy' , 'small' FROM Users WHERE username = 'alice123';
INSERT INTO Dogs (owner_id, name, size) SELECT user_id, 'Podgy' , 'small' FROM Users WHERE username = 'alice123';
INSERT INTO Dogs (owner_id, name, size) SELECT user_id, 'Rupert' , 'large' FROM Users WHERE username = 'carol123';
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
SELECT dog_id, '2025-06-10 08:00:00' , '30', 'Parklands', 'open' FROM Dogs WHERE name = 'Max' AND size = 'medium';
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
SELECT dog_id, '2025-06-10 09:30:00' , '45', 'Beachside Ave', 'accepted' FROM Dogs WHERE name = 'Bella' AND size = 'small';
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
SELECT dog_id, '2025-06-10 06:30:00' , '30', 'Rymil Park', 'completed' FROM Dogs WHERE name = 'Podgy' AND size = 'small';
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
SELECT dog_id, '2025-06-10 09:45:00' , '60', 'Victoria Park', 'open' FROM Dogs WHERE name = 'Teddy' AND size = 'small';
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
SELECT dog_id, '2025-09-10 02:30:00' , '10', 'West Beach', 'cancelled' FROM Dogs WHERE name = 'Rupert' AND size = 'large';
    `);
  } catch (err) {
    console.error('Error setting up database.', err);
  }
})();


module.exports = app;
