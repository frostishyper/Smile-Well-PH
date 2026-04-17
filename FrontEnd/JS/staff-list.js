document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},
    state: {
        allStaff: [],       // Raw data from DB
        filteredStaff: [],  // Filtered/Sorted data
        currentFilter: 'all',
        currentSearch: ''
    },

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.fetchStaffData();
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements.tableBody = document.querySelector('#Staff-List-Table-Body');
        this.elements.searchInput = document.querySelector('#Staff-Search-Input');
        this.elements.newStaffBtn = document.querySelector('#New-Staff-BTN');
        
        this.elements.sortDropdown = document.querySelector('#Sort-Dropdown');
        this.elements.filterDropdown = document.querySelector('#Filter-Dropdown');
    },

    setupEventListeners() {
        this.elements.newStaffBtn?.addEventListener('click', () => {
            window.location.href = '/register-staff';
        });

        // Row Click Hook (Takes over the Edit Button's job)
        this.elements.tableBody?.addEventListener('click', (e) => {
            const row = e.target.closest('.staff-row');
            if (row) {
                const staffId = row.dataset.staffId;
                window.location.href = `/edit-staff?id=${staffId}`;
            }
        });

        // Search Input
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.state.currentSearch = e.target.value.toLowerCase();
            this.applyFiltersAndRender();
        });

        // Setup Dropdowns
        this.setupDropdownLogic(this.elements.sortDropdown, this.handleSortSelect.bind(this));
        this.setupDropdownLogic(this.elements.filterDropdown, this.handleFilterSelect.bind(this));
    },

    setupDropdownLogic(dropdownEl, callback) {
        if (!dropdownEl) return;
        
        const trigger = dropdownEl.querySelector('.Dropdown-Trigger');
        const items = dropdownEl.querySelectorAll('.Dropdown-Item');

        trigger?.addEventListener('click', (e) => {
            e.stopPropagation(); 
            document.querySelectorAll('.Custom-Dropdown').forEach(d => {
                if(d !== dropdownEl) d.classList.remove('is-open');
            });
            dropdownEl.classList.toggle('is-open');
        });

        items?.forEach(item => {
            item.addEventListener('click', () => callback(item, dropdownEl));
        });

        document.addEventListener('click', (e) => {
            if (!dropdownEl.contains(e.target)) dropdownEl.classList.remove('is-open');
        });
    },

    handleSortSelect(selectedItem, dropdownEl) {
        dropdownEl.querySelector('.Dropdown-Label').textContent = selectedItem.textContent;
        dropdownEl.classList.remove('is-open');
        
        const sortType = selectedItem.dataset.value;
        if (sortType === 'name-asc') {
            this.state.filteredStaff.sort((a, b) => a.displayName.localeCompare(b.displayName));
        } else if (sortType === 'recent') {
            this.state.filteredStaff.sort((a, b) => b.dentistId - a.dentistId);
        }
        
        this.renderTable();
    },

    handleFilterSelect(selectedItem, dropdownEl) {
        dropdownEl.querySelector('.Dropdown-Label').textContent = selectedItem.textContent;
        dropdownEl.classList.remove('is-open');
        
        this.state.currentFilter = selectedItem.dataset.value;
        this.applyFiltersAndRender();
    },

    applyFiltersAndRender() {
        // 1. Filter by Role
        let results = this.state.allStaff;
        if (this.state.currentFilter !== 'all') {
            results = results.filter(staff => staff.role === this.state.currentFilter);
        }

        // 2. Filter by Search
        if (this.state.currentSearch) {
            results = results.filter(staff => 
                staff.displayName.toLowerCase().includes(this.state.currentSearch) ||
                staff.dentistId.toString().includes(this.state.currentSearch)
            );
        }

        this.state.filteredStaff = results;
        this.renderTable();
    },

    async fetchStaffData() {
        try {
            const data = await this.api.get('/staff/list');
            this.state.allStaff = data;
            this.applyFiltersAndRender();
        } catch (e) {
            console.error("Database Error:", e);
            if (this.elements.tableBody) {
                this.elements.tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Database Error</td></tr>`;
            }
        }
    },

    renderTable() {
        if (!this.elements.tableBody) return;
        this.elements.tableBody.innerHTML = '';

        if (this.state.filteredStaff.length === 0) {
            this.elements.tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No staff found.</td></tr>`;
            return;
        }

        // Generate Rows
        const rowsHtml = this.state.filteredStaff.map(staff => `
            <tr class="staff-row" data-staff-id="${staff.dentistId}">
                <td>${staff.dentistId}</td>
                <td>${staff.displayName}</td>
                <td>${staff.role}</td>
            </tr>
        `).join('');

        this.elements.tableBody.innerHTML = rowsHtml;
    },

    ui: {
        checkOrientation() { if (window.innerHeight > window.innerWidth) console.warn('Landscape optimized.'); }
    },

    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            const response = await fetch(url, settings);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return response.status === 204 ? null : response.json();
        },
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    }
};