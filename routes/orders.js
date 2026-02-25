const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Create a new order (Checkout)
router.post('/', authenticate, async (req, res) => {
    try {
        const { total, items, shippingAddress } = req.body;
        // items should be [{product_id, quantity, price}]
        const orderId = 'ord-' + Date.now();
        const timestamp = new Date().toISOString();

        await db.runAsync(`INSERT INTO orders (id, user_id, total, status, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [orderId, req.user.id, total, 'Pending', timestamp]);

        for (const item of items) {
            await db.runAsync(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId, item.id || item.product_id, item.quantity, item.price]);
        }

        // Clear user cart after checkout
        await db.runAsync(`DELETE FROM cart_items WHERE user_id = ?`, [req.user.id]);

        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's orders
router.get('/', authenticate, async (req, res) => {
    try {
        const orders = await db.allAsync(`SELECT * FROM orders WHERE user_id = ? ORDER BY timestamp DESC`, [req.user.id]);
        // Also fetch items for each order
        for (let order of orders) {
            order.items = await db.allAsync(`
                SELECT oi.quantity, oi.price, p.name, p.image 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
        }
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all orders
router.get('/all', authenticate, requireAdmin, async (req, res) => {
    try {
        const orders = await db.allAsync(`
            SELECT o.*, u.name as user_name, u.email as user_email 
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY timestamp DESC
        `);
        for (let order of orders) {
            order.items = await db.allAsync(`
                SELECT oi.quantity, oi.price, p.name 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
        }
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
