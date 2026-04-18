document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},
    state: {
        allPatients: [],    // The raw data from DB
        filteredPatients: [], // The data after search/sort
        currentPage: 1,
        itemsPerPage: 8
    },

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.fetchPatients(); 
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements.tableBody = document.querySelector('.Records-Table tbody');
        this.elements.searchInput = document.querySelector('.Search-Input');
        this.elements.sortDropdown = document.querySelector('#Sort-Dropdown');
        this.elements.pageNumbersWrapper = document.querySelector('.Page-Numbers-Wrapper');
        this.elements.prevPageBtn = document.querySelector('#Prev-Page');
        this.elements.nextPageBtn = document.querySelector('#Next-Page');
        
        if (this.elements.sortDropdown) {
            this.elements.sortTrigger = this.elements.sortDropdown.querySelector('.Dropdown-Trigger');
            this.elements.sortLabel = this.elements.sortDropdown.querySelector('.Dropdown-Label');
            this.elements.sortItems = this.elements.sortDropdown.querySelectorAll('.Dropdown-Item');
        }
    },

    setupEventListeners() {
        // Dropdown Logic
        if (this.elements.sortDropdown) {
            this.elements.sortTrigger?.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.elements.sortDropdown.classList.toggle('is-open');
            });
            this.elements.sortItems?.forEach(item => {
                item.addEventListener('click', () => this.handleSortSelect(item));
            });
            document.addEventListener('click', (e) => {
                if (!this.elements.sortDropdown.contains(e.target)) {
                    this.elements.sortDropdown.classList.remove('is-open');
                }
            });
        }

        // Live Search Filter
        this.elements.searchInput?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            this.state.filteredPatients = this.state.allPatients.filter(p => 
                p.first_name.toLowerCase().includes(query) || 
                p.last_name.toLowerCase().includes(query) ||
                p.patient_id.toString().includes(query)
            );
            this.state.currentPage = 1; // Reset to page 1 on new search
            this.renderTable();
            this.renderPagination();
        });

        // Pagination Buttons
        this.elements.prevPageBtn?.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.renderTable();
                this.renderPagination();
            }
        });

        this.elements.nextPageBtn?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.state.filteredPatients.length / this.state.itemsPerPage);
            if (this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.renderTable();
                this.renderPagination();
            }
        });

        // Row Click Routing
        this.elements.tableBody?.addEventListener('click', (e) => {
            const row = e.target.closest('.patient-row');
            if (row) {
                const patientId = row.dataset.patientId;
                // Ensures URL matches your FrontendController route
                window.location.href = `/patient-profile?patientId=${patientId}`;
            }
        });
    },

    async fetchPatients() {
        try {
            const data = await this.api.get('/patients/list');
            this.state.allPatients = data;
            this.state.filteredPatients = data; // Initially, no filter
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            console.error("Failed to load patients:", error);
            if (this.elements.tableBody) {
                this.elements.tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Database Error</td></tr>`;
            }
        }
    },

    renderTable() {
        if (!this.elements.tableBody) return;
        this.elements.tableBody.innerHTML = '';

        if (this.state.filteredPatients.length === 0) {
            this.elements.tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No patient records found.</td></tr>`;
            return;
        }

        // Pagination Slicing
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const end = start + this.state.itemsPerPage;
        const paginatedData = this.state.filteredPatients.slice(start, end);

        const rowsHtml = paginatedData.map(patient => `
            <tr class="patient-row" data-patient-id="${patient.patient_id}" style="cursor: pointer;">
                <td>${patient.patient_id}</td>
                <td>${patient.last_name}</td>
                <td>${patient.first_name}</td>
                <td>${patient.last_visit || 'N/A'}</td>
            </tr>
        `).join('');

        this.elements.tableBody.innerHTML = rowsHtml;
    },

    renderPagination() {
        if (!this.elements.pageNumbersWrapper) return;
        
        const totalPages = Math.ceil(this.state.filteredPatients.length / this.state.itemsPerPage) || 1;
        let pagesHtml = '';

        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === this.state.currentPage ? 'active' : '';
            pagesHtml += `<div class="Page-Num ${activeClass}" data-page="${i}">${i}</div>`;
        }

        this.elements.pageNumbersWrapper.innerHTML = pagesHtml;

        // Attach clicks to specific page numbers
        this.elements.pageNumbersWrapper.querySelectorAll('.Page-Num').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.currentPage = parseInt(e.target.dataset.page);
                this.renderTable();
                this.renderPagination();
            });
        });
    },

    handleSortSelect(selectedItem) {
        this.elements.sortLabel.textContent = selectedItem.textContent;
        this.elements.sortDropdown.classList.remove('is-open');
        
        const sortType = selectedItem.dataset.value;
        if (sortType === 'name-asc') {
            this.state.filteredPatients.sort((a, b) => a.last_name.localeCompare(b.last_name));
        } else if (sortType === 'recent') {
            // Sort by patient_id descending as a proxy for newest (assuming auto-increment)
            this.state.filteredPatients.sort((a, b) => b.patient_id - a.patient_id);
        }
        
        this.state.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    },

    ui: {
        checkOrientation() { if (window.innerHeight > window.innerWidth) console.warn('Landscape optimized'); }
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