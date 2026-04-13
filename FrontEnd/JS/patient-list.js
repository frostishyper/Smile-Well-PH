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
        
        this.elements.sortDropdown = document.querySelector('#Sort-Dropdown');
        
        if (this.elements.sortDropdown) {
            this.elements.sortTrigger = this.elements.sortDropdown.querySelector('.Dropdown-Trigger');
            this.elements.sortLabel = this.elements.sortDropdown.querySelector('.Dropdown-Label');
            this.elements.sortItems = this.elements.sortDropdown.querySelectorAll('.Dropdown-Item');
        }

        this.elements.logoutTrigger = document.querySelector('#Logout-BTN');
        this.elements.logoutModal = document.querySelector('#Logout-Modal');
        this.elements.cancelLogoutBtn = document.querySelector('#Cancel-Logout');
        this.elements.confirmLogoutBtn = document.querySelector('#Confirm-Logout');
    },

    setupEventListeners() {
        if (this.elements.sortDropdown) {
            this.elements.sortTrigger.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.elements.sortDropdown.classList.toggle('is-open');
            });

            this.elements.sortItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.handleSortSelect(item);
                });
            });

            document.addEventListener('click', (e) => {
                if (!this.elements.sortDropdown.contains(e.target)) {
                    this.elements.sortDropdown.classList.remove('is-open');
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

    handleSortSelect(selectedItem) {
        this.elements.sortLabel.textContent = selectedItem.textContent;
        this.elements.sortDropdown.classList.remove('is-open');
        
        const sortMethod = selectedItem.getAttribute('data-value');
        console.log(`Sorting table by: ${sortMethod}`);
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