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

const App = {
    /**
     * 2. ELEMENT CACHE
     * Store your querySelectors here so you don't hunt the DOM twice.
     */
    elements: {},

    state: {
        staffRows: []
    },

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('Page Logic Initialized');

        // Populate element cache after DOM is ready
        this.elements = {
            body:           document.querySelector('body'),
            staffName:      document.querySelector('#Staff-Name'),
            staffRole:      document.querySelector('#Staff-Role'),
            staffPFP:       document.querySelector('#Staff-PFP'),
            searchInput:    document.querySelector('#Staff-Search-Input'),
            newStaffBtn:    document.querySelector('#New-Staff-BTN'),
            staffTableBody: document.querySelector('#Staff-List-Table-Body'),
        };

        this.setupEventListeners();
        this.ui.checkOrientation();
        this.fetchStaffData();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        this.elements.newStaffBtn?.addEventListener('click', () => {
            window.location.href = '/register-staff';
        });

        this.elements.staffTableBody?.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-action-btn')) {
                window.location.href = `/edit-staff?id=${e.target.dataset.id}`;
            }
        });

        this.elements.searchInput?.addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
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
    },

    // PAGE LOGIC

    async fetchStaffData() {

        // === MOCK DATA START ===
        this.state.staffRows = [
            { dentistId: 1, displayName: "Mezmerizer Miku", role: "Dentist" },
            { dentistId: 2, displayName: "John Santos",     role: "Receptionist" },
            { dentistId: 3, displayName: "Maria Cruz",      role: "Dental Assistant" },
        ];
        this.render();
        return;
        // === MOCK DATA END ===

        try {
            const data = await this.api.get('/staff/list');
            this.state.staffRows = data;
        } catch (e) {
            console.error("Database Error:", e);
            this.state.staffRows = [{ dentistId: 1, displayName: "Database Connection Error", role: "N/A" }];
        }
        this.render();
    },

    render(rows = this.state.staffRows) {
        const tbody = this.elements.staffTableBody;
        if (!tbody) return;

        tbody.innerHTML = rows.map(staff => `
            <tr>
                <td>${staff.dentistId}</td>
                <td>${staff.displayName}</td>
                <td>${staff.role}</td>
                <td style="text-align: center;">
                    <button class="edit-action-btn" data-id="${staff.dentistId}">Edit</button>
                </td>
            </tr>
        `).join('');
    },

    filterTable(query) {
        const filtered = this.state.staffRows.filter(staff =>
            staff.displayName.toLowerCase().includes(query.toLowerCase())
        );
        this.render(filtered);
    }
};