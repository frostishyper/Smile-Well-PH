// This Is Only  Boilerplate Script, Copy & Paste This To A New JS File And Go From There.

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Set your Spring Boot API base URL and default headers here.
 */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/* =====================================================
2. APP
===================================================== */
const App = {
    /**
     * 2. ELEMENT CACHE
     * Store your querySelectors here so you don't hunt the DOM twice.
     */
    elements: {
        body: document.querySelector('body'),
        // Example: submitBtn: document.querySelector('#submit-btn')
    },

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('Page Logic Initialized');
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        // Example: this.elements.submitBtn.addEventListener('click', () => this.handleAction());
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
     */
    ui: {
        // Use this to disable buttons during API calls
        setLoading(element, isLoading) {
            if (isLoading) {
                element.classList.add('is-loading');
                element.disabled = true;
            } else {
                element.classList.remove('is-loading');
                element.disabled = false;
            }
        },

        // Keeps tablet users in Landscape mode
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                console.warn('System optimized for Landscape view.');
            }
        }
    },

    /**
     * 6. API LAYER (REST)
     * Centralized methods for communicating with the Spring Boot controllers.
     */
    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = {
                ...options,
                headers: { ...API_CONFIG.HEADERS, ...options.headers }
            };

            try {
                const response = await fetch(url, settings);
                
                // Handle Spring Boot error responses (4xx, 5xx)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Status: ${response.status}`);
                }

                return response.status === 204 ? null : response.json();
            } catch (error) {
                console.error('Fetch Error:', error.message);
                throw error;
            }
        },

        // Usage: App.api.get('/patients/123')
        get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        },

        // Usage: App.api.post('/auth/login', { user, pass })
        post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        // Usage: App.api.put('/billing/update', updatedData)
        put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        // Usage: App.api.delete('/records/99')
        delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }
    }
};