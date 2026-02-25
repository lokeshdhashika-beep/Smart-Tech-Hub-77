const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get user cart
router.get('/', authenticate, async (req, res) => {
    try {
        const cartItems = await db.allAsync(`
            SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image 
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [req.user.id]);

        // Format to match old localstorage format where each item had product details nested or flattened
        const formattedCart = cartItems.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity
        }));

        res.json(formattedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to cart or update quantity
router.post('/', authenticate, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const existingItem = await db.getAsync(`SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`, [req.user.id, productId]);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            await db.runAsync(`UPDATE cart_items SET quantity = ? WHERE id = ?`, [newQuantity, existingItem.id]);
        } else {
            await db.runAsync(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`, [req.user.id, productId, quantity]);
        }
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update exact quantity (for cart page)
router.put('/', authenticate, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (quantity <= 0) {
            await db.runAsync(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [req.user.id, productId]);
        } else {
            await db.runAsync(`UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?`, [quantity, req.user.id, productId]);
        }
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear cart
router.delete('/clear', authenticate, async (req, res) => {
    try {
        await db.runAsync(`DELETE FROM cart_items WHERE user_id = ?`, [req.user.id]);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove item from cart
router.delete('/:productId', authenticate, async (req, res) => {
    try {
        await db.runAsync(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [req.user.id, req.params.productId]);
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
