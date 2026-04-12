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
    elements: {},

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements.body = document.querySelector('body');
        
        this.elements.dropdown = document.querySelector('#Branch-Dropdown');
        
        if (this.elements.dropdown) {
            this.elements.dropdownTrigger = this.elements.dropdown.querySelector('.Dropdown-Trigger');
            this.elements.dropdownLabel = this.elements.dropdown.querySelector('.Dropdown-Label');
            this.elements.dropdownItems = this.elements.dropdown.querySelectorAll('.Dropdown-Item');
        }

        this.elements.logoutTrigger = document.querySelector('#Logout-BTN');
        this.elements.logoutModal = document.querySelector('#Logout-Modal');
        this.elements.cancelLogoutBtn = document.querySelector('#Cancel-Logout');
        this.elements.confirmLogoutBtn = document.querySelector('#Confirm-Logout');
    },

    setupEventListeners() {
        if (this.elements.dropdown) {
            this.elements.dropdownTrigger.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.elements.dropdown.classList.toggle('is-open');
            });

            this.elements.dropdownItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.handleDropdownSelect(item);
                });
            });

            document.addEventListener('click', (e) => {
                if (!this.elements.dropdown.contains(e.target)) {
                    this.elements.dropdown.classList.remove('is-open');
                }
            });
        }

        if (this.elements.logoutTrigger && this.elements.logoutModal) {
            this.elements.logoutTrigger.addEventListener('click', () => {
                this.elements.logoutModal.classList.add('is-open');
            });
        }

        if (this.elements.cancelLogoutBtn && this.elements.logoutModal) {
            this.elements.cancelLogoutBtn.addEventListener('click', () => {
                this.elements.logoutModal.classList.remove('is-open');
            });
        }

        if (this.elements.confirmLogoutBtn) {
            this.elements.confirmLogoutBtn.addEventListener('click', () => {
                
            });
        }
    },

    handleDropdownSelect(selectedItem) {
        this.elements.dropdownLabel.textContent = selectedItem.textContent;
        this.elements.dropdownLabel.style.color = 'var(--Black)'; 
        
        this.elements.dropdown.classList.remove('is-open');
        
        const branchId = selectedItem.getAttribute('data-value');
        
        this.api.get(`/appointments?branch=${branchId}`)
            .then(data => console.log(data))
            .catch(err => console.error(err));
    },

    ui: {
        setLoading(element, isLoading) {
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