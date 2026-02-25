const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let products;
        if (category && category !== 'all') {
            products = await db.allAsync(`SELECT * FROM products WHERE category = ?`, [category]);
        } else {
            products = await db.allAsync(`SELECT * FROM products`);
        }
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await db.getAsync(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new product (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id, name, category, price, stock, image, description } = req.body;
        const prodId = id || 'prod-' + Date.now();
        await db.runAsync(`INSERT INTO products (id, name, category, price, stock, image, description)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [prodId, name, category, price, stock, image, description]);
        res.status(201).json({ message: 'Product added successfully', id: prodId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, stock, image, description } = req.body;
        await db.runAsync(`UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image = ?, description = ? WHERE id = ?`,
            [name, category, price, stock, image, description, req.params.id]);
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.runAsync(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
