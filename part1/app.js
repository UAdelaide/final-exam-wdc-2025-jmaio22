var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
var fs = require('fs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

let db;

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    // create dogwalk db from .sql file
    const schema_path = path.join(__dirname, 'dogwalks.sql');
    const schema = fs.readFileSync(schema_path, 'utf8');
    await connection.query(schema);
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'DogWalkService',
      multipleStatements: true
    });

    // insert test data into db
    await db.query(`
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
INSERT INTO WalkRatings (rating_id, request_id, walker_id, owner_id, rating, comments) VALUES (1, 1, 2, 1, 5, 'great guy');
INSERT INTO WalkRatings (rating_id, request_id, walker_id, owner_id, rating, comments) VALUES (2, 2, 2, 2, 2, 'trash');
INSERT INTO WalkRatings (rating_id, request_id, walker_id, owner_id, rating, comments) VALUES (3, 3, 2, 1, 3, 'he didnt pat my dog');
INSERT INTO WalkApplications (application_id, request_id, walker_id, status) VALUES (1, 3, 2, 'accepted');
    `);
    await db.end();
  } catch (err) {
    console.error('Error setting up database.', err);
  }
})();

// part 1 routes
app.get('/api/dogs', async function(req, res, next) {
    try {
        let sqldb;
        sqldb = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'DogWalkService',
        multipleStatements: true
        });
        const [dogs] = await sqldb.query('SELECT Dogs.name AS dog_name, size, Users.username AS owner_username FROM Dogs JOIN Users ON Users.user_id = Dogs.owner_id;');
        await db.end();
        res.json(dogs);
    } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.get('/api/walkrequests/open', async function(req, res, next) {
    try {
        let sqldb;
        sqldb = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'DogWalkService',
        multipleStatements: true
        });
        const [requests] = await sqldb.query("SELECT request_id, Dogs.name AS dog_name, requested_time, duration_minutes, location, Users.username AS owner_username FROM WalkRequests JOIN Dogs ON Dogs.dog_id = WalkRequests.dog_id  JOIN Users ON Users.user_id = Dogs.owner_id WHERE WalkRequests.status = 'open';");
        await db.end();
        res.json(requests);
    } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

app.get('/api/walkers/summary', async function(req, res, next) {
    try {
        let sqldb;
        sqldb = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'DogWalkService',
        multipleStatements: true
        });
        const [walkers] = await sqldb.query("SELECT * FROM Users WHERE role = 'walker';");
        const promises = [];
        for (let walker of walkers) {
            // get total ratings
            // let [total_ratings] = await sqldb.query(`SELECT COUNT(walker_id) AS total FROM WalkRatings WHERE walker_id = ${walker.user_id};`);
            // total_ratings = total_ratings[0].total;
            promises.push(sqldb.query(`SELECT COUNT(walker_id) AS value FROM WalkRatings WHERE walker_id = ${walker.user_id};`));
            // get average ratings
            // let [average_rating] = await sqldb.query(`SELECT AVG(rating) AS avg FROM WalkRatings WHERE walker_id = ${walker.user_id};`);
            // average_rating = average_rating[0].avg;
            promises.push(sqldb.query(`SELECT AVG(rating) AS value FROM WalkRatings WHERE walker_id = ${walker.user_id};`));
            // gets applications marked as accepted paired to walk requests marked as completed that are under the same user_id
            // let [completed_walks] = await sqldb.query(`SELECT COUNT(walker_id) AS completed_walks FROM WalkApplications JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id WHERE WalkRequests.status = 'completed' AND WalkApplications.status = 'accepted' AND WalkApplications.walker_id = ${walker.user_id};`);
            // let result = {
            //   walker_username: walker.username,
            //   total_ratings: total_ratings,
            //   average_rating: average_rating,
            //   completed_walks: completed_walks[0]["completed_walks"]
            // };
            // results.push(result);
            promises.push(sqldb.query(`SELECT COUNT(walker_id) AS value FROM WalkApplications JOIN WalkRequests ON WalkApplications.request_id = WalkRequests.request_id WHERE WalkRequests.status = 'completed' AND WalkApplications.status = 'accepted' AND WalkApplications.walker_id = ${walker.user_id};`));
        }
        await db.end();
        // await all sql queries then extract their values
        const results = await Promise.all(promises);
        for (let i = 0; i < results.length; i++) {
          results[i] = results[i][0][0].value;
        }
        console.log(test2);
        res.json(test2);
    } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = app;
