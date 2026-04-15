/**
 * patient-procedures.js — SmileWell Dental System
 * Fixed version following the standard JS Boilerplate.
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
        'Accept': 'application/json'
    }
};

/* =====================================================
   MOCK DATA & STATE (Internal to this page)
   ===================================================== */
const MOCK_PATIENT = { id: 1, name: 'Kasane Teto', role: 'Patient', avatar: '../Media/Patient.jpg' };
const MOCK_DENTIST = { id: 10, name: 'Makoto', role: 'Dentist', avatar: '../Media/Dentist.jpg' };
const MOCK_VISITS = [
    {
        id: 1, number: 1, branch: 'Manila', date: '1/15/2026', timeRange: '9:00 AM - 10:00 AM',
        operations: [{ name: 'Checkup', bill: '₱ 500.00' }],
        notes: 'Patient is in good health. Routine checkup completed.'
    },
    {
        id: 2, number: 2, branch: 'Manila', date: '3/28/2026', timeRange: '11:00 AM - 12:00 AM',
        operations: [
            { name: 'Dental Cleaning', bill: '₱ 800.00' },
            { name: 'Dental Pasta (2x)', bill: '₱ 600.00' }
        ],
        notes: 'Come Back Every Three Months For Check-Up & Cleaning'
    }
];

const state = {
    visitIndex: MOCK_VISITS.length - 1 // Start on latest visit
};

/* =====================================================
   4. APP OBJECT
   ===================================================== */
const App = {
    /**
     * 2. ELEMENT CACHE
     */
    elements: {
        // Visit Display
        visitTitle:         document.getElementById('visit-title'),
        visitBranch:        document.getElementById('visit-branch'),
        visitDate:          document.getElementById('visit-date'),
        visitTimeRange:     document.getElementById('visit-time-range'),
        operationsBody:     document.getElementById('procedures-table-body'),
        dentistNotes:       document.getElementById('dentist-notes-copy'),

        // Pagination
        btnPrev:            document.getElementById('visit-prev-btn'),
        btnNext:            document.getElementById('visit-next-btn'),
        pageIndicator:      document.getElementById('visit-page-indicator'),

        // Sidebar/Overview
        patientName:        document.getElementById('patient-name'),
        patientAvatar:      document.getElementById('patient-avatar'),
        dentistName:        document.getElementById('dentist-name'),
        branchName:         document.getElementById('branch-name'),

        // Actions (Crucial ID Fixes)
        btnEdit:            document.getElementById('visit-edit-btn'),
        btnSOA:             document.getElementById('soa-btn'),
        btnNewProcedure:    document.getElementById('NewProcedure-BTN') 
    },

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('Patient Procedures Logic Initialized');
        this.renderOverview();
        this.renderVisit();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /**
     * 4. EVENT LISTENERS
     */
    setupEventListeners() {
        const el = this.elements;

        // Pagination
        el.btnPrev?.addEventListener('click', () => {
            if (state.visitIndex > 0) {
                state.visitIndex--;
                this.renderVisit();
            }
        });

        el.btnNext?.addEventListener('click', () => {
            if (state.visitIndex < MOCK_VISITS.length - 1) {
                state.visitIndex++;
                this.renderVisit();
            }
        });

        // Navigation Actions
        el.btnNewProcedure?.addEventListener('click', () => {
            window.location.href = `../Pages/new-procedure.html?patient=${MOCK_PATIENT.id}`;
        });

        el.btnSOA?.addEventListener('click', () => {
            window.location.href = `../Pages/soa.html?patient=${MOCK_PATIENT.id}`;
        });

        el.btnEdit?.addEventListener('click', () => {
            const visitId = MOCK_VISITS[state.visitIndex].id;
            window.location.href = `../Pages/edit-appointment.html?id=${visitId}`;
        });
    },

    /**
     * RENDER METHODS
     */
    renderOverview() {
        const el = this.elements;
        if (el.patientName) el.patientName.textContent = MOCK_PATIENT.name;
        if (el.patientAvatar) el.patientAvatar.src = MOCK_PATIENT.avatar;
        if (el.dentistName) el.dentistName.textContent = MOCK_DENTIST.name;
        if (el.branchName) el.branchName.textContent = MOCK_VISITS[0].branch;
    },

    renderVisit() {
        const el = this.elements;
        const visit = MOCK_VISITS[state.visitIndex];

        // Header & Metadata
        if (el.visitTitle) el.visitTitle.textContent = `Visit ${visit.number}`;
        if (el.visitBranch) el.visitBranch.textContent = visit.branch;
        if (el.visitDate) el.visitDate.textContent = visit.date;
        if (el.visitTimeRange) el.visitTimeRange.textContent = visit.timeRange;
        if (el.pageIndicator) el.pageIndicator.textContent = `${state.visitIndex + 1} / ${MOCK_VISITS.length}`;

        // Table Rows
        if (el.operationsBody) {
            el.operationsBody.innerHTML = visit.operations.map(op => `
                <div class="operation-row">
                    <span class="operation-row-name">${op.name}</span>
                    <span class="operation-row-bill">${op.bill}</span>
                </div>
            `).join('');
        }

        // Notes
        if (el.dentistNotes) el.dentistNotes.textContent = visit.notes;

        // Button States
        if (el.btnPrev) el.btnPrev.disabled = (state.visitIndex === 0);
        if (el.btnNext) el.btnNext.disabled = (state.visitIndex === MOCK_VISITS.length - 1);
    },

    /**
     * 5. UI HELPERS
     */
    ui: {
        setLoading(element, isLoading) {
            if (!element) return;
            element.classList.toggle('is-loading', isLoading);
            element.disabled = isLoading;
        },
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                console.warn('System optimized for Landscape view.');
            }
        }
    },

    /**
     * 6. API LAYER
     */
    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
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
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
        put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
        delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
    }
};