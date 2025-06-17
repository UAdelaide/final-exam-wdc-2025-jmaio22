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
        const [dogs] = await db.query('SELECT Dogs.name AS dog_name, size, Users.username AS owner_username FROM Dogs JOIN Users ON Users.user_id = Dogs.owner_id;');
        await db.end();
        res.json(dogs);
    } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

router.get('/walkrequests/open', function(req, res, next) {
});

router.get('/walkers/summary', function(req, res, next) {
});

module.exports = router;
