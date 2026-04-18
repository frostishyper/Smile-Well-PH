document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    init() {
        this.setupNavigation();
        this.setupCancel();
        this.loadDynamicDropdowns().then(() => this.loadState());
        this.ui.checkOrientation();
    },

    // Validates critical Kin/Guardian info required by your SQL schema
    validate() {
        const firstName = document.getElementById('related_firstnamefield')?.value.trim();
        const lastName = document.getElementById('related_lastnamefield')?.value.trim();
        const contact = document.getElementById('related_contactNumber')?.value.trim();
        const relation = document.getElementById('relation')?.value.trim();

        if (!firstName || !lastName || !contact || !relation) {
            alert("Guardian Names, Contact Number, and Relationship Type are required.");
            return false;
        }
        return true;
    },

    async loadDynamicDropdowns() {
        try {
            const sexDropdown = document.getElementById('Sex-Dropdown');
            if (sexDropdown) {
                const data = await this.api.get('/reference/sex');
                sexDropdown.querySelector('.Dropdown-Menu').innerHTML = data.map(s => 
                    `<li class="Dropdown-Item" data-value="${s.sex_name.charAt(0).toUpperCase()}">${s.sex_name}</li>`
                ).join('');
            }
            this.initDropdowns();
        } catch (e) {
            console.error("Reference load failed", e);
            this.initDropdowns();
        }
    },

    initDropdowns() {
        document.querySelectorAll('.Custom-Dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.Dropdown-Trigger');
            const label = dropdown.querySelector('.Dropdown-Label');
            trigger?.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.Custom-Dropdown').forEach(d => { if (d !== dropdown) d.classList.remove('is-open'); });
                dropdown.classList.toggle('is-open');
            });
            dropdown.querySelectorAll('.Dropdown-Item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    label.textContent = item.textContent;
                    label.style.color = '#000000';
                    dropdown.classList.remove('is-open');
                    dropdown.dataset.selectedValue = item.getAttribute('data-value');
                });
            });
        });
        document.addEventListener('click', () => document.querySelectorAll('.Custom-Dropdown').forEach(d => d.classList.remove('is-open')));
    },

    saveState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        data.relatedInfo = {
            firstName: document.getElementById('related_firstnamefield')?.value,
            middleName: document.getElementById('related_middlenamefield')?.value,
            lastName: document.getElementById('related_lastnamefield')?.value,
            contact: document.getElementById('related_contactNumber')?.value,
            email: document.getElementById('related_emailAddress')?.value,
            birthday: document.getElementById('related_birthDate')?.value,
            sex: document.getElementById('Sex-Dropdown')?.dataset.selectedValue,
            relation: document.getElementById('relation')?.value,
            validId: document.getElementById('related_validId')?.value,
            address: document.getElementById('related_homeAddress')?.value
        };
        sessionStorage.setItem('newPatientData', JSON.stringify(data));
    },

    loadState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        if (!data.relatedInfo) return;
        const r = data.relatedInfo;
        const fields = { 
            related_firstnamefield: r.firstName, related_middlenamefield: r.middleName, 
            related_lastnamefield: r.lastName, related_contactNumber: r.contact, 
            related_emailAddress: r.email, related_birthDate: r.birthday, 
            relation: r.relation, related_validId: r.validId, related_homeAddress: r.address 
        };
        Object.entries(fields).forEach(([id, val]) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; });
        if(r.sex) this.ui.updateDropdownUI('Sex-Dropdown', r.sex);
    },

    setupNavigation() {
        document.getElementById('NextBTN')?.addEventListener('click', () => {
            if (this.validate()) {
                this.saveState();
                window.location.href = '/new-patient-health-n-habits';
            }
        });
        document.getElementById('PrevBTN')?.addEventListener('click', () => {
            this.saveState();
            window.location.href = '/new-patient';
        });
    },

    setupCancel() {
        const modal = document.getElementById('deleteModal');
        document.getElementById('CancelBtnControl')?.addEventListener('click', () => modal?.showModal());
        document.getElementById('cancelAction')?.addEventListener('click', () => modal?.close());
        document.getElementById('confirmDelete')?.addEventListener('click', () => {
            sessionStorage.removeItem('newPatientData');
            window.location.href = '/records';
        });
    },

    ui: {
        updateDropdownUI(id, val) {
            const drop = document.getElementById(id);
            const item = drop?.querySelector(`[data-value="${val}"]`);
            if(item) {
                drop.dataset.selectedValue = val;
                drop.querySelector('.Dropdown-Label').textContent = item.textContent;
            }
        },
        checkOrientation() { if (window.innerHeight > window.innerWidth) console.warn('Landscape recommended'); }
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