document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: '/api/v1', // Using relative path for security and deployment compatibility
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
        
        // Trigger initial data fetch
        this.loadDashboardData();
    },

    cacheElements() {
        this.elements.dropdown = document.querySelector('#Branch-Dropdown');
        if (this.elements.dropdown) {
            this.elements.dropdownTrigger = this.elements.dropdown.querySelector('.Dropdown-Trigger');
            this.elements.dropdownLabel = this.elements.dropdown.querySelector('.Dropdown-Label');
            this.elements.dropdownMenu = this.elements.dropdown.querySelector('.Dropdown-Menu');
        }
        this.elements.appointmentsContainer = document.querySelector('.Coming-Appointments');
    },

    setupEventListeners() {
        if (this.elements.dropdown) {
            this.elements.dropdownTrigger.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.elements.dropdown.classList.toggle('is-open');
            });

            document.addEventListener('click', (e) => {
                if (!this.elements.dropdown.contains(e.target)) {
                    this.elements.dropdown.classList.remove('is-open');
                }
            });
        }
    },

    async loadDashboardData() {
        try {
            // 1. Fetch Summary Data (Metrics & Branches)
            const summary = await this.api.get('/dashboard/summary');
            
            // Update Headers
            document.querySelector('#Staff-Name').textContent = summary.staffName;
            document.querySelector('#Staff-Role').textContent = summary.staffRole;
            
            // Update Quick Metrics
            document.querySelector('#Total-Patients').textContent = summary.totalPatients;
            document.querySelector('#Total-Appointments').textContent = summary.totalAppointments;
            document.querySelector('#Total-Dentist').textContent = summary.totalDentists;
            document.querySelector('#Upcoming-Appointments').textContent = summary.upcomingVisits;

            // 2. Populate Branch Dropdown
            this.populateBranches(summary.branches);

            // 3. Fetch Initial Appointments (All Branches)
            this.fetchAppointments('all');

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    },

    populateBranches(branches) {
        // Reset menu with the default 'All' option
        this.elements.dropdownMenu.innerHTML = `<li class="Dropdown-Item" data-value="all">All Branches</li>`;
        
        // Inject branches from the database
        branches.forEach(branch => {
            const li = `<li class="Dropdown-Item" data-value="${branch.branch_id}">${branch.branch_name}</li>`;
            this.elements.dropdownMenu.insertAdjacentHTML('beforeend', li);
        });

        // Attach click events to the newly created elements
        const items = this.elements.dropdownMenu.querySelectorAll('.Dropdown-Item');
        items.forEach(item => {
            item.addEventListener('click', () => this.handleDropdownSelect(item));
        });
    },

    handleDropdownSelect(selectedItem) {
        this.elements.dropdownLabel.textContent = selectedItem.textContent;
        this.elements.dropdownLabel.style.color = 'var(--Black)'; 
        this.elements.dropdown.classList.remove('is-open');
        
        const branchId = selectedItem.getAttribute('data-value');
        this.fetchAppointments(branchId);
    },

    async fetchAppointments(branchId) {
        try {
            const appointments = await this.api.get(`/dashboard/appointments?branchId=${branchId}`);
            this.renderAppointments(appointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    },

    renderAppointments(appointments) {
        // Clear BOTH the existing appointments AND any previous empty messages
        const existingContent = this.elements.appointmentsContainer.querySelectorAll('.appointment-entry, .empty-appointments-msg');
        existingContent.forEach(element => element.remove());

        // Handle empty state using the new CSS class
        if (appointments.length === 0) {
            this.elements.appointmentsContainer.insertAdjacentHTML('beforeend', 
                `<div class="empty-appointments-msg">No upcoming appointments scheduled</div>`
            );
            return;
        }

        // Generate and inject dynamic HTML for up to 3 entries
        appointments.forEach((apt, index) => {
            const colorClass = `color-stub-${(index % 3) + 1}`; 
            
            const html = `
                <div class="appointment-entry">
                    <div class="${colorClass}"></div>
                    <div class="appointment-details">
                        <h1>${apt.reason}</h1>
                        <h2>${apt.patient_name}</h2>
                        <h2>
                            ${this.ui.formatTime(apt.start_time)} <span> - </span> ${this.ui.formatTime(apt.end_time)}
                        </h2>
                    </div>
                </div>
            `;
            this.elements.appointmentsContainer.insertAdjacentHTML('beforeend', html);
        });
    },

    ui: {
        formatTime(timeStr) {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12; // Convert 24h to 12h format
            return `<span>${h}:${minutes}</span><span>${ampm}</span>`;
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
                throw error;
            }
        },
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    }
};