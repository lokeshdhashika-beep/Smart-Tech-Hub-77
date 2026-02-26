const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Keep-alive route for Render
app.get('/api/ping', (req, res) => res.send('ok'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Ping itself every 10 minutes to prevent Render inactivity
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try {
            await fetch(`${url}/api/ping`);
            console.log('Pinged server to keep alive...');
        } catch (e) {
            console.log('Ping failed:', e.message);
        }
    }, 10 * 60 * 1000); // 10 minutes
});
