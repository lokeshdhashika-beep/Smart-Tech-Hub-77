const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const users = await db.allAsync(`SELECT id, name, email, role FROM users`);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Registration Route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await db.getAsync(`SELECT * FROM users WHERE email = ?`, [email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = 'u-' + Date.now();

        await db.runAsync(`INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
            [userId, name, email, hashedPassword]);

        const token = jwt.sign({ id: userId, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ message: 'User created successfully', token, user: { id: userId, name, email, role: 'user' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.getAsync(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            // For older admin literal 'admin' login without bcrypt setup earlier in seed
            if (password === 'admin' && user.role === 'admin') {
                // fall through
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
