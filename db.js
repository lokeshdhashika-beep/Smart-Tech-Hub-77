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
    // Original Seed Products
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
    { id: 'peri-001', name: 'Logitech G Pro X Superlight Mouse', category: 'peripheral', price: 11500, stock: 25, image: getImg('mouse,gaming'), description: 'Pro-grade wireless mouse.' },

    // New Budget RAM
    { id: 'ram-005', name: 'Crucial Basics 8GB DDR4 2666MHz', category: 'ram', price: 1200, stock: 50, image: getImg('ram,computer'), description: 'Affordable basic desktop memory.' },
    { id: 'ram-006', name: 'ADATA XPG Gammix D30 8GB DDR4 3200MHz', category: 'ram', price: 1800, stock: 45, image: getImg('ram,memory'), description: 'High-quality gaming RAM with heat sink.' },
    { id: 'ram-007', name: 'Corsair Vengeance LPX 8GB DDR4 3200MHz', category: 'ram', price: 2000, stock: 40, image: getImg('ram,pc'), description: 'Optimized for high performance and low profile.' },
    { id: 'ram-008', name: 'Kingston FURY Beast 16GB DDR4 3200MHz', category: 'ram', price: 3500, stock: 30, image: getImg('ram,rgb'), description: 'Cost-effective high-capacity RAM upgrade.' },
    { id: 'ram-009', name: 'G.Skill Ripjaws V 16GB DDR4 3600MHz', category: 'ram', price: 3800, stock: 25, image: getImg('ram,computer'), description: 'Speed and capacity built for serious gamers.' },
    { id: 'ram-001', name: 'Crucial Basics 8GB DDR4 2666MHz', category: 'ram', price: 1200, stock: 50, image: getImg('ram,computer'), description: 'Affordable basic desktop memory.' },
    { id: 'ram-002', name: 'ADATA XPG Gammix D30 8GB DDR4 3200MHz', category: 'ram', price: 1800, stock: 45, image: getImg('ram,memory'), description: 'High-quality gaming RAM with heat sink.' },
    { id: 'ram-003', name: 'Corsair Vengeance LPX 8GB DDR4 3200MHz', category: 'ram', price: 2000, stock: 40, image: getImg('ram,pc'), description: 'Optimized for high performance and low profile.' },
    { id: 'ram-004', name: 'Kingston FURY Beast 16GB DDR4 3200MHz', category: 'ram', price: 3500, stock: 30, image: getImg('ram,rgb'), description: 'Cost-effective high-capacity RAM upgrade.' },
    { id: 'ram-005', name: 'G.Skill Ripjaws V 16GB DDR4 3600MHz', category: 'ram', price: 3800, stock: 25, image: getImg('ram,computer'), description: 'Speed and capacity built for serious gamers.' },

    // New Budget Storage
    { id: 'ssd-002', name: 'Ant Esports 128GB SATA SSD', category: 'internal-storage', price: 900, stock: 50, image: getImg('ssd,sata'), description: 'Budget friendly boot drive.' },
    { id: 'ssd-003', name: 'Crucial BX500 240GB SATA SSD', category: 'internal-storage', price: 1400, stock: 40, image: getImg('ssd,samsung'), description: 'Reliable and affordable SSD storage.' },
    { id: 'ssd-004', name: 'WD Blue SN570 500GB NVMe SSD', category: 'internal-storage', price: 3200, stock: 35, image: getImg('ssd,nvme'), description: 'Fast NVMe speed for modern motherboards.' },
    { id: 'ssd-005', name: 'Crucial P3 1TB PCIe 3.0 NVMe SSD', category: 'internal-storage', price: 4500, stock: 20, image: getImg('ssd,storage'), description: 'Massive fast storage at great value.' },
    { id: 'hdd-002', name: 'Seagate Barracuda 1TB 7200 RPM HDD', category: 'internal-storage', price: 3100, stock: 60, image: getImg('harddrive'), description: 'Essential mass storage for large files.' },

    // New Budget GPU
    { id: 'gpu-002', name: 'Zotac GT 730 4GB DDR3', category: 'gpu', price: 4000, stock: 30, image: getImg('graphicscard,nvidia'), description: 'Entry-level dedicated graphics card.' },
    { id: 'gpu-003', name: 'ASUS GeForce GT 1030 2GB GDDR5', category: 'gpu', price: 6500, stock: 25, image: getImg('gpu,asus'), description: 'Great for basic e-sports titles and media.' },
    { id: 'gpu-004', name: 'MSI GeForce GTX 1650 4GB', category: 'gpu', price: 11500, stock: 20, image: getImg('graphicscard,msi'), description: 'The absolute king of budget 1080p gaming.' },
    { id: 'gpu-005', name: 'GIGABYTE Radeon RX 6600 Eagle 8GB', category: 'gpu', price: 19000, stock: 15, image: getImg('gpu,amd'), description: 'Superb 1080p performance at an affordable price.' },
    { id: 'gpu-006', name: 'Zotac GeForce RTX 3060 Twin Edge 12GB', category: 'gpu', price: 25000, stock: 10, image: getImg('graphicscard,rtx'), description: 'Mid-range powerhouse with plenty of VRAM.' },

    // New Budget Motherboard
    { id: 'mobo-002', name: 'Zebronics H61 Motherboard', category: 'motherboard', price: 1500, stock: 25, image: getImg('motherboard,pc'), description: 'Ultra-budget board for older intel processors.' },
    { id: 'mobo-003', name: 'MSI H310M PRO-VDH PLUS', category: 'motherboard', price: 4000, stock: 20, image: getImg('motherboard,msi'), description: 'Affordable and reliable 8th/9th gen board.' },
    { id: 'mobo-004', name: 'GIGABYTE B450M DS3H V2', category: 'motherboard', price: 6000, stock: 30, image: getImg('motherboard,gigabyte'), description: 'The staple Ryzen budget motherboard.' },
    { id: 'mobo-005', name: 'ASUS Prime H610M-E D4', category: 'motherboard', price: 7000, stock: 20, image: getImg('motherboard,asus'), description: 'Entry-level board for Intels latest.' },
    { id: 'mobo-006', name: 'MSI B550M PRO-VDH WIFI', category: 'motherboard', price: 9500, stock: 15, image: getImg('motherboard,wifi'), description: 'Great Ryzen motherboard packed with WiFi built-in.' },

    // New Budget CPU - Intel
    { id: 'cpu-003', name: 'Intel Core i3-10100F', category: 'cpu-intel', price: 6000, stock: 30, image: getImg('intel,cpu'), description: 'Excellent quad-core for budget builds.' },
    { id: 'cpu-004', name: 'Intel Core i3-12100F', category: 'cpu-intel', price: 8500, stock: 25, image: getImg('processor,intel'), description: 'A massive leap in budget performance.' },
    { id: 'cpu-005', name: 'Intel Core i5-10400F', category: 'cpu-intel', price: 9500, stock: 20, image: getImg('intel,i5'), description: 'Affordable 6-Core processor.' },
    { id: 'cpu-006', name: 'Intel Core i5-12400F', category: 'cpu-intel', price: 11500, stock: 15, image: getImg('pc,cpu'), description: 'The undisputed mid-range gaming champion.' },
    { id: 'cpu-007', name: 'Intel Core i5-13400F', category: 'cpu-intel', price: 18000, stock: 10, image: getImg('intel,core'), description: 'High core count modern performance.' },

    // New Budget CPU - AMD
    { id: 'cpu-008', name: 'AMD Athlon 3000G', category: 'cpu-amd', price: 4000, stock: 25, image: getImg('amd,cpu'), description: 'Ultra-budget processor with basic graphics.' },
    { id: 'cpu-009', name: 'AMD Ryzen 3 3200G', category: 'cpu-amd', price: 6500, stock: 25, image: getImg('ryzen,cpu'), description: 'Budget APU for entry-level gaming.' },
    { id: 'cpu-010', name: 'AMD Ryzen 5 4600G', category: 'cpu-amd', price: 9000, stock: 20, image: getImg('processor,amd'), description: 'Great value 6-Core APU.' },
    { id: 'cpu-011', name: 'AMD Ryzen 5 5600G', category: 'cpu-amd', price: 12000, stock: 15, image: getImg('amd,ryzen'), description: 'Excellent processor with solid onboard graphics.' },
    { id: 'cpu-012', name: 'AMD Ryzen 5 5600X', category: 'cpu-amd', price: 14000, stock: 15, image: getImg('processor,ryzen'), description: 'The king of mainstream AMD CPUs.' },

    // New Budget SMPS
    { id: 'smps-002', name: 'Ant Esports VS500L 500W', category: 'smps', price: 1500, stock: 40, image: getImg('powersupply,pc'), description: 'Affordable entry-level power supply.' },
    { id: 'smps-003', name: 'Deepcool PF450 450W', category: 'smps', price: 2500, stock: 35, image: getImg('psu,power'), description: 'Reliable system builder PSU.' },
    { id: 'smps-004', name: 'Cooler Master MWE 550 V2 Bronze', category: 'smps', price: 3600, stock: 25, image: getImg('powersupply,coolermaster'), description: 'Solid 80 Plus Bronze efficiency.' },
    { id: 'smps-005', name: 'Corsair CV550 550W 80 Plus Bronze', category: 'smps', price: 3800, stock: 20, image: getImg('smps,corsair'), description: 'Highly trusted budget 550W power supply.' },
    { id: 'smps-006', name: 'Gigabyte P650B 650W 80 Plus Bronze', category: 'smps', price: 4500, stock: 20, image: getImg('psu,gigabyte'), description: 'Cost-effective 650W for beefier cards.' },

    // New Budget Case
    { id: 'case-002', name: 'Ant Esports ICE-112 Auto RGB', category: 'case', price: 2500, stock: 30, image: getImg('pccase,rgb'), description: 'Great airflow with pre-installed fans.' },
    { id: 'case-003', name: 'Zebronics Zeb-Cronus Premium', category: 'case', price: 3000, stock: 25, image: getImg('cabinet,pc'), description: 'Stylish cabinet with tempered glass.' },
    { id: 'case-004', name: 'Deepcool Matrexx 40 3FS', category: 'case', price: 3500, stock: 20, image: getImg('pccase,deepcool'), description: 'Micro-ATX builder favorite.' },
    { id: 'case-005', name: 'Galax Revolution 01 ATX', category: 'case', price: 4000, stock: 15, image: getImg('case,computer'), description: 'Spacious case with ARGB fans.' },
    { id: 'case-006', name: 'Corsair 4000D Airflow', category: 'case', price: 6500, stock: 10, image: getImg('pccase,corsair'), description: 'Premium airflow and cable management.' },

    // New Budget Monitor
    { id: 'mon-002', name: 'Zebronics Zeb-V19HD 18.5 Inch', category: 'monitor', price: 3500, stock: 30, image: getImg('screen,monitor'), description: 'Basic affordable PC monitor.' },
    { id: 'mon-003', name: 'Acer EK220Q 21.5 Inch VA 100Hz', category: 'monitor', price: 5500, stock: 25, image: getImg('monitor,acer'), description: 'Great refresh rate on a budget.' },
    { id: 'mon-004', name: 'MSI PRO MP241X 24 Inch 75Hz', category: 'monitor', price: 6500, stock: 20, image: getImg('monitor,msi'), description: 'Excellent work and play monitor.' },
    { id: 'mon-005', name: 'LG 22Mp68Vq 22 Inch IPS', category: 'monitor', price: 7000, stock: 20, image: getImg('screen,lg'), description: 'High color accuracy IPS panel.' },
    { id: 'mon-006', name: 'Acer VG240Y 24 Inch IPS 165Hz', category: 'monitor', price: 9500, stock: 15, image: getImg('monitor,gaming'), description: 'High-refresh competitive gaming monitor.' },

    // New Budget Cooler
    { id: 'cool-002', name: 'Deepcool Gamma Archer', category: 'cooler', price: 500, stock: 40, image: getImg('cpufan,cooler'), description: 'Better-than-stock quiet cooler.' },
    { id: 'cool-003', name: 'Ant Esports ICE-C612 RGB', category: 'cooler', price: 1000, stock: 30, image: getImg('cpucooler,rgb'), description: 'Affordable RGB tower cooler.' },
    { id: 'cool-004', name: 'Deepcool AG400 LED Single Tower', category: 'cooler', price: 1800, stock: 25, image: getImg('cooler,deepcool'), description: 'Excellent cooling efficiency.' },
    { id: 'cool-005', name: 'Cooler Master Hyper 212', category: 'cooler', price: 2500, stock: 20, image: getImg('cpufan,coolermaster'), description: 'The legendary reliable air cooler.' },
    { id: 'cool-006', name: 'Deepcool LE520 240mm AIO', category: 'cooler', price: 5500, stock: 10, image: getImg('liquidcooler,rgb'), description: 'Affordable and powerful liquid cooling.' },

    // New Budget Peripheral
    { id: 'peri-002', name: 'HP K500F Backlit Keyboard', category: 'peripheral', price: 1000, stock: 40, image: getImg('keyboard,hp'), description: 'Simple and affordable backlit membrane keyboard.' },
    { id: 'peri-003', name: 'Zebronics Gaming Keyboard & Mouse', category: 'peripheral', price: 1100, stock: 45, image: getImg('keyboard,mouse'), description: 'Inexpensive starter combo.' },
    { id: 'peri-004', name: 'Logitech G102 Light Sync Mouse', category: 'peripheral', price: 1500, stock: 35, image: getImg('mouse,logitech'), description: 'The gold standard budget gaming mouse.' },
    { id: 'peri-005', name: 'Razer DeathAdder Essential', category: 'peripheral', price: 1500, stock: 30, image: getImg('mouse,razer'), description: 'Ergonomic classic mouse.' },
    { id: 'peri-006', name: 'Redragon Kumara K552 Mechanical', category: 'peripheral', price: 2800, stock: 20, image: getImg('mechanicalkeyboard'), description: 'Fantastic budget mechanical keyboard.' },

    // New Budget Networking
    { id: 'net-002', name: 'TP-Link USB WiFi Adapter TL-WN725N', category: 'networking', price: 500, stock: 50, image: getImg('usb,wifi'), description: 'Tiny plug-and-forget WiFi.' },
    { id: 'net-003', name: 'TP-Link Gigabit PCI Express', category: 'networking', price: 1000, stock: 30, image: getImg('networkcard'), description: 'Fast wired expansion card.' },
    { id: 'net-004', name: 'TP-Link Archer T2U Plus AC600', category: 'networking', price: 1200, stock: 40, image: getImg('wifi,antenna'), description: 'High gain antenna for better reception.' },
    { id: 'net-005', name: 'TP-Link Archer C20 AC750', category: 'networking', price: 1500, stock: 25, image: getImg('router,tplink'), description: 'Budget friendly dual-band router.' },
    { id: 'net-006', name: 'D-Link DIR-819 Dual Band Router', category: 'networking', price: 1600, stock: 25, image: getImg('router,dlink'), description: 'Reliable AC750 wireless speeds.' }
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

        // Seed Products unconditionally based on missing IDs
        for (const p of INITIAL_PRODUCTS) {
            const extP = await db.getAsync(`SELECT id FROM products WHERE id = ?`, [p.id]);
            if (!extP) {
                await db.runAsync(`INSERT INTO products (id, name, category, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [p.id, p.name, p.category, p.price, p.stock, p.image, p.description]);
            }
        }

        // Seed Orders for Demo
        const orderCount = await db.getAsync(`SELECT COUNT(*) as count FROM orders`);
        if (orderCount.count === 0) {
            const orderId1 = 'ord-10001';
            await db.runAsync(`INSERT INTO orders (id, user_id, total, status, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [orderId1, 'u2', 8999, 'Delivered', new Date(Date.now() - 86400000).toISOString()]);
            await db.runAsync(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId1, 'ssd-001', 1, 8999]);

            const orderId2 = 'ord-10002';
            await db.runAsync(`INSERT INTO orders (id, user_id, total, status, timestamp) VALUES (?, ?, ?, ?, ?)`,
                [orderId2, 'u2', 6600, 'Pending', new Date().toISOString()]);
            await db.runAsync(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId2, 'ram-003', 2, 2100]);
            await db.runAsync(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId2, 'cool-001', 1, 2400]);
        }

        console.log('Database initialized successfully. Checked/Seeded ' + INITIAL_PRODUCTS.length + ' base products.');
    } catch (e) {
        console.error('Database initialization error:', e);
    }
}

initializeDB();

module.exports = db;
