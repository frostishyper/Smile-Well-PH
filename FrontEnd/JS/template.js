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

        // Patient Identity
        patientPhoto:       document.querySelector('#PO-Patient-Photo'),
        patientName:        document.querySelector('#PO-Patient-Name'),
        phone:              document.querySelector('#PO-Phone'),
        address:            document.querySelector('#PO-Address'),

        // Patient Detail Fields
        sex:                document.querySelector('#PO-Sex'),
        birthday:           document.querySelector('#PO-Birthday'),
        age:                document.querySelector('#PO-Age'),
        blood:              document.querySelector('#PO-Blood'),
        fieldData:          document.querySelector('#PO-Field-Data'),
        insurance:          document.querySelector('#PO-Insurance'),
        firstVisit:         document.querySelector('#PO-First-Visit'),
        lastVisitDate:      document.querySelector('#PO-Last-Visit-Date'),
        lastVisitBranch:    document.querySelector('#PO-Last-Visit-Branch'),

        // Nav Buttons
        fullProfileBtn:     document.querySelector('#PO-Full-Profile-BTN'),
        soaBtn:             document.querySelector('#PO-SOA-BTN'),
        proceduresBtn:      document.querySelector('#PO-Procedures-BTN'),
        newProcedureBtn:    document.querySelector('#PO-New-Procedure-BTN'),

        // Top Bar
        topBarPatientName:  document.querySelector('#TopBar-Patient-Name'),
        staffName:          document.querySelector('#Staff-Name'),
        staffRole:          document.querySelector('#Staff-Role'),
    },

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('Patient Overview Initialized');
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadPatientData();
    },

    /**
     * 4. EVENT LISTENERS
     */
    setupEventListeners() {
        this.elements.fullProfileBtn?.addEventListener('click',  () => this.handleNavigation('full-profile'));
        this.elements.soaBtn?.addEventListener('click',          () => this.handleNavigation('soa'));
        this.elements.proceduresBtn?.addEventListener('click',   () => this.handleNavigation('procedures'));
        this.elements.newProcedureBtn?.addEventListener('click', () => this.handleNavigation('new-procedure'));

        window.addEventListener('resize', () => this.ui.checkOrientation());
    },

    /**
     * 5. PAGE LOGIC
     */

    /**
     * Loads patient data from the backend and populates the UI.
     * Reads the patient ID from the URL query param: ?patientId=123
     */
    async loadPatientData() {
        const patientId = new URLSearchParams(window.location.search).get('patientId');

        if (!patientId) {
            console.warn('No patientId found in URL. Displaying placeholder data.');
            return;
        }

        try {
            const patient = await App.api.get(`/patients/${patientId}`);
            this.populatePatient(patient);
        } catch (error) {
            console.error('Failed to load patient data:', error.message);
        }
    },

    /**
     * Fills the page with the patient object returned by the API.
     * @param {Object} patient - The patient data object from the backend.
     */
    populatePatient(patient) {
        const e = this.elements;

        // Top bar
        if (e.topBarPatientName) e.topBarPatientName.textContent = patient.fullName        ?? '-';

        // Identity
        if (e.patientName)  e.patientName.textContent  = patient.fullName    ?? '-';
        if (e.patientPhoto) e.patientPhoto.src          = patient.photoUrl    ?? e.patientPhoto.src;
        if (e.phone)        e.phone.textContent         = patient.phone       ?? '-';
        if (e.address)      e.address.textContent       = patient.address     ?? '-';

        // Detail fields
        if (e.sex)             e.sex.textContent              = patient.sex              ?? '-';
        if (e.birthday)        e.birthday.textContent         = patient.birthday         ?? '-';
        if (e.age)             e.age.textContent              = patient.age              ?? '-';
        if (e.blood)           e.blood.textContent            = patient.bloodType        ?? '-';
        if (e.fieldData)       e.fieldData.textContent        = patient.fieldData        ?? '-';
        if (e.insurance)       e.insurance.textContent        = patient.insurance        ?? '-';
        if (e.firstVisit)      e.firstVisit.textContent       = patient.firstVisit       ?? '-';
        if (e.lastVisitDate)   e.lastVisitDate.textContent    = patient.lastVisitDate    ?? '-';
        if (e.lastVisitBranch) e.lastVisitBranch.textContent  = patient.lastVisitBranch  ?? '-';
    },

    /**
     * Routes the user to the correct page when a nav card is clicked.
     * @param {string} destination - Which page to navigate to.
     */
    handleNavigation(destination) {
        const patientId = new URLSearchParams(window.location.search).get('patientId');

        const routes = {
            'full-profile':  `full-profile.html?patientId=${patientId}`,
            'soa':           `statement-of-account.html?patientId=${patientId}`,
            'procedures':    `procedures.html?patientId=${patientId}`,
            'new-procedure': `new-procedure.html?patientId=${patientId}`,
        };

        const route = routes[destination];
        if (route) {
            window.location.href = route;
        } else {
            console.warn(`No route defined for: ${destination}`);
        }
    },

    /**
     * 6. UI HELPERS
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
     * 7. API LAYER (REST)
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

        get(endpoint)        { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data) { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(data) }); },
        put(endpoint, data)  { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }); },
        delete(endpoint)     { return this.request(endpoint, { method: 'DELETE' }); }
    }
};