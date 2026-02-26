const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promisify SQLite methods
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getImg = (keywords) => `https://loremflickr.com/320/320/${keywords}?lock=${Math.floor(Math.random() * 10000)}`;

const INITIAL_PRODUCTS = [
    { id: 'ram-001', name: 'Corsair Vengeance RGB Pro 16GB DDR4 3200MHz', category: 'ram', price: 4500, stock: 50, image: getImg('ram,computer'), description: 'High performance RGB memory.' },
    { id: 'ram-002', name: 'G.SKILL Trident Z5 RGB 32GB DDR5 6000MHz', category: 'ram', price: 12500, stock: 25, image: getImg('ram,memory'), description: 'Next-gen DDR5 performance.' },
    { id: 'ram-003', name: 'Kingston Fury Beast 8GB DDR4 3200MHz', category: 'ram', price: 2100, stock: 100, image: getImg('ram,pc'), description: 'Reliable performance for any build.' },
    { id: 'ram-004', name: 'Adata XPG Spectrix D60G 16GB DDR4 RGB', category: 'ram', price: 4800, stock: 30, image: getImg('ram,rgb'), description: 'Diamond-cut design.' },
    { id: 'ssd-001', name: 'Samsung 980 PRO 1TB NVMe Gen4 SSD', category: 'internal-storage', price: 8999, stock: 30, image: getImg('ssd,samsung'), description: 'Blazing fast Gen4 NVMe.' },
    { id: 'hdd-001', name: 'Seagate Barracuda 2TB 7200RPM HDD', category: 'internal-storage', price: 4200, stock: 60, image: getImg('harddrive'), description: 'Reliable high-capacity storage.' },
    { id: 'gpu-001', name: 'ASUS ROG Strix GeForce RTX 4070 Ti 12GB', category: 'gpu', price: 82000, stock: 8, image: getImg('graphicscard,nvidia'), description: 'Ultimate cooling and performance.' },
    { id: 'cpu-001', name: 'Intel Core i5-13600K 13th Gen', category: 'cpu-intel', price: 28500, stock: 20, image: getImg('intel,cpu'), description: 'King of mid-range gaming.' },
    { id: 'cpu-002', name: 'AMD Ryzen 7 7800X3D Gaming Processor', category: 'cpu-amd', price: 36000, stock: 15, image: getImg('amd,ryzen'), description: 'Fastest gaming CPU available.' },
    { id: 'mobo-001', name: 'MSI MAG B760 Tomahawk WiFi DDR4', category: 'motherboard', price: 18500, stock: 18, image: getImg('motherboard'), description: 'Solid B760 platform.' },
    { id: 'smps-001', name: 'Deepcool PM750D 750W 80+ Gold', category: 'smps', price: 6500, stock: 40, image: getImg('powersupply'), description: 'Reliable Gold performance.' },
    { id: 'cool-001', name: 'DeepCool AK620 Digital CPU Air Cooler', category: 'cooler', price: 5800, stock: 25, image: getImg('cpucooler,fan'), description: 'Air cooler with temp display.' },
    { id: 'case-001', name: 'Lian Li PC-O11 Dynamic EVO', category: 'case', price: 14500, stock: 10, image: getImg('pccase,lianli'), description: 'The ultimate builder case.' },
    { id: 'mon-001', name: 'LG Ultragear 27GN800 27" 1440p 144Hz', category: 'monitor', price: 23000, stock: 15, image: getImg('monitor,gaming'), description: 'Crisp QHD IPS display.' },
    { id: 'net-001', name: 'TP-Link Archer AX55 WiFi 6 Router', category: 'networking', price: 6500, stock: 25, image: getImg('router,wifi'), description: 'Next-gen WiFi 6 speeds.' },
    { id: 'peri-001', name: 'Logitech G Pro X Superlight Mouse', category: 'peripheral', price: 11500, stock: 25, image: getImg('mouse,gaming'), description: 'Pro-grade wireless mouse.' }
];

async function initializeDB() {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                stock INTEGER NOT NULL,
                image TEXT,
                description TEXT
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                product_id TEXT,
                quantity INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                total REAL,
                status TEXT,
                timestamp TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT,
                product_id TEXT,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY(order_id) REFERENCES orders(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS inquiries (
                id TEXT PRIMARY KEY,
                product_id TEXT,
                customer_name TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                customer_payment TEXT,
                customer_city TEXT,
                customer_pin TEXT,
                customer_landmark TEXT,
                customer_address TEXT,
                timestamp TEXT,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);

        // Seed Admin User
        const adminEmail = 'admin';
        const adminExt = await db.getAsync(`SELECT * FROM users WHERE email = ?`, [adminEmail]);
        if (!adminExt) {
            const hashedAdmin = await bcrypt.hash('admin', 10);
            await db.runAsync(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`, ['u1', 'Admin', adminEmail, hashedAdmin, 'admin']);
        }

        // Seed Demo User
        const demoEmail = 'user@demo.com';
        const demoExt = await db.getAsync(`SELECT * FROM users WHERE email = ?`, [demoEmail]);
        if (!demoExt) {
            const hashedDemo = await bcrypt.hash('123', 10);
            await db.runAsync(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`, ['u2', 'Demo User', demoEmail, hashedDemo, 'user']);
        }

        // Seed Products
        const prodCount = await db.getAsync(`SELECT COUNT(*) as count FROM products`);
        if (prodCount.count === 0) {
            for (const p of INITIAL_PRODUCTS) {
                await db.runAsync(`INSERT INTO products (id, name, category, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [p.id, p.name, p.category, p.price, p.stock, p.image, p.description]);
            }
            console.log('Seeded initial products.');
        }

        console.log('Database initialized successfully.');
    } catch (e) {
        console.error('Database initialization error:', e);
    }
}

initializeDB();

module.exports = db;
