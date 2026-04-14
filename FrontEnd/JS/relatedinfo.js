document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const App = {
    /**
     * 2. ELEMENT CACHE
     */
    elements: {
        body: document.querySelector('body'),
        // Cache all custom dropdowns
        customDropdowns: document.querySelectorAll('.Custom-Dropdown'),
        // Example: saveBtn: document.querySelector('#saveEditBtnControl')
    },

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('SmileWell Page Logic Initialized');
        this.initDropdowns();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

   /**
     * CUSTOM DROPDOWN LOGIC
     * Updated to scan the DOM dynamically
     */
    initDropdowns() {
        // Scan for dropdowns at the moment the function runs
        const dropdowns = document.querySelectorAll('.Custom-Dropdown');
        
        console.log(`Dropdown Scan: Found ${dropdowns.length} elements`);

        if (dropdowns.length === 0) {
            console.warn("No dropdowns found! Are they rendered yet?");
            return;
        }

        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.Dropdown-Trigger');
            const label = dropdown.querySelector('.Dropdown-Label');
            const items = dropdown.querySelectorAll('.Dropdown-Item');

            if (!trigger) return; // Safety check

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close others
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('is-open');
                });

                dropdown.classList.toggle('is-open');
                console.log('Dropdown toggled:', dropdown.id, dropdown.classList.contains('is-open'));
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent trigger from firing
                    const selectedText = item.textContent;
                    const selectedValue = item.getAttribute('data-value');
                    
                    label.textContent = selectedText;
                    label.style.color = '#000000'; 
                    dropdown.classList.remove('is-open');
                    dropdown.dataset.selectedValue = selectedValue;
                    
                    console.log(`Selected: ${selectedValue}`);
                });
            });
        });

        document.addEventListener('click', () => {
            dropdowns.forEach(d => d.classList.remove('is-open'));
        });
    },

    /**
     * 4. EVENT LISTENERS
     */
    setupEventListeners() {
        // Example: Click handler for a save button
        // if(this.elements.saveBtn) {
        //    this.elements.saveBtn.addEventListener('click', () => this.handleSave());
        // }
    },

    /**
     * 5. UI HELPERS
     */
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

    /**
     * 6. API LAYER (REST)
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

        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
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
        delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
    }
};