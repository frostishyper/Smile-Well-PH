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

    // Checks only the essential fields before moving to page 2
    validate() {
        const firstName = document.getElementById('firstnamefield')?.value.trim();
        const lastName = document.getElementById('lastnamefield')?.value.trim();
        const sex = document.getElementById('Sex-Dropdown')?.dataset.selectedValue;

        if (!firstName || !lastName) {
            alert("First and Last Name are required.");
            return false;
        }
        if (!sex) {
            alert("Please select Biological Sex.");
            return false;
        }
        return true;
    },

    async loadDynamicDropdowns() {
        try {
            const bloodDropdown = document.getElementById('Bloodtype-Dropdown');
            if (bloodDropdown) {
                const data = await this.api.get('/reference/blood-types');
                bloodDropdown.querySelector('.Dropdown-Menu').innerHTML = data.map(bt => 
                    `<li class="Dropdown-Item" data-value="${bt.blood_type_name}">${bt.blood_type_name}</li>`
                ).join('');
            }
            const sexDropdown = document.getElementById('Sex-Dropdown');
            if (sexDropdown) {
                const data = await this.api.get('/reference/sex');
                sexDropdown.querySelector('.Dropdown-Menu').innerHTML = data.map(s => 
                    `<li class="Dropdown-Item" data-value="${s.sex_name.charAt(0).toUpperCase()}">${s.sex_name}</li>`
                ).join('');
            }
            this.initDropdowns();
        } catch (e) {
            console.error("Reference data failed", e);
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
        data.personal = {
            firstName: document.getElementById('firstnamefield')?.value,
            middleName: document.getElementById('middlenamefield')?.value,
            lastName: document.getElementById('lastnamefield')?.value,
            contact: document.getElementById('contactNumber')?.value,
            email: document.getElementById('emailAddress')?.value,
            birthday: document.getElementById('birthDate')?.value,
            sex: document.getElementById('Sex-Dropdown')?.dataset.selectedValue,
            bloodType: document.getElementById('Bloodtype-Dropdown')?.dataset.selectedValue,
            validId: document.getElementById('validId')?.value,
            address: document.getElementById('homeAddress')?.value,
            occupation: document.getElementById('occupation')?.value,
            religion: document.getElementById('religion')?.value
        };
        sessionStorage.setItem('newPatientData', JSON.stringify(data));
    },

    loadState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        if (!data.personal) return;
        const p = data.personal;
        const fields = { 
            firstnamefield: p.firstName, middlenamefield: p.middleName, lastnamefield: p.lastName, 
            contactNumber: p.contact, emailAddress: p.email, birthDate: p.birthday, 
            validId: p.validId, homeAddress: p.address, occupation: p.occupation, religion: p.religion 
        };
        Object.entries(fields).forEach(([id, val]) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; });
        if(p.sex) this.ui.updateDropdownUI('Sex-Dropdown', p.sex);
        if(p.bloodType) this.ui.updateDropdownUI('Bloodtype-Dropdown', p.bloodType);
    },

    setupNavigation() {
        document.getElementById('NextBTN')?.addEventListener('click', () => {
            if (this.validate()) {
                this.saveState();
                window.location.href = '/new-patient-related-info';
            }
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