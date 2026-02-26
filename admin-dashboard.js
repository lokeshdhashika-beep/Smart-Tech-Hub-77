// Protect Route
const user = DB.getCurrentUser();
if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

let products = [];
let orders = [];
let inquiries = [];
let users = [];
let currentView = 'dashboard';
let editingId = null;
let salesChart = null;

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    products: document.getElementById('view-products'),
    orders: document.getElementById('view-orders'),
    inquiries: document.getElementById('view-inquiries'),
    users: document.getElementById('view-users')
};
const navItems = document.querySelectorAll('.nav-item[data-view]');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupNavigation();
    setupDashboard();
    setupProductManagement();
});

async function loadData() {
    const [productsData, ordersData, inquiriesData, usersData] = await Promise.all([
        DB.getAllProducts(),
        DB.getOrders(),
        DB.getInquiries(),
        DB.getUsers()
    ]);
    products = productsData;
    orders = ordersData;
    inquiries = inquiriesData;
    users = usersData;
}

// Navigation
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            Object.values(views).forEach(view => view.classList.add('hidden'));

            const viewName = item.getAttribute('data-view');
            views[viewName].classList.remove('hidden');

            if (viewName === 'products') await renderProductsTable();
            if (viewName === 'orders') await renderOrdersTable();
            if (viewName === 'inquiries') renderInquiriesTable();
            if (viewName === 'users') renderUsersTable();
            if (viewName === 'dashboard') await updateDashboardStats();
        });
    });
}

// Dashboard
async function setupDashboard() {
    await updateDashboardStats();
    renderSalesChart();
}

async function updateDashboardStats() {
    await loadData(); // refresh

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;

    document.getElementById('total-revenue').textContent = '₹' + totalRevenue.toLocaleString();
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-products').textContent = totalProducts;
}

function renderSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [120000, 190000, 150000, 250000, 220000, 300000];

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                borderColor: '#00D9FF',
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a0aec0' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#a0aec0' } }
            }
        }
    });
}

// Product Management
function setupProductManagement() {
    const catSelect = document.getElementById('product-category');
    CATEGORIES.forEach(cat => {
        if (cat.id !== 'all') {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            catSelect.appendChild(option);
        }
    });

    document.getElementById('add-product-btn').addEventListener('click', () => openModal());
    document.getElementById('cancel-product-btn').addEventListener('click', () => productModal.classList.remove('open'));
    productForm.addEventListener('submit', handleProductSubmit);

    renderProductsTable();
}

async function renderProductsTable() {
    products = await DB.getAllProducts();
    const tbody = document.getElementById('products-table-body');

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}" class="table-img" onerror="this.src='https://via.placeholder.com/40/141a25/00D9FF?text=Img'"></td>
            <td>${p.name}</td>
            <td>${getCategoryName(p.category)}</td>
            <td>₹${p.price.toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openModal(product = null) {
    productModal.classList.add('open');
    const title = document.getElementById('modal-title');

    if (product) {
        title.textContent = 'Edit Product';
        editingId = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-desc').value = product.description;
    } else {
        title.textContent = 'Add Product';
        editingId = null;
        productForm.reset();
        document.getElementById('product-image').value = 'images/placeholder.jpg';
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();

    const newProduct = {
        id: editingId || 'prod-' + Date.now(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: Number(document.getElementById('product-price').value),
        stock: Number(document.getElementById('product-stock').value),
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-desc').value
    };

    if (editingId) newProduct.id = editingId;

    await DB.saveProduct(newProduct);

    productModal.classList.remove('open');
    await renderProductsTable();
    await updateDashboardStats();
}

window.editProduct = async function (id) {
    const product = await DB.getProduct(id);
    if (product) openModal(product);
};

window.deleteProduct = async function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        await DB.deleteProduct(id);
        await renderProductsTable();
        await updateDashboardStats();
    }
};

function getCategoryName(id) {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
}

// Orders View
async function renderOrdersTable() {
    orders = await DB.getOrders();
    const tbody = document.getElementById('orders-table-body');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No orders found</td></tr>';
        return;
    }

    const sortedOrders = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    tbody.innerHTML = sortedOrders.map(order => `
        <tr>
            <td>#${order.id.slice(-6)}</td>
            <td>${new Date(order.timestamp).toLocaleDateString()}</td>
            <td>
                <div style="font-weight: bold;">${order.user_name || 'Guest'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${order.user_email || 'No Email'}</div>
            </td>
            <td>
                <div style="font-size: 11px; max-height: 60px; overflow-y: auto;">
                    ${order.items && order.items.length > 0 ? order.items.map(i => `${i.name} (x${i.quantity})`).join('<br>') : '0 items'}
                </div>
            </td>
            <td>₹${order.total.toLocaleString()}</td>
            <td><span style="color: var(--accent); white-space: nowrap;">${order.status || 'Completed'}</span></td>
        </tr>
    `).join('');
}

// Users View
async function renderUsersTable() {
    users = await DB.getUsers();
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>#${u.id.slice(-6)}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span style="color: ${u.role === 'admin' ? 'var(--primary)' : 'white'}; font-weight: bold;">${u.role.toUpperCase()}</span></td>
        </tr>
    `).join('');
}

// Inquiries
function renderInquiriesTable() {
    const tbody = document.getElementById('inquiries-table-body');
    // inquiries = await DB.getInquiries(); // handled by loadData already


    if (inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No inquiries found.</td></tr>';
        return;
    }

    inquiries.sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    tbody.innerHTML = inquiries.map(inq => {
        const date = new Date(inq.timestamp || inq.date).toLocaleDateString();
        const productImg = inq.product ? inq.product.image : '';
        const productName = inq.product ? inq.product.name : 'Unknown Product';
        const customer = inq.customer || {};
        const paymentLabel = customer.paymentMethod ? customer.paymentMethod.toUpperCase() : 'N/A';

        return `
        <tr>
            <td style="font-size: 11px;">${date}</td>
            <td>
                <div style="font-weight: bold;">${customer.name || 'Guest'}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${customer.email || 'No Email'}</div>
                <div style="font-size: 11px; color: var(--primary);">${customer.phone || ''}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${productImg}" style="width: 30px; height: 30px; object-fit: contain; border-radius: 4px;">
                    <span style="font-size: 12px;">${productName}</span>
                </div>
            </td>
            <td>
                <div style="font-size: 12px; font-weight: bold; color: var(--accent);">${paymentLabel}</div>
            </td>
            <td style="max-width: 250px; font-size: 11px; color: var(--text-muted);">
                <div>${customer.city || ''}, ${customer.pin || ''}</div>
                <div style="font-style: italic;">LM: ${customer.landmark || ''}</div>
                <div style="margin-top: 4px; color: white;">${customer.address || ''}</div>
            </td>
            <td>
                <button class="delete-btn" onclick="deleteInquiry('${inq.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

window.deleteInquiry = async function (id) {
    if (confirm('Are you sure you want to delete this inquiry?')) {
        await DB.deleteInquiry(id);
        inquiries = await DB.getInquiries();
        renderInquiriesTable();
    }
};


