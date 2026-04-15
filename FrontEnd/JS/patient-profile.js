document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {}, // Leave empty initially so it doesn't fire before the DOM loads

    init() {
        this.cacheElements(); // Grab elements ONLY after the DOM is fully loaded
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadPatientData();
    },

    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),
            topBarPatientName: document.querySelector('.TopBar-Nav-Text strong'),
            patientName: document.querySelector('#PO-Patient-Name'),
            phone: document.querySelector('#PO-Phone'),
            address: document.querySelector('#PO-Address'),
            sex: document.querySelector('#PO-Sex'),
            birthday: document.querySelector('#PO-Birthday'),
            age: document.querySelector('#PO-Age'),
            blood: document.querySelector('#PO-Blood'),
            insurance: document.querySelector('#PO-Insurance'),
            firstVisit: document.querySelector('#PO-First-Visit'),
            lastVisitDate: document.querySelector('#PO-Last-Visit-Date'),
            lastVisitBranch: document.querySelector('#PO-Last-Visit-Branch'),
            fullProfileBtn: document.querySelector('#PO-Full-Profile-BTN'),
            soaBtn: document.querySelector('#PO-SOA-BTN'),
            proceduresBtn: document.querySelector('#PO-Procedures-BTN'),
            newProcedureBtn: document.querySelector('#PO-New-Procedure-BTN')
        };
    },

    setupEventListeners() {
        this.elements.fullProfileBtn?.addEventListener('click', () => this.handleNavigation('full-profile'));
        this.elements.soaBtn?.addEventListener('click', () => this.handleNavigation('soa'));
        this.elements.proceduresBtn?.addEventListener('click', () => this.handleNavigation('patient-procedures'));
        this.elements.newProcedureBtn?.addEventListener('click', () => this.handleNavigation('new-procedure'));
    },

    async loadPatientData() {
        const patientId = new URLSearchParams(window.location.search).get('patientId');
        if (!patientId) {
            console.warn('No patientId in URL.');
            return;
        }
        try {
            const patient = await this.api.get(`/patients/${patientId}`);
            this.populatePatient(patient);
        } catch (error) {
            console.error('Failed to load profile:', error.message);
            if (this.elements.patientName) this.elements.patientName.textContent = "Error Loading Data";
        }
    },

    populatePatient(patient) {
        const e = this.elements;
        const fullName = `${patient.first_name} ${patient.last_name}`;

        if (e.topBarPatientName) e.topBarPatientName.textContent = fullName;
        if (e.patientName) e.patientName.textContent = fullName;
        if (e.phone) e.phone.textContent = patient.contact_number || '-';
        if (e.address) e.address.textContent = patient.home_address || '-';
        if (e.sex) {
            if (patient.sex === 'M') e.sex.textContent = 'Male';
            else if (patient.sex === 'F') e.sex.textContent = 'Female';
            else e.sex.textContent = 'Other';
        }
        if (e.birthday) e.birthday.textContent = patient.birthday || '-';
        if (e.age) e.age.textContent = patient.age || '-';
        if (e.blood) e.blood.textContent = patient.blood_type || '-';
        if (e.insurance) e.insurance.textContent = patient.insurance_provider || 'None';
        if (e.firstVisit) e.firstVisit.textContent = patient.first_visit || 'N/A';
        if (e.lastVisitDate) e.lastVisitDate.textContent = patient.last_visit || 'N/A';
        if (e.lastVisitBranch) e.lastVisitBranch.textContent = patient.last_branch || '-';
    },

    handleNavigation(destination) {
        const patientId = new URLSearchParams(window.location.search).get('patientId');
        if (!patientId) return;

        // Routing through FrontendController
        const route = `/${destination}?patientId=${patientId}`;
        window.location.href = route;
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