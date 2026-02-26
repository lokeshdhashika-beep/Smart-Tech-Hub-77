// Constants & Config
const BUILDER_STEPS = [
    { id: 'profile', title: 'Usage Profile', message: 'What will you use your new beast for?' },
    { id: 'budget', title: 'Budget Preference', message: 'Performance is key, but budget is reality. Choose your path.' },
    { id: 'ram', category: 'ram', title: 'Select RAM', message: 'Analyzing the best memory for your build...' },
    { id: 'gpu', category: 'gpu', title: 'Select Graphics Card', message: 'Choosing the perfect visual powerhouse...' },
    { id: 'cpu', category: ['cpu-intel', 'cpu-amd'], title: 'Select Processor', message: 'The heart of your PC. Let\'s pick the brain...' },
    { id: 'ssd', category: 'internal-storage', title: 'Select Storage', message: 'Blazing fast speed or massive storage?' },
    { id: 'mobo', category: 'motherboard', title: 'Select Motherboard', message: 'Connecting everything together...' }
];

// State
let currentCategory = 'all';
let cart = [];
let wishlist = DB.getWishlist() || [];
let builderState = {
    step: 0,
    profile: '',
    budget: '',
    selections: {}
};

// DOM Elements
const productGrid = document.getElementById('product-grid');
const categoryList = document.getElementById('category-list');
const cartCount = document.getElementById('cart-count');
const wishlistCount = document.getElementById('wishlist-count');
window.wishlistModal = document.getElementById('wishlist-modal');
const wishlistItemsContainer = document.getElementById('wishlist-items-container');
window.cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotal = document.getElementById('cart-total');
window.detailsModal = document.getElementById('product-details-modal');
const detailsContent = document.getElementById('product-detail-content');
window.builderModal = document.getElementById('builder-modal');
const builderContent = document.getElementById('builder-wizard-content');

window.closeBuyNowModal = function () {
    const modal = document.getElementById('buy-now-modal');
    if (modal) modal.classList.remove('open');
};

function getCategoryName(id) {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
}

// --- RENDER FUNCTIONS ---
function renderCategories() {
    if (!categoryList) return;
    categoryList.innerHTML = CATEGORIES.map(cat => `
        <li class="category-item ${cat.id === currentCategory ? 'active' : ''}" 
            onclick="setCategory('${cat.id}')">
            <i class="fas ${cat.icon}"></i> ${cat.name}
        </li>
    `).join('');
}

async function renderProducts(products = null) {
    const data = products || await DB.getProducts(currentCategory);
    if (!productGrid) return;

    productGrid.innerHTML = data.filter(p => p).map(product => {
        const inWishlist = wishlist && wishlist.some(item => item && item.id === product.id);

        return `
        <div class="product-card glass-panel" onclick="openProductDetails('${product.id}')">
            <button class="wishlist-btn ${inWishlist ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
                <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x300/141a25/00D9FF?text=Smart+Tech+Hub'">
            </div>
            <div class="card-content">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-footer">
                    <div class="price">₹${product.price ? product.price.toLocaleString() : 'N/A'}</div>
                    <div style="display: flex;">
                        <button class="buy-btn" onclick="event.stopPropagation(); openBuyNow('${product.id}')" title="Buy Now Inquiry">
                            <i class="fas fa-bolt"></i>
                        </button>
                        <button class="add-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');

    if (data.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No products found in this category.</p>';
    }
}

function renderCart() {
    if (!cartItemsContainer) return;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px;">Your cart is empty</p>';
        if (cartTotal) cartTotal.textContent = '₹0';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/70/141a25/00D9FF'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${(item.price || 0).toLocaleString()}</div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity('${item.id || item.product_id}', -1)">-</button>
                    <span style="font-size: 14px; width: 20px; text-align: center;">${item.qty || item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id || item.product_id}', 1)">+</button>
                    <button class="qty-btn" onclick="removeFromCart('${item.id || item.product_id}')" style="margin-left: auto; border: none; color: #ff4757;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || item.quantity || 0)), 0);
    if (cartTotal) cartTotal.textContent = '₹' + total.toLocaleString();
}

function renderWishlist() {
    if (!wishlistItemsContainer) return;
    if (wishlist.length === 0) {
        wishlistItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 50px;">Your wishlist is empty</p>';
        return;
    }

    wishlistItemsContainer.innerHTML = wishlist.filter(item => item).map(item => `
        <div class="cart-item">
            <img src="${item.image}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/70/141a25/00D9FF'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${(item.price || 0).toLocaleString()}</div>
                <button class="primary-btn" onclick="moveToCart('${item.id}')" style="margin-top: 10px; padding: 8px; font-size: 12px; width: auto;">
                    Move to Cart
                </button>
            </div>
            <button class="qty-btn" onclick="toggleWishlist('${item.id}')" style="border: none; color: #ff4757; height: auto; align-self: flex-start;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// --- BUILDER FUNCTIONS ---
window.openAIBuilder = async function () {
    builderState = { step: 0, profile: '', budget: '', selections: {} };
    if (builderModal) builderModal.classList.add('open');
    await renderBuilderStep();
};

window.renderBuilderStep = async function () {
    const step = BUILDER_STEPS[builderState.step];
    if (!step) {
        await renderBuilderReview();
        return;
    }

    let html = `
        <div class="builder-header">
            <i class="fas fa-wand-magic-sparkles" style="font-size: 40px; color: var(--primary); margin-bottom: 20px;"></i>
            <h2 style="font-size: 28px; color: var(--primary);">Step ${builderState.step + 1}: ${step.title}</h2>
            <p style="color: var(--text-muted); margin-top: 10px;">${step.message}</p>
        </div>
        <div class="builder-steps" style="margin-bottom: 30px;">
            ${BUILDER_STEPS.map((s, i) => `
                <div class="step-node ${i <= builderState.step ? 'active' : ''}">${i + 1}</div>
            `).join('')}
        </div>
        <div class="builder-options" id="builder-options">
    `;

    if (builderState.step === 0) {
        html += `
            <div class="option-card" onclick="selectBuilderProfile('gaming')">
                <i class="fas fa-gamepad" style="font-size: 40px; margin-bottom: 20px; color: var(--primary);"></i>
                <h3>Gaming</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Pro performance & high FPS.</p>
            </div>
            <div class="option-card" onclick="selectBuilderProfile('professional')">
                <i class="fas fa-video" style="font-size: 40px; margin-bottom: 20px; color: var(--secondary);"></i>
                <h3>Workstation</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Editing & heavy rendering.</p>
            </div>
            <div class="option-card" onclick="selectBuilderProfile('casual')">
                <i class="fas fa-home" style="font-size: 40px; margin-bottom: 20px; color: var(--accent);"></i>
                <h3>Home/Office</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Reliable everyday usage.</p>
            </div>
        `;
    } else if (builderState.step === 1) {
        html += `
            <div class="option-card" onclick="selectBuilderBudget('high')">
                <i class="fas fa-crown" style="font-size: 40px; margin-bottom: 20px; color: #ffd700;"></i>
                <h3>Elite Build</h3>
                <p style="color: var(--text-muted); font-size: 13px;">No compromises on quality.</p>
            </div>
            <div class="option-card" onclick="selectBuilderBudget('low')">
                <i class="fas fa-thumbs-up" style="font-size: 40px; margin-bottom: 20px; color: var(--accent);"></i>
                <h3>Value King</h3>
                <p style="color: var(--text-muted); font-size: 13px;">Best performance for price.</p>
            </div>
        `;
    } else {
        const allProducts = await DB.getAllProducts();
        const cats = Array.isArray(step.category) ? step.category : [step.category];
        let filtered = allProducts.filter(p => cats.includes(p.category));

        if (filtered.length > 0) {
            const prices = filtered.map(p => p.price);
            const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];

            if (builderState.budget === 'high') {
                filtered = filtered.filter(p => p.price >= medianPrice).sort((a, b) => b.price - a.price);
            } else {
                filtered = filtered.filter(p => p.price <= medianPrice).sort((a, b) => a.price - b.price);
            }

            filtered.slice(0, 4).forEach(p => {
                html += `
                    <div class="option-card" onclick="selectBuilderItem('${step.id}', '${p.id}')">
                        <img src="${p.image}" style="width: 70px; height: 70px; object-fit: contain; margin-bottom: 10px;">
                        <h4 style="font-size: 13px; height: 36px; overflow: hidden; margin-bottom: 8px;">${p.name}</h4>
                        <p style="color: var(--accent); font-weight: bold; font-size: 14px;">₹${p.price.toLocaleString()}</p>
                    </div>
                `;
            });
        }
    }

    html += `</div>
        <div style="display: flex; gap: 15px; margin-top: 30px; justify-content: center;">
            ${builderState.step > 0 ? `<button class="back-btn" onclick="prevBuilderStep()"><i class="fas fa-chevron-left"></i><span>Back</span></button>` : ''}
            <button class="cancel-btn" onclick="builderModal.classList.remove('open')">
                <i class="fas fa-times-circle"></i>
                <span>Cancel</span>
            </button>
        </div>
    `;

    if (builderContent) builderContent.innerHTML = html;
};

window.prevBuilderStep = async function () {
    if (builderState.step > 0) {
        builderState.step--;
        await renderBuilderStep();
    }
};

window.selectBuilderProfile = async function (profile) {
    builderState.profile = profile;
    builderState.step++;
    await renderBuilderStep();
};

window.selectBuilderBudget = async function (budget) {
    builderState.budget = budget;
    builderState.step++;
    await renderBuilderStep();
};

window.selectBuilderItem = async function (stepId, productId) {
    builderState.selections[stepId] = productId;
    builderState.step++;
    await renderBuilderStep();
};

async function renderBuilderReview() {
    const selectedItems = [];
    for (const id of Object.values(builderState.selections)) {
        const p = await DB.getProduct(id);
        if (p) selectedItems.push(p);
    }
    const total = selectedItems.reduce((acc, p) => acc + (p.price || 0), 0);

    if (builderContent) {
        builderContent.innerHTML = `
            <div class="builder-header">
                <h2 style="font-size: 28px; color: var(--accent);">Build Complete!</h2>
                <p style="color: var(--text-muted); margin-top: 10px;">Your custom ${builderState.profile} build is ready for assembly.</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 24px; margin-bottom: 30px; border: 1px solid var(--glass-border);">
                ${selectedItems.map(p => `
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="flex: 1;">
                            <span style="font-size: 14px; color: var(--text-main); font-weight: 500;">${p.name}</span>
                            <div style="font-size: 11px; color: var(--text-muted);">${getCategoryName(p.category)}</div>
                        </div>
                        <span style="color: var(--primary); font-weight: bold; font-size: 14px;">₹${p.price.toLocaleString()}</span>
                    </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 20px; font-weight: 800; border-top: 1px solid var(--glass-border); pt: 15px;">
                    <span>Total Budget</span>
                    <span style="color: var(--accent);">₹${total.toLocaleString()}</span>
                </div>
            </div>

            <div style="display: flex; gap: 15px;">
                <button class="primary-btn" onclick="addBuildToCart()" style="flex: 2;">
                    Add to Cart <i class="fas fa-shopping-cart" style="margin-left: 10px;"></i>
                </button>
                <button class="nav-btn" onclick="addBuildToWishlist()" style="width: 55px; height: 55px; border-radius: 12px; border-color: #ff4757; color: #ff4757;">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="back-btn" onclick="prevBuilderStep()" style="display: inline-flex;"><i class="fas fa-arrow-left"></i> Edit Build</button>
            </div>
        `;
    }
}

window.addBuildToCart = async function () {
    for (const id of Object.values(builderState.selections)) {
        await DB.addToCart(id, 1);
    }
    cart = await DB.getCart();
    updateBadges();
    if (builderModal) builderModal.classList.remove('open');
    alert('All build components added to your cart! 🚀');
};

window.addBuildToWishlist = async function () {
    const selectedIds = Object.values(builderState.selections);
    for (const id of selectedIds) {
        if (id && !wishlist.some(item => item && item.id === id)) {
            const p = await DB.getProduct(id);
            if (p) wishlist.push(p);
        }
    }
    DB.saveWishlist(wishlist);
    updateBadges();
    await renderProducts();
    if (builderModal) builderModal.classList.remove('open');
    alert('All components saved to your wishlist! ❤️');
};

// --- CORE ACTIONS ---
window.setCategory = async function (id) {
    if (id === 'builder') {
        openAIBuilder();
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('mobile-active');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('no-scroll');
        return;
    }

    currentCategory = id;
    renderCategories();
    await renderProducts();

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('mobile-active');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('no-scroll');

    const titleEl = document.querySelector('.section-title');
    if (titleEl) titleEl.textContent = id === 'all' ? 'Featured Components' : getCategoryName(id);
};

window.openProductDetails = async function (productId) {
    const product = await DB.getProduct(productId);
    if (!product) return;

    if (detailsContent) {
        detailsContent.innerHTML = `
            <div class="detail-layout">
                <div class="detail-img-container">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x400/141a25/00D9FF'">
                </div>
                <div class="detail-info">
                    <div class="product-category" style="font-size: 14px; margin-bottom: 10px;">${getCategoryName(product.category)}</div>
                    <h2 style="font-size: 32px; margin-bottom: 20px;">${product.name}</h2>
                    <div class="price" style="font-size: 28px; margin-bottom: 25px;">₹${(product.price || 0).toLocaleString()}</div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                        <h4 style="margin-bottom: 10px; color: var(--primary);">Specifications</h4>
                        <p style="color: var(--text-muted); line-height: 1.6;">${product.description || 'No description available.'}</p>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button class="primary-btn" onclick="addToCart('${product.id}'); detailsModal.classList.remove('open');">
                            Add to Cart <i class="fas fa-shopping-cart" style="margin-left: 10px;"></i>
                        </button>

                        <button class="nav-btn ${wishlist.some(i => i && i.id === product.id) ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" style="width: 55px; height: 55px;">
                            <i class="${wishlist.some(i => i && i.id === product.id) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    if (detailsModal) detailsModal.classList.add('open');
};

window.addToCart = async function (productId) {
    await DB.addToCart(productId, 1);
    cart = await DB.getCart();
    updateBadges();

    const evt = window.event;
    const btn = evt ? evt.currentTarget : null;
    if (btn && (btn.classList.contains('add-btn') || btn.classList.contains('primary-btn'))) {
        const icon = btn.querySelector('i');
        if (icon) {
            const original = icon.className;
            icon.className = 'fas fa-check';
            setTimeout(() => icon.className = original, 1000);
        }
    }
};

window.removeFromCart = async function (productId) {
    await DB.removeFromCart(productId);
    cart = await DB.getCart();
    renderCart();
    updateBadges();
};

window.updateQuantity = async function (productId, change) {
    const item = cart.find(item => item && (item.id === productId || item.product_id === productId));
    if (item) {
        const newQty = (item.quantity || item.qty) + change;
        if (newQty <= 0) {
            await DB.removeFromCart(productId);
        } else {
            await DB.updateCartQuantity(productId, newQty);
        }
        cart = await DB.getCart();
        renderCart();
        updateBadges();
    }
};

window.toggleWishlist = async function (productId) {
    const product = await DB.getProduct(productId);
    if (!product) return;

    const index = wishlist.findIndex(item => item && item.id === productId);
    if (index >= 0) wishlist.splice(index, 1);
    else wishlist.push(product);

    DB.saveWishlist(wishlist);
    updateBadges();
    await renderProducts();
    if (wishlistModal && wishlistModal.classList.contains('open')) renderWishlist();
};

window.moveToCart = async function (productId) {
    await addToCart(productId);
    await toggleWishlist(productId);
};

window.moveAllToCart = async function () {
    if (!wishlist || wishlist.length === 0) return;
    for (const item of wishlist) {
        if (item) await DB.addToCart(item.id, 1);
    }
    wishlist = [];
    DB.saveWishlist(wishlist);
    cart = await DB.getCart();
    updateBadges();
    await renderProducts();
    renderWishlist();
    alert('All items moved to cart! 🛒');
};

// --- DIRECT BUY / INQUIRY ---
window.openBuyNow = async function (productId) {
    const modal = document.getElementById('buy-now-modal');
    if (!modal) return;

    const product = await DB.getProduct(productId);
    if (!product) return;

    document.getElementById('buy-now-product-id').value = productId;
    document.getElementById('modal-product-name').innerText = product.name;

    document.getElementById('buy-now-form').reset();
    document.getElementById('buy-now-form-container').classList.remove('hidden');
    document.getElementById('buy-now-success').classList.add('hidden');

    document.querySelectorAll('.wiz-step').forEach(s => s.classList.remove('active', 'slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left'));
    document.getElementById('wiz-step-1').classList.add('active');

    const indicators = document.querySelectorAll('.step-dot');
    indicators.forEach(ind => {
        ind.classList.remove('active', 'completed');
        if (ind.dataset.step === '1') ind.classList.add('active');
    });

    document.getElementById('buy-now-summary').innerHTML = `
        <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${product.image}" style="width: 50px; height: 50px; object-fit: contain;">
            <div style="flex: 1;">
                <div style="font-weight: bold; color: white;">${product.name}</div>
                <div style="color: var(--primary); font-weight: bold;">₹${product.price.toLocaleString()}</div>
            </div>
            <button class="secondary-btn" onclick="importInquiryToCart('${product.id}')" style="font-size: 11px; padding: 5px 10px;">
                <i class="fas fa-cart-plus"></i> Import to Cart
            </button>
        </div>
    `;

    modal.classList.add('open');
};

window.switchWizStep = function (step) {
    const currentStep = document.querySelector('.wiz-step.active');
    const targetStep = document.getElementById(`wiz-step-${step}`);
    if (!currentStep || !targetStep) return;
    const currentStepNum = parseInt(currentStep.id.split('-').pop());
    const isForward = step > currentStepNum;

    document.querySelectorAll('.wiz-step').forEach(s => {
        s.classList.remove('active', 'slide-out-left', 'slide-in-right', 'slide-out-right', 'slide-in-left');
    });

    if (isForward) {
        currentStep.classList.add('slide-out-left');
        targetStep.classList.add('active', 'slide-in-right');
    } else {
        currentStep.classList.add('slide-out-right');
        targetStep.classList.add('active', 'slide-in-left');
    }

    const indicators = document.querySelectorAll('.step-dot');
    indicators.forEach(ind => {
        const indStep = parseInt(ind.dataset.step);
        ind.classList.remove('active', 'completed');
        if (indStep === step) ind.classList.add('active');
        else if (indStep < step) ind.classList.add('completed');
    });

    setTimeout(() => { currentStep.classList.remove('slide-out-left', 'slide-out-right'); }, 400);
};

window.selectPaymentMethod = function (method) {
    document.getElementById('selected-payment-method').value = method;
    document.querySelectorAll('.pay-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.method === method);
    });

    document.getElementById('upi-qr-view').classList.toggle('hidden', method !== 'upi');
    document.getElementById('phone-view').classList.toggle('hidden', method !== 'phone');
    document.getElementById('cod-view').classList.toggle('hidden', method !== 'cod');

    if (method === 'upi') generateDirectQR();
};

async function generateDirectQR() {
    const container = document.getElementById('direct-qr-code');
    if (!container) return;
    container.innerHTML = '';
    const p = await DB.getProduct(document.getElementById('buy-now-product-id').value);
    const amount = p ? (p.price || 0) : 0;
    const upiStr = `upi://pay?pa=9894465996@upi&pn=SmartTechHub&am=${amount}&cu=INR`;
    new QRCode(container, {
        text: upiStr, width: 100, height: 100, colorDark: "#000000", colorLight: "#ffffff"
    });
}

window.importInquiryToCart = async function (productId) {
    await DB.addToCart(productId, 1);
    cart = await DB.getCart();
    updateBadges();
    renderCart();

    const modal = document.getElementById('buy-now-modal');
    if (modal) modal.classList.remove('open');
    if (cartModal) cartModal.classList.add('open');
};

window.openCartCheckout = function () {
    window.location.href = 'checkout.html';
};

window.logout = function () {
    DB.setCurrentUser(null);
    window.location.reload();
};

// --- UTILS ---
function updateBadges() {
    if (cartCount) {
        let total = 0;
        cart.forEach(item => total += (item.qty || item.quantity || 0));
        cartCount.textContent = total;
        cartCount.classList.toggle('hidden', cart.length === 0);
    }
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
        wishlistCount.classList.toggle('hidden', wishlist.length === 0);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.toLowerCase();
            if (term.length === 0) { await renderProducts(); return; }
            const allProducts = await DB.getAllProducts();
            const filtered = allProducts.filter(p =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.description && p.description.toLowerCase().includes(term))
            );
            await renderProducts(filtered);
        });
    }

    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => { if (cartModal) cartModal.classList.add('open'); renderCart(); });

    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) wishlistBtn.addEventListener('click', () => { if (wishlistModal) wishlistModal.classList.add('open'); renderWishlist(); });

    const builderBtn = document.getElementById('builder-btn');
    if (builderBtn) builderBtn.addEventListener('click', openAIBuilder);

    ['close-cart', 'close-wishlist', 'close-details', 'close-builder', 'close-buy-now'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => {
            const modal = document.querySelector('.modal-overlay.open');
            if (modal) modal.classList.remove('open');
        });
    });

    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) clearCartBtn.addEventListener('click', async () => {
        if (confirm('Clear entire cart?')) {
            await DB.clearCart();
            cart = await DB.getCart();
            renderCart();
            updateBadges();
        }
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCartCheckout);

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobileBtn = document.getElementById('close-mobile-menu');
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeMobileMenu = () => {
        if (sidebar) sidebar.classList.remove('mobile-active');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => {
        if (sidebar) sidebar.classList.add('mobile-active');
        if (backdrop) backdrop.classList.add('active');
        document.body.classList.add('no-scroll');
    });
    if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    });

    const buyNowForm = document.getElementById('buy-now-form');
    if (buyNowForm) {
        buyNowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('buy-now-product-id').value;

            const inquiryData = {
                product_id: productId,
                customer_name: document.getElementById('buyer-name').value,
                customer_email: document.getElementById('buyer-email').value,
                customer_phone: document.getElementById('buyer-phone').value,
                customer_pin: document.getElementById('buyer-pin').value,
                customer_address: document.getElementById('buyer-address').value,
                customer_city: document.getElementById('buyer-city').value,
                customer_landmark: document.getElementById('buyer-landmark').value,
                customer_payment: document.getElementById('selected-payment-method').value
            };

            try {
                await DB.saveInquiry(inquiryData);

                const progressContainer = document.querySelector('.wizard-progress-container');
                if (progressContainer) progressContainer.style.display = 'none';

                document.getElementById('buy-now-form-container').classList.add('hidden');
                document.getElementById('buy-now-success').classList.remove('hidden');
            } catch (err) {
                alert('Failed to submit inquiry: ' + err.message);
            }
        });
    }
}

function updateUserHeader() {
    const user = DB.getCurrentUser();
    const container = document.getElementById('user-section');
    if (!container) return;
    if (user) {
        let html = `
            <div class="desktop-only" style="text-align: right; margin-right: 10px;">
                <div style="font-size: 14px; font-weight: bold; color: var(--primary);">${user.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); cursor: pointer; text-decoration: underline;" onclick="logout()">Logout</div>
            </div>
        `;
        html += user.role === 'admin'
            ? `<a href="admin.html" class="nav-btn" title="Admin Dashboard" style="border-color: var(--primary);"><i class="fas fa-cog" style="color: var(--primary);"></i></a>`
            : `<div class="nav-btn"><i class="fas fa-user-circle"></i></div>`;
        container.innerHTML = html;
    } else {
        container.innerHTML = `<a href="login.html" class="nav-btn" title="Login"><i class="fas fa-user"></i></a>`;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    updateUserHeader();
    cart = await DB.getCart();
    wishlist = DB.getWishlist();
    updateBadges();
    renderCategories();
    await renderProducts();
    setupEventListeners();
});
