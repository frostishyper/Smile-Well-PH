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

const MOCK_STAFF = [
    { dentistId: 1, displayName: 'Frostishyper', role: 'Dentist' },
    { dentistId: 2, displayName: 'Yeeard', role: 'Dentist' },
    { dentistId: 3, displayName: 'Ezickle', role: 'Staff' },
    { dentistId: 4, displayName: 'Mira Santos', role: 'Dentist' },
    { dentistId: 5, displayName: 'Paolo Cruz', role: 'Staff' },
    { dentistId: 6, displayName: 'Alyssa Dizon', role: 'Dentist' },
    { dentistId: 7, displayName: 'Noel Ventura', role: 'Staff' },
    { dentistId: 8, displayName: 'Trina Gomez', role: 'Dentist' },
    { dentistId: 9, displayName: 'Carlo Reyes', role: 'Staff' },
    { dentistId: 10, displayName: 'Leah Navarro', role: 'Dentist' },
    { dentistId: 11, displayName: 'Nico Valdez', role: 'Staff' },
    { dentistId: 12, displayName: 'Janelle Flores', role: 'Dentist' },
    { dentistId: 13, displayName: 'Marco Sy', role: 'Staff' },
    { dentistId: 14, displayName: 'Bianca Tan', role: 'Dentist' },
    { dentistId: 15, displayName: 'Rhea Castillo', role: 'Staff' }
];

const PAGE_SIZE = 5;

const Icons = {
    edit: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20H8L18.5 9.5C19.0523 8.94772 19.0523 8.05228 18.5 7.5L16.5 5.5C15.9477 4.94772 15.0523 4.94772 14.5 5.5L4 16V20Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M13.5 6.5L17.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
    `
};

const App = {
    state: {
        currentPage: 1,
        selectedSortLabel: 'Sort',
        staffRows: [...MOCK_STAFF]
    },

    elements: {
        body: document.querySelector('body'),
        tableBody: document.getElementById('staff-list-table-body'),
        newBtn: document.getElementById('staff-list-new-btn'),
        searchInput: document.getElementById('staff-list-search-input'),
        sortContainer: document.getElementById('staff-list-sort'),
        sortToggle: document.getElementById('staff-list-sort-toggle'),
        sortText: document.getElementById('staff-list-sort-text'),
        sortMenu: document.getElementById('staff-list-sort-menu'),
        sortOptions: document.querySelectorAll('.staff-list-sort-option'),
        prevBtn: document.getElementById('staff-list-prev-btn'),
        nextBtn: document.getElementById('staff-list-next-btn'),
        pageButtons: document.getElementById('staff-list-page-buttons'),
        dashboardBtn: document.getElementById('dashboardpage-btn'),
        recordsBtn: document.getElementById('recordspage-btn'),
        appointmentsBtn: document.getElementById('appointmentspage-btn'),
        newPatientBtn: document.getElementById('newpatientpage-btn'),
        logoutBtn: document.getElementById('logout-btn')
    },

    init() {
        console.log('Staff List Page Initialized');
        this.setupEventListeners();
        this.closeSortMenu();
        this.render();
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

        el.newBtn?.addEventListener('click', () => {
            window.location.href = 'staff-new.html';
        });

        el.searchInput?.addEventListener('input', () => {
            // TODO: Replace this mock search field with backend-driven search/filter behavior.
        });

        el.sortToggle?.addEventListener('click', () => {
            this.toggleSortMenu();
        });

        el.sortOptions.forEach((option) => {
            option.addEventListener('click', () => {
                this.state.selectedSortLabel = option.dataset.sortLabel || 'Sort';
                this.syncSortLabel();
                this.closeSortMenu();

                // TODO: Replace this UI-only selection state with backend-driven sorting.
            });
        });

        el.prevBtn?.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage -= 1;
                this.render();
            }
        });

        el.nextBtn?.addEventListener('click', () => {
            if (this.state.currentPage < this.getTotalPages()) {
                this.state.currentPage += 1;
                this.render();
            }
        });

        document.addEventListener('click', (event) => {
            if (!el.sortContainer?.contains(event.target)) {
                this.closeSortMenu();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeSortMenu();
            }
        });
    },

    getTotalPages() {
        return Math.max(1, Math.ceil(this.state.staffRows.length / PAGE_SIZE));
    },

    getPaginatedRows() {
        const startIndex = (this.state.currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return this.state.staffRows.slice(startIndex, endIndex);
    },

    render() {
        this.renderRows();
        this.renderPagination();
        this.syncSortLabel();
    },

    renderRows() {
        if (!this.elements.tableBody) {
            return;
        }

        const rows = this.getPaginatedRows();

        this.elements.tableBody.innerHTML = rows.map((staff) => `
            <tr>
                <td>${staff.dentistId}</td>
                <td>${staff.displayName}</td>
                <td>${staff.role}</td>
                <td>
                    <button
                        class="staff-list-edit-btn"
                        type="button"
                        data-edit-id="${staff.dentistId}"
                        aria-label="Edit ${staff.displayName}"
                    >
                        ${Icons.edit}
                    </button>
                </td>
            </tr>
        `).join('');

        this.elements.tableBody.querySelectorAll('.staff-list-edit-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const { editId } = button.dataset;
                window.location.href = `staff-edit.html?id=${editId}`;
            });
        });
    },

    renderPagination() {
        if (!this.elements.pageButtons) {
            return;
        }

        const totalPages = this.getTotalPages();
        this.elements.pageButtons.innerHTML = '';

        for (let page = 1; page <= totalPages; page += 1) {
            const pageButton = document.createElement('button');
            pageButton.type = 'button';
            pageButton.className = 'staff-list-page-btn';
            pageButton.textContent = String(page);

            if (page === this.state.currentPage) {
                pageButton.classList.add('is-active');
            }

            pageButton.addEventListener('click', () => {
                this.state.currentPage = page;
                this.render();
            });

            this.elements.pageButtons.appendChild(pageButton);
        }

        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = this.state.currentPage === 1;
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = this.state.currentPage === totalPages;
        }

        // TODO: Replace this mock pagination with backend pagination metadata and server-side paging.
    },

    toggleSortMenu() {
        if (!this.elements.sortMenu || !this.elements.sortToggle || !this.elements.sortContainer) {
            return;
        }

        const isOpen = !this.elements.sortMenu.hidden;
        this.elements.sortMenu.hidden = isOpen;
        this.elements.sortToggle.setAttribute('aria-expanded', String(!isOpen));
        this.elements.sortContainer.classList.toggle('open', !isOpen);
    },

    closeSortMenu() {
        if (!this.elements.sortMenu || !this.elements.sortToggle || !this.elements.sortContainer) {
            return;
        }

        this.elements.sortMenu.hidden = true;
        this.elements.sortToggle.setAttribute('aria-expanded', 'false');
        this.elements.sortContainer.classList.remove('open');
    },

    syncSortLabel() {
        if (this.elements.sortText) {
            this.elements.sortText.textContent = this.state.selectedSortLabel;
        }
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
