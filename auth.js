// Check current page
const isLoginPage = document.getElementById('login-form');

if (isLoginPage) {
    // Login Handler
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();

            if (res.ok) {
                DB.setToken(data.token);
                loginUser(data.user);
            } else {
                alert(data.error || 'Invalid credentials!');
            }
        } catch (err) {
            console.error(err);
            alert('Server error, please try again.');
        }
    });

    // Signup Handler
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-pass').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password: pass })
            });
            const data = await res.json();

            if (res.ok) {
                DB.setToken(data.token);
                loginUser(data.user);
            } else {
                alert(data.error || 'Registration failed!');
            }
        } catch (err) {
            console.error(err);
            alert('Server error, please try again.');
        }
    });
}

function loginUser(user) {
    DB.setCurrentUser(user);
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

function logout() {
    DB.setCurrentUser(null);
    window.location.href = 'login.html';
}

function getCurrentUser() {
    return DB.getCurrentUser();
}

function requireAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        alert('Access Denied. Admins only.');
        window.location.href = 'login.html';
    }
}
