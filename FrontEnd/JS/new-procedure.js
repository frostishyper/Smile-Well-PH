document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},
    state: {
        patientId: null,
        procedures: []
    },

    init() {
        this.cacheElements();
        const urlParams = new URLSearchParams(window.location.search);
        this.state.patientId = urlParams.get('patientId');
        
        if (!this.state.patientId) return window.location.href = '/records';
        
        this.elements.visitDate.valueAsDate = new Date();
        this.initDropdowns();
        this.setupEventListeners();
        this.loadPageData();
    },

    cacheElements() {
        this.elements = {
            patientName: document.getElementById('Patient-Name-Display'),
            topBarPatientName: document.getElementById('TopBar-Patient-Name'),
            visitNotes: document.getElementById('Visit-Notes-Input'),
            visitDate: document.getElementById('visit-date'),
            dentistDropdown: document.getElementById('Dentist-Dropdown'),
            branchDropdown: document.getElementById('Branch-Dropdown'),
            startTimeDropdown: document.getElementById('Start-Time-Dropdown'),
            endTimeDropdown: document.getElementById('End-Time-Dropdown'),
            procNameInput: document.getElementById('Proc-Name-Input'),
            procCostInput: document.getElementById('Proc-Cost-Input'),
            addProcBtn: document.getElementById('Add-Proc-BTN'),
            procList: document.getElementById('Procedure-List'),
            createBtn: document.getElementById('Create-Visit-BTN'),
            backBtn: document.getElementById('Back-BTN')
        };
    },

    async loadPageData() {
        try {
            const pRes = await fetch(`${API_CONFIG.BASE_URL}/patients/profile/${this.state.patientId}`);
            if (pRes.ok) {
                const patientData = await pRes.json();
                const fullName = `${patientData.first_name} ${patientData.last_name}`;
                this.elements.patientName.textContent = fullName;
                this.elements.topBarPatientName.textContent = fullName;
            }

            const [branches, dentists, timeslots] = await Promise.all([
                this.api.get('/reference/branches'),
                this.api.get('/reference/dentists'),
                this.api.get('/reference/time-slots')
            ]);

            this.populateDropdownMenu(this.elements.branchDropdown, branches, 'branch_id', 'branch_name');
            this.populateDropdownMenu(this.elements.dentistDropdown, dentists, 'staff_id', 'display_name');
            this.populateDropdownMenu(this.elements.startTimeDropdown, timeslots, 'slot_time', 'slot_time');
            this.populateDropdownMenu(this.elements.endTimeDropdown, timeslots, 'slot_time', 'slot_time');

            this.renderProcedures();
        } catch (e) {
            console.error(e);
            alert("Failed to load reference data.");
        }
    },

    populateDropdownMenu(dropdownEl, dataArray, valueKey, labelKey) {
        if (!dropdownEl || !dataArray) return;
        const menu = dropdownEl.querySelector('.Dropdown-Menu');
        menu.innerHTML = dataArray.map(item => `
            <li class="Dropdown-Item" data-value="${item[valueKey]}">${item[labelKey]}</li>
        `).join('');
    },

    initDropdowns() {
        document.addEventListener('click', (e) => {
            const option = e.target.closest('.Dropdown-Item');
            if (option) {
                e.stopPropagation();
                const dropdown = option.closest('.Custom-Dropdown');
                const display = dropdown.querySelector('.Dropdown-Label');
                display.textContent = option.textContent;
                display.style.color = '#000000';
                display.classList.remove('is-placeholder');
                dropdown.dataset.selectedValue = option.dataset.value;
                dropdown.classList.remove('is-open');
                return;
            }

            const trigger = e.target.closest('.Dropdown-Trigger');
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest('.Custom-Dropdown');
                document.querySelectorAll('.Custom-Dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('is-open');
                });
                dropdown.classList.toggle('is-open');
                return;
            }

            document.querySelectorAll('.Custom-Dropdown').forEach(d => d.classList.remove('is-open'));
        });
    },

    setupEventListeners() {
        const el = this.elements;

        el.backBtn?.addEventListener('click', () => {
            window.location.href = `/patient-procedures?patientId=${this.state.patientId}`;
        });

        el.addProcBtn?.addEventListener('click', () => {
            const name = el.procNameInput.value.trim();
            const amount = parseFloat(el.procCostInput.value);
            
            if (name && !isNaN(amount) && amount >= 0) {
                this.state.procedures.push({ id: Date.now(), name, amount });
                el.procNameInput.value = '';
                el.procCostInput.value = '';
                this.renderProcedures();
            }
        });

        el.procList?.addEventListener('click', (e) => {
            const btn = e.target.closest('.ProcedureListRemoveBTN');
            if (btn) {
                const id = Number(btn.dataset.id);
                this.state.procedures = this.state.procedures.filter(p => p.id !== id);
                this.renderProcedures();
            }
        });

        el.createBtn?.addEventListener('click', () => this.createVisit());
    },

    renderProcedures() {
        const list = this.elements.procList;
        if (this.state.procedures.length === 0) {
            list.innerHTML = '<p style="color: var(--Text-Gray); font-size: 1.5rem; padding: 1rem;">No procedures added.</p>';
            return;
        }

        list.innerHTML = this.state.procedures.map(p => `
            <article class="ProcedureListItem" data-id="${p.id}">
                <div class="ProcedureListStub" aria-hidden="true"></div>
                <div class="ProcedureListItemMain">
                    <h3 class="ProcedureListItemTitle">${p.name}</h3>
                    <p class="ProcedureListItemAmount">₱ ${(Number(p.amount) || 0).toFixed(2)}</p>
                </div>
                <div class="ProcedureListRemoveWrap">
                    <button class="ProcedureListRemoveBTN" type="button" data-action="remove" data-id="${p.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none">
                            <path d="M15 27.5C21.9036 27.5 27.5 21.9036 27.5 15C27.5 8.09644 21.9036 2.5 15 2.5C8.09644 2.5 2.5 8.09644 2.5 15C2.5 21.9036 8.09644 27.5 15 27.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19.1667 10.8333L10.8333 19.1667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10.8333 10.8333L19.1667 19.1667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </article>
        `).join('');
    },

    async createVisit() {
        const el = this.elements;
        
        if (!el.branchDropdown.dataset.selectedValue || !el.dentistDropdown.dataset.selectedValue) {
            alert("Branch and Attending Dentist are required.");
            return;
        }

        const payload = {
            patientId: parseInt(this.state.patientId),
            branchId: parseInt(el.branchDropdown.dataset.selectedValue),
            staffId: parseInt(el.dentistDropdown.dataset.selectedValue),
            visitNotes: el.visitNotes.value.trim(),
            visitDate: el.visitDate.value,
            startTime: el.startTimeDropdown.dataset.selectedValue || null,
            endTime: el.endTimeDropdown.dataset.selectedValue || null,
            procedures: this.state.procedures
        };

        try {
            el.createBtn.disabled = true;
            el.createBtn.style.opacity = '0.5';
            
            // POINTING TO NEW CONTROLLER ROUTE
            await this.api.post('/dental-visits', payload);
            window.location.href = `/patient-procedures?patientId=${this.state.patientId}`;
        } catch (e) {
            alert('Failed to create visit.');
            el.createBtn.disabled = false;
            el.createBtn.style.opacity = '1';
        }
    },

    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            const response = await fetch(url, settings);
            if (!response.ok) throw new Error('Network response was not ok');
            return response.status === 204 ? null : response.json();
        },
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    }
};