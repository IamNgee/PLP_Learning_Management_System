// Import the packages
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Initialize the server (app)
const app = express();

// Set up the middleware
app.use(express.json());
app.use(cors());
dotenv.config();

// Create a database connection
const dbconnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'plp_users'
});

// Connect to database server (check connection)
dbconnection.connect((err) => {
    if (err) return console.log(err);
    console.log('Connected to the DB server');

    // Create database if it doesn't exist
    dbconnection.query('CREATE DATABASE IF NOT EXISTS plp_users', (err, result) => {
        if (err) return console.log(err);
        console.log('Database plp_users was created successfully');
    });

    // Use the database
    dbconnection.query('USE plp_users', (err, result) => {
        if (err) return console.log(err);
        console.log('Database changed');
    });

    // Create users table if it doesn't exist
    const createTableQuery = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL
    );`;

    dbconnection.query(createTableQuery, (err, result) => {
        if (err) return console.log(err);
        console.log('Users table was created successfully');
    });
});

// User registration endpoint
app.post('/api/register', (req, res) => {
    const { email, username, password } = req.body;

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error hashing password' });

        // Insert user into the database
        const insertQuery = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
        dbconnection.query(insertQuery, [email, username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// User login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Fetch user from the database
    const selectQuery = 'SELECT * FROM users WHERE username = ?';
    dbconnection.query(selectQuery, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = results[0];
        // Compare passwords
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

            res.status(200).json({ message: 'Login successful', user });
        });
    });
});

// Start the server
app.listen(330, () => {
    console.log('Server is running on port 330');
});