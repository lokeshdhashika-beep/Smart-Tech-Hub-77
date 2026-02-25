let cart = [];
let selectedPayment = 'upi';

document.addEventListener('DOMContentLoaded', async () => {
    const user = DB.getCurrentUser();
    if (!user) {
        alert("Please login to checkout!");
        window.location.href = 'login.html';
        return;
    }

    cart = await DB.getCart();
    if (cart.length === 0) {
        alert("Your cart is empty!");
        window.location.href = 'index.html';
        return;
    }
    renderSummary();
    setPayment('upi');
});

function renderSummary() {
    const container = document.getElementById('order-summary');
    if (!container) return;

    let total = 0;
    let html = '<div class="summary-items">';
    cart.forEach(item => {
        const qty = item.quantity || item.qty;
        total += (item.price * qty);
        html += `
            <div class="summary-item">
                <span>${item.name} x ${qty}</span>
                <span>₹${(item.price * qty).toLocaleString()}</span>
            </div>
        `;
    });
    html += '</div>';
    html += `
        <div class="summary-total">
            <span>Total Amount</span>
            <span>₹${total.toLocaleString()}</span>
        </div>
    `;
    container.innerHTML = html;
}

window.goToStep = function (step) {
    if (step === 2) {
        const name = document.getElementById('cust-name').value;
        const email = document.getElementById('cust-email').value;
        const phone = document.getElementById('cust-phone').value;
        if (!name || !email || !phone) {
            alert("Please fill in contact details first.");
            return;
        }
    }

    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === step);
    });

    if (step === 2) generateQR();
};

window.setPayment = function (method) {
    selectedPayment = method;
    document.querySelectorAll('.pay-option').forEach(opt => {
        opt.classList.toggle('active', opt.innerHTML.toLowerCase().includes(method));
    });

    const view = document.getElementById('payment-view');
    if (method === 'upi') {
        view.innerHTML = `
            <div style="text-align: center;">
                <p style="margin-bottom: 10px; font-size: 0.9rem;">Scan QR to pay securely</p>
                <div id="qr-code-container" style="background: white; padding: 10px; display: inline-block; border-radius: 8px;"></div>
            </div>
        `;
        generateQR();
    } else if (method === 'phone') {
        view.innerHTML = `
            <div style="text-align: center;">
                <p>Transfer to our official PhonePe number:</p>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 10px 0;">+91 98944 65996</div>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Confirm order after transfer</p>
            </div>
        `;
    } else {
        view.innerHTML = `
            <div style="text-align: center;">
                <p><i class="fas fa-hand-holding-usd" style="font-size: 2rem; margin-bottom: 10px;"></i></p>
                <p>Pay with cash on delivery</p>
            </div>
        `;
    }
};

function generateQR() {
    const container = document.getElementById('qr-code-container');
    if (!container) return;
    container.innerHTML = '';
    const total = cart.reduce((acc, item) => acc + (item.price * (item.quantity || item.qty)), 0);
    const upiStr = `upi://pay?pa=9894465996@upi&pn=SmartTechHub&am=${total}&cu=INR`;
    new QRCode(container, {
        text: upiStr, width: 128, height: 128, colorDark: "#000000", colorLight: "#ffffff"
    });
}

window.placeOrder = async function () {
    const orderItems = cart.map(item => ({
        id: item.id || item.product_id,
        quantity: item.quantity || item.qty,
        price: item.price
    }));

    const order = {
        total: cart.reduce((acc, item) => acc + (item.price * (item.quantity || item.qty)), 0),
        items: orderItems,
        shippingAddress: {
            name: document.getElementById('cust-name').value,
            email: document.getElementById('cust-email').value,
            phone: document.getElementById('cust-phone').value,
            address: document.getElementById('cust-address').value,
            pin: document.getElementById('cust-pin').value
        }
    };

    try {
        await DB.saveOrder(order);
        document.getElementById('success-overlay').classList.remove('hidden');
    } catch (err) {
        alert("Checkout Error: " + err.message);
    }
};
