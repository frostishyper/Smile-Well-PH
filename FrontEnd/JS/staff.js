document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const App = {
    elements: {
        body: document.querySelector('body'),
        staffAuthForm: document.getElementById('staff-auth-form'),
        authorizationCode: document.getElementById('authorization-code'),
        dashboardBtn: document.getElementById('dashboardpage-btn'),
        recordsBtn: document.getElementById('recordspage-btn'),
        appointmentsBtn: document.getElementById('appointmentspage-btn'),
        newPatientBtn: document.getElementById('newpatientpage-btn'),
        logoutBtn: document.getElementById('logout-btn')
    },

    init() {
        console.log('Staff Page Initialized');
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    setupEventListeners() {
        const el = this.elements;

        el.dashboardBtn?.addEventListener('click', () => {
            window.location.href = '../HTML/Dashboard.html';
        });

        el.recordsBtn?.addEventListener('click', () => {
            window.location.href = '../HTML/Records.html';
        });

        el.appointmentsBtn?.addEventListener('click', () => {
            window.location.href = '../HTML/appointments.html';
        });

        el.newPatientBtn?.addEventListener('click', () => {
            window.location.href = '../HTML/NewPatient.html';
        });

        el.logoutBtn?.addEventListener('click', () => {
            window.location.href = '../HTML/Login.html';
        });

        el.staffAuthForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const authorizationCode = el.authorizationCode?.value.trim() || '';
            console.log('Staff authorization attempt:', authorizationCode);

            // TODO: Replace this placeholder with backend authorization integration.
        });
    },

    ui: {
        setLoading(element, isLoading) {
            if (!element) return;

            if (isLoading) {
                element.classList.add('is-loading');
                element.disabled = true;
            } else {
                element.classList.remove('is-loading');
                element.disabled = false;
            }
        },

        checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                console.warn('System optimized for Landscape view.');
            }
        }
    },

    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = {
                ...options,
                headers: { ...API_CONFIG.HEADERS, ...options.headers }
            };

            try {
                const response = await fetch(url, settings);

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

        get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        },

        post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }
    }
};
