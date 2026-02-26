const express = require('express');
const router = express.Router();
const db = require('../db');

// POST a new inquiry
router.post('/', async (req, res) => {
    try {
        const {
            product_id, customer_name, customer_email, customer_phone,
            customer_payment, customer_city, customer_pin,
            customer_landmark, customer_address
        } = req.body;

        const id = 'inq-' + Date.now();
        const timestamp = new Date().toISOString();

        await db.runAsync(`
            INSERT INTO inquiries (
                id, product_id, customer_name, customer_email, customer_phone, 
                customer_payment, customer_city, customer_pin, 
                customer_landmark, customer_address, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, product_id, customer_name, customer_email, customer_phone,
            customer_payment, customer_city, customer_pin,
            customer_landmark, customer_address, timestamp
        ]);

        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create inquiry' });
    }
});

// GET all inquiries (for Admin)
router.get('/', async (req, res) => {
    try {
        // Simple JOIN to get product info for admin dashboard
        const inquiries = await db.allAsync(`
            SELECT i.*, p.name as product_name, p.image as product_image, p.price as product_price
            FROM inquiries i
            LEFT JOIN products p ON i.product_id = p.id
            ORDER BY i.timestamp DESC
        `);

        // Format to match the admin dashboard expectations
        const formattedInquiries = inquiries.map(inq => ({
            id: inq.id,
            timestamp: inq.timestamp,
            customer: {
                name: inq.customer_name,
                email: inq.customer_email,
                phone: inq.customer_phone,
                paymentMethod: inq.customer_payment,
                city: inq.customer_city,
                pin: inq.customer_pin,
                landmark: inq.customer_landmark,
                address: inq.customer_address
            },
            product: {
                id: inq.product_id,
                name: inq.product_name || 'Unknown Product',
                image: inq.product_image || '',
                price: inq.product_price || 0
            }
        }));

        res.json(formattedInquiries);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

// DELETE an inquiry (for Admin)
router.delete('/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

module.exports = router;
