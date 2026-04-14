/**
 * patient-procedures.js — SmileWell Dental System
 * Patient procedures page logic.
 * Mock data layer; swap App.api calls for Spring Boot endpoints later.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/* =====================================================
   1. BACKEND CONFIGURATION
   ===================================================== */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept':       'application/json'
    }
};

/* =====================================================
   2. MOCK DATA
   ===================================================== */
const MOCK_PATIENT = {
    id:      1,
    name:    'Kasane Teto',
    role:    'Patient',
    avatar:  '../Media/Patient.jpg',
};

const MOCK_DENTIST = {
    id:   10,
    name: 'Makoto',
    role: 'Dentist',
    avatar: '../Media/Dentist.jpg',
};

const MOCK_BRANCH = 'Manila';

const MOCK_VISITS = [
    {
        id:         1,
        number:     1,
        branch:     'Manila',
        date:       '1/15/2026',
        timeRange:  '9:00 AM - 10:00 AM',
        operations: [
            { name: 'Checkup',   bill: '₱ 500.00' },
        ],
        notes: 'Patient is in good health. Routine checkup completed.',
    },
    {
        id:         2,
        number:     2,
        branch:     'Manila',
        date:       '3/28/2026',
        timeRange:  '11:00 AM - 12:00 AM',
        operations: [
            { name: 'Dental Cleaning',  bill: '₱ 800.00' },
            { name: 'Dental Pasta (2x)', bill: '₱ 600.00' },
        ],
        notes: 'Come Back Every Three Months For Check-Up & Cleaning',
    },
];

/* =====================================================
   3. STATE
   ===================================================== */
const state = {
    visitIndex: MOCK_VISITS.length - 1,   // start on last visit
};

/* =====================================================
   4. APP
   ===================================================== */
const App = {

    elements: {
        // Breadcrumb
        patientBreadcrumb:  document.getElementById('patient-breadcrumb'),

        // Visit header
        visitTitle:         document.getElementById('visit-title'),
        visitBranch:        document.getElementById('visit-branch'),
        visitDate:          document.getElementById('visit-date'),
        visitTimeRange:     document.getElementById('visit-time-range'),
        visitEditBtn:       document.getElementById('visit-edit-btn'),

        // Operations
        operationsBody:     document.getElementById('procedures-table-body'),

        // Dentist notes
        dentistNotesCopy:   document.getElementById('dentist-notes-copy'),

        // Pagination
        visitPrevBtn:       document.getElementById('visit-prev-btn'),
        visitNextBtn:       document.getElementById('visit-next-btn'),
        visitPageIndicator: document.getElementById('visit-page-indicator'),

        // Overview
        patientName:        document.getElementById('patient-name'),
        patientRole:        document.getElementById('patient-role'),
        patientAvatar:      document.getElementById('patient-avatar'),
        dentistName:        document.getElementById('dentist-name'),
        dentistRole:        document.getElementById('dentist-role'),
        dentistAvatar:      document.getElementById('dentist-avatar'),
        branchName:         document.getElementById('branch-name'),

        // Action buttons
        soaBtn:             document.getElementById('soa-btn'),
        newProcedureBtn:    document.getElementById('new-procedure-btn'),
    },

    init() {
        console.log('Patient Procedures Page Initialized');
        this.renderOverview();
        this.renderVisit();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /* -----------------------------------------------
       RENDER: Overview panel (patient, dentist, branch)
    ----------------------------------------------- */
    renderOverview() {
        const el = this.elements;

        if (el.patientBreadcrumb)  el.patientBreadcrumb.textContent  = MOCK_PATIENT.name;
        if (el.patientName)        el.patientName.textContent        = MOCK_PATIENT.name;
        if (el.patientRole)        el.patientRole.textContent        = MOCK_PATIENT.role;
        if (el.patientAvatar)      el.patientAvatar.src              = MOCK_PATIENT.avatar;

        if (el.dentistName)        el.dentistName.textContent        = MOCK_DENTIST.name;
        if (el.dentistRole)        el.dentistRole.textContent        = MOCK_DENTIST.role;
        if (el.dentistAvatar)      el.dentistAvatar.src              = MOCK_DENTIST.avatar;

        if (el.branchName)         el.branchName.textContent         = MOCK_BRANCH;
    },

    /* -----------------------------------------------
       RENDER: Current visit
    ----------------------------------------------- */
    renderVisit() {
        const el    = this.elements;
        const visit = MOCK_VISITS[state.visitIndex];
        const total = MOCK_VISITS.length;

        // Pagination
        if (el.visitPageIndicator) el.visitPageIndicator.textContent = `${state.visitIndex + 1} / ${total}`;
        if (el.visitPrevBtn)       el.visitPrevBtn.disabled          = state.visitIndex <= 0;
        if (el.visitNextBtn)       el.visitNextBtn.disabled          = state.visitIndex >= total - 1;

        // Visit header
        if (el.visitTitle)     el.visitTitle.textContent     = `Visit ${visit.number}`;
        if (el.visitBranch)    el.visitBranch.textContent    = visit.branch;
        if (el.visitDate)      el.visitDate.textContent      = visit.date;
        if (el.visitTimeRange) el.visitTimeRange.textContent = visit.timeRange;

        // Operations
        if (el.operationsBody) {
            el.operationsBody.innerHTML = '';
            if (visit.operations.length === 0) {
                el.operationsBody.innerHTML = `<p class="operations-empty">No operations recorded.</p>`;
            } else {
                visit.operations.forEach(op => {
                    const row = document.createElement('div');
                    row.className = 'operation-row';
                    row.innerHTML = `
                        <span class="operation-row-name">${op.name}</span>
                        <span class="operation-row-bill">${op.bill}</span>
                    `;
                    el.operationsBody.appendChild(row);
                });
            }
        }

        // Notes
        if (el.dentistNotesCopy) {
            el.dentistNotesCopy.textContent = visit.notes || 'No notes recorded.';
        }

        // TODO: App.api.get(`/patients/${patientId}/visits/${visit.id}`)
    },

    /* -----------------------------------------------
       EVENT LISTENERS
    ----------------------------------------------- */
    setupEventListeners() {
        const el = this.elements;

        // Pagination
        el.visitPrevBtn?.addEventListener('click', () => {
            if (state.visitIndex > 0) {
                state.visitIndex--;
                this.renderVisit();
            }
        });

        el.visitNextBtn?.addEventListener('click', () => {
            if (state.visitIndex < MOCK_VISITS.length - 1) {
                state.visitIndex++;
                this.renderVisit();
            }
        });

        // Edit visit
        el.visitEditBtn?.addEventListener('click', () => {
            const visit = MOCK_VISITS[state.visitIndex];
            console.log('Edit visit:', visit.id);
            // TODO: window.location.href = `../HTML/edit-visit.html?id=${visit.id}`;
        });

        // Action buttons
        el.soaBtn?.addEventListener('click', () => {
            console.log('Navigate to S.O.A');
            // TODO: window.location.href = `../HTML/soa.html?patient=${MOCK_PATIENT.id}`;
        });

        el.newProcedureBtn?.addEventListener('click', () => {
            console.log('Navigate to New Procedure');
            // TODO: window.location.href = `../HTML/new-procedure.html?patient=${MOCK_PATIENT.id}`;
        });

        
    },

    /* -----------------------------------------------
       UI HELPERS
    ----------------------------------------------- */
    ui: {
        setLoading(el, isLoading) {
            if (!el) return;
            if (isLoading) { el.classList.add('is-loading'); el.disabled = true; }
            else           { el.classList.remove('is-loading'); el.disabled = false; }
        },
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) console.warn('System optimized for Landscape view.');
        }
    },

    /* -----------------------------------------------
       API LAYER — wire to Spring Boot later
    ----------------------------------------------- */
    api: {
        async request(endpoint, options = {}) {
            const url      = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            try {
                const res = await fetch(url, settings);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || `Status: ${res.status}`);
                }
                return res.status === 204 ? null : res.json();
            } catch (e) {
                console.error('Fetch Error:', e.message);
                throw e;
            }
        },
        get(endpoint)        { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data) { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(data) }); },
        put(endpoint, data)  { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }); },
        delete(endpoint)     { return this.request(endpoint, { method: 'DELETE' }); },
    }
};