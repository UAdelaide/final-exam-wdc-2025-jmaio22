var express = require('express');
var router = express.Router();
var mysql = require('mysql2/promise');

router.get('/dogs', async function(req, res, next) {
    try {
        let db;
        db = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'DogWalkService',
        multipleStatements: true
        });
        await db.query(SELECT );
        await db.end();
    } catch (err) {
    console.error('Error setting up database.', err);
  }
});

router.get('/walkrequests/open', function(req, res, next) {
});

router.get('/walkers/summary', function(req, res, next) {
});

module.exports = router;
