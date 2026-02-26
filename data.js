const CATEGORIES = [
    { id: 'all', name: 'All Components', icon: 'fa-microchip' },
    { id: 'ram', name: 'RAM Memory', icon: 'fa-memory' },
    { id: 'internal-storage', name: 'Storage (SSD/HDD)', icon: 'fa-hdd' },
    { id: 'gpu', name: 'Graphics Cards', icon: 'fa-gamepad' },
    { id: 'motherboard', name: 'Motherboards', icon: 'fa-server' },
    { id: 'cpu-intel', name: 'Processors (Intel)', icon: 'fa-microchip' },
    { id: 'cpu-amd', name: 'Processors (AMD)', icon: 'fa-microchip' },
    { id: 'smps', name: 'Power Supply', icon: 'fa-plug' },
    { id: 'case', name: 'Cabinets', icon: 'fa-desktop' },
    { id: 'monitor', name: 'Monitors', icon: 'fa-tv' },
    { id: 'cooler', name: 'CPU Coolers', icon: 'fa-fan' },
    { id: 'peripheral', name: 'Peripherals', icon: 'fa-keyboard' },
    { id: 'networking', name: 'Networking', icon: 'fa-wifi' },
    { id: 'builder', name: 'PC Building Assistant', icon: 'fa-wand-magic-sparkles' }
];

const DB_KEYS = { WISHLIST: 'sth_wishlist' };

const DB = {
    getToken: () => localStorage.getItem('sth_token'),
    setToken: (token) => localStorage.setItem('sth_token', token),

    getCurrentUser: function () {
        const u = localStorage.getItem('sth_current_user');
        return u ? JSON.parse(u) : null;
    },
    setCurrentUser: function (user) {
        if (user) localStorage.setItem('sth_current_user', JSON.stringify(user));
        else {
            localStorage.removeItem('sth_current_user');
            localStorage.removeItem('sth_token');
        }
    },

    getHeaders: function () {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    },

    init: function () {
        // Moved to backend server initialization
    },

    getProducts: async function (category = 'all') {
        const res = await fetch(`/api/products${category !== 'all' ? '?category=' + category : ''}`);
        return await res.json();
    },

    getAllProducts: async function () {
        const res = await fetch('/api/products');
        return await res.json();
    },

    getProduct: async function (id) {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) return await res.json();
        return null;
    },

    saveProduct: async function (product) {
        // If it looks like a new form submission (no id or generic new format)
        // Adjust logic from admin.js 
        const isUpdate = product.id && !product.id.startsWith('prod-') && product.id !== '';
        // Actually, let's just use POST if we want to create, PUT if update. Wait, our API uses PUT /:id
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `/api/products/${product.id}` : '/api/products';
        const res = await fetch(url, {
            method, headers: this.getHeaders(), body: JSON.stringify(product)
        });
        return await res.json();
    },

    deleteProduct: async function (id) {
        await fetch(`/api/products/${id}`, { method: 'DELETE', headers: this.getHeaders() });
    },

    getCart: async function () {
        if (!this.getCurrentUser()) return [];
        try {
            const res = await fetch('/api/cart', { headers: this.getHeaders() });
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return [];
    },

    addToCart: async function (productId, quantity = 1) {
        if (!this.getCurrentUser()) { alert('Please login first'); return; }
        await fetch('/api/cart', {
            method: 'POST', headers: this.getHeaders(),
            body: JSON.stringify({ productId, quantity })
        });
    },

    updateCartQuantity: async function (productId, quantity) {
        if (!this.getCurrentUser()) return;
        await fetch('/api/cart', {
            method: 'PUT', headers: this.getHeaders(),
            body: JSON.stringify({ productId, quantity })
        });
    },

    removeFromCart: async function (productId) {
        if (!this.getCurrentUser()) return;
        await fetch(`/api/cart/${productId}`, { method: 'DELETE', headers: this.getHeaders() });
    },

    clearCart: async function () {
        if (!this.getCurrentUser()) return;
        await fetch('/api/cart/clear', { method: 'DELETE', headers: this.getHeaders() });
    },

    getWishlist: function () {
        try { return JSON.parse(localStorage.getItem(DB_KEYS.WISHLIST)) || []; } catch (e) { return []; }
    },
    saveWishlist: function (wishlist) {
        localStorage.setItem(DB_KEYS.WISHLIST, JSON.stringify(wishlist));
    },

    getInquiries: async function () {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        try {
            const res = await fetch('/api/inquiries', { headers: this.getHeaders() });
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return [];
    },

    saveInquiry: async function (inquiry) {
        const res = await fetch('/api/inquiries', {
            method: 'POST', headers: this.getHeaders(),
            body: JSON.stringify(inquiry)
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to submit inquiry');
        }
        return await res.json();
    },

    deleteInquiry: async function (id) {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') return;
        await fetch(`/api/inquiries/${id}`, { method: 'DELETE', headers: this.getHeaders() });
    },

    getOrders: async function () {
        const user = this.getCurrentUser();
        if (!user) return [];
        try {
            const url = user.role === 'admin' ? '/api/orders/all' : '/api/orders';
            const res = await fetch(url, { headers: this.getHeaders() });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error(e);
        }
        return [];
    },

    saveOrder: async function (order) {
        const res = await fetch('/api/orders', {
            method: 'POST', headers: this.getHeaders(),
            body: JSON.stringify(order)
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to process order');
        }
        return await res.json();
    },

    getUsers: async function () {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'admin') return [];
        const res = await fetch('/api/auth/users', { headers: this.getHeaders() });
        if (res.ok) return await res.json();
        return [];
    }
};
