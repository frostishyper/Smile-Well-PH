document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const App = {
    elements: {},

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements.body = document.querySelector('body');
        this.elements.usernameInput = document.querySelector('#Username');
        this.elements.passwordInput = document.querySelector('#Password');
        this.elements.loginBtn = document.querySelector('#Login-BTN');
    },

    setupEventListeners() {
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        }
    },

    async handleLogin() {
        const username = this.elements.usernameInput.value.trim();
        const password = this.elements.passwordInput.value.trim();

        if (!username || !password) {
            alert("Please enter both username and password.");
            return;
        }

        this.ui.setLoading(this.elements.loginBtn, true);

        // Spring Security requires URLSearchParams for default form login
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            if (response.ok) {
                window.location.href = '/dashboard';
            } else {
                alert("Invalid credentials. Please try again.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("A network error occurred. Check server connection.");
        } finally {
            this.ui.setLoading(this.elements.loginBtn, false);
        }
    },

    ui: {
        setLoading(element, isLoading) {
            if (isLoading) {
                element.classList.add('is-loading');
                element.textContent = 'Logging in...';
                element.disabled = true;
            } else {
                element.classList.remove('is-loading');
                element.textContent = 'Login';
                element.disabled = false;
            }
        },

        checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                console.warn('System optimized for Landscape view.');
            }
        }
    }
};