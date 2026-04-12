/**
 * edit-appointment.js — SmileWell Dental System
 * Handles the Edit Appointment page.
 * - Reads appointment ID from URL ?id=
 * - Pre-populates form from mock data (swap App.api.get for Spring Boot later)
 * - Save → App.api.put  |  Delete → App.api.delete  |  Back → navigate back
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
   2. MOCK DATA  — replace with App.api.get later
   Mirrors the same data set used in appointments.js
   ===================================================== */
const MOCK_APPOINTMENTS = {
    1:  { id: 1,  procedure: 'Tooth Removal',    patient: 'Jared Ocampo',      contact: '0912345678', start: '1:00 PM', end: '1:30 PM', color: '#097BAC' },
    2:  { id: 2,  procedure: 'Dental Cleaning',  patient: 'Lee RC',             contact: '0923456789', start: '2:00 PM', end: '3:00 PM', color: '#19D646' },
    3:  { id: 3,  procedure: 'Brace Adjustment', patient: 'Sebastien Trampe',   contact: '0934567890', start: '4:00 PM', end: '5:00 PM', color: '#F5B119' },
    4:  { id: 4,  procedure: 'Pasta',            patient: 'Tom Dwayne',         contact: '0945678901', start: '5:00 PM', end: '6:00 PM', color: '#D3030D' },
    5:  { id: 5,  procedure: 'Tooth Removal',    patient: 'Ryan Tianela Amba',  contact: '0956789012', start: '8:00 PM', end: '9:30 PM', color: '#097BAC' },
    6:  { id: 6,  procedure: 'Whitening',        patient: 'Maria Santos',       contact: '0967890123', start: '9:00 AM', end: '10:00 AM',color: '#097BAC' },
    7:  { id: 7,  procedure: 'Root Canal',       patient: 'Juan dela Cruz',     contact: '0978901234', start: '11:00 AM',end: '12:30 PM',color: '#D3030D' },
    8:  { id: 8,  procedure: 'Checkup',          patient: 'Carlos Mendez',      contact: '0989012345', start: '9:00 AM', end: '9:30 AM', color: '#097BAC' },
    9:  { id: 9,  procedure: 'Brace Adjustment', patient: 'Sofia Garcia',       contact: '0990123456', start: '11:00 AM',end: '12:00 PM',color: '#F5B119' },
    10: { id: 10, procedure: 'Tooth Removal',    patient: 'Miguel Torres',      contact: '0901234567', start: '2:00 PM', end: '2:30 PM', color: '#D3030D' },
    67: { id: 67, procedure: 'Tooth Removal',    patient: 'Jared Ocampo',       contact: '0912345678', start: '1:00 PM', end: '1:30 PM', color: '#097BAC' },
};

/* =====================================================
   3. STATE
   ===================================================== */
const state = {
    appointmentId: null,
    appointment:   null,
};

/* =====================================================
   4. HELPERS
   ===================================================== */

/** Parse ?id= from the URL */
function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

/** Match a time string like "1:00 PM" to the closest <option> in a <select> */
function selectClosestTime(selectEl, timeStr) {
    if (!selectEl || !timeStr) return;
    const opts = Array.from(selectEl.options);
    const match = opts.find(o => o.text.trim() === timeStr.trim());
    if (match) selectEl.value = match.value;
}

/* =====================================================
   5. APP
   ===================================================== */
const App = {

    /* --- Element Cache --- */
    elements: {
        body:              document.querySelector('body'),

        breadcrumb:        document.getElementById('breadcrumb-appt'),

        // Summary header (live preview)
        colorStub:         document.getElementById('appt-color-stub'),
        summaryProcedure:  document.getElementById('summary-procedure'),
        summaryPatient:    document.getElementById('summary-patient'),
        summaryTime:       document.getElementById('summary-time'),

        // Form inputs
        patientName:       document.getElementById('patient-name'),
        contactNumber:     document.getElementById('contact-number'),
        appointmentReason: document.getElementById('appointment-reason'),
        startTime:         document.getElementById('start-time'),
        endTime:           document.getElementById('end-time'),

        // Time display spans
        startDisplay:      document.getElementById('start-display'),
        endDisplay:        document.getElementById('end-display'),

        // Action buttons
        backBtn:           document.getElementById('back-btn'),
        cancelBtn:         document.getElementById('cancel-btn'),
        saveBtn:           document.getElementById('save-btn'),
    },

    /* -----------------------------------------------
       INIT
    ----------------------------------------------- */
    init() {
        console.log('Edit Appointment Page Initialized');

        state.appointmentId = getIdFromUrl();

        this.loadAppointment();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /* -----------------------------------------------
       LOAD  — mock data; swap for App.api.get later
    ----------------------------------------------- */
    loadAppointment() {
        const el = this.elements;
        const id = parseInt(state.appointmentId);

        // TODO: replace block below with:
        // App.api.get(`/appointments/${id}`)
        //   .then(data => this.populateForm(data))
        //   .catch(err => console.error('Load failed:', err));

        const appt = MOCK_APPOINTMENTS[id] || null;

        if (!appt) {
            console.warn(`Appointment #${id} not found in mock data.`);
            if (el.breadcrumb) el.breadcrumb.textContent = `Appointment #${id || '—'}`;
            return;
        }

        state.appointment = appt;
        this.populateForm(appt);
    },

    /* -----------------------------------------------
       POPULATE FORM from appointment object
    ----------------------------------------------- */
    populateForm(appt) {
        const el = this.elements;

        // Breadcrumb
        if (el.breadcrumb) el.breadcrumb.textContent = `Appointment #${appt.id}`;

        // Color stub
        if (el.colorStub)  el.colorStub.style.background = appt.color || '#097BAC';

        // Summary header
        if (el.summaryProcedure) el.summaryProcedure.textContent = appt.procedure;
        if (el.summaryPatient)   el.summaryPatient.textContent   = appt.patient;
        if (el.summaryTime)      el.summaryTime.textContent       = `${appt.start} - ${appt.end}`;

        // Form inputs
        if (el.patientName)       el.patientName.value       = appt.patient   || '';
        if (el.contactNumber)     el.contactNumber.value     = appt.contact   || '';
        if (el.appointmentReason) el.appointmentReason.value = appt.procedure || '';

        // Time dropdowns
        selectClosestTime(el.startTime, appt.start);
        selectClosestTime(el.endTime,   appt.end);

        // Sync display text
        this.syncTimeDisplays();
    },

    /* -----------------------------------------------
       LIVE SUMMARY UPDATE
    ----------------------------------------------- */
    updateSummary() {
        const el = this.elements;

        const procedure = el.appointmentReason?.value.trim() || 'Appointment';
        const patient   = el.patientName?.value.trim()       || '—';
        const start     = el.startTime?.options[el.startTime.selectedIndex]?.text?.split(' ')[0] || '--:--';
        const end       = el.endTime?.options[el.endTime.selectedIndex]?.text?.split(' ')[0]     || '--:--';
        const startFull = el.startTime?.options[el.startTime.selectedIndex]?.text || '--';
        const endFull   = el.endTime?.options[el.endTime.selectedIndex]?.text     || '--';

        if (el.summaryProcedure) el.summaryProcedure.textContent = procedure;
        if (el.summaryPatient)   el.summaryPatient.textContent   = patient;
        if (el.summaryTime)      el.summaryTime.textContent       = `${startFull} - ${endFull}`;

        this.syncTimeDisplays();
    },

    syncTimeDisplays() {
        const el = this.elements;
        if (el.startDisplay && el.startTime)
            el.startDisplay.textContent = el.startTime.options[el.startTime.selectedIndex]?.text?.split(' ')[0] || '—';
        if (el.endDisplay && el.endTime)
            el.endDisplay.textContent   = el.endTime.options[el.endTime.selectedIndex]?.text?.split(' ')[0] || '—';
    },

    /* -----------------------------------------------
       SAVE
    ----------------------------------------------- */
    handleSave() {
        const el = this.elements;
        const id = state.appointmentId;

        const payload = {
            id:            id,
            patientName:   el.patientName?.value.trim(),
            contactNumber: el.contactNumber?.value.trim(),
            reason:        el.appointmentReason?.value.trim(),
            startTime:     el.startTime?.options[el.startTime.selectedIndex]?.text,
            endTime:       el.endTime?.options[el.endTime.selectedIndex]?.text,
        };

        if (!payload.patientName || !payload.contactNumber || !payload.reason) {
            console.warn('Validation failed — missing required fields:', payload);
            return;
        }

        console.log('Saving appointment edit:', payload);

        // TODO: App.api.put(`/appointments/${id}`, payload)
        //   .then(() => { window.location.href = '../HTML/Appointments.html'; })
        //   .catch(err => { console.error('Save failed:', err); });

        window.location.href = '../HTML/Appointments.html';
    },

    /* -----------------------------------------------
       DELETE — stubbed, pending Figma cancel flow confirmation
    ----------------------------------------------- */
    handleDelete() {
        const id = state.appointmentId;
        console.log('Delete appointment id:', id);

        // TODO: App.api.delete(`/appointments/${id}`)
        //   .then(() => { window.location.href = '../HTML/Appointments.html'; })
        //   .catch(err => { console.error('Delete failed:', err); });
    },

    /* -----------------------------------------------
       BACK — navigate to Appointments
    ----------------------------------------------- */
    handleBack() {
        window.location.href = '../HTML/Appointments.html';
    },

    /* -----------------------------------------------
       EVENT LISTENERS
    ----------------------------------------------- */
    setupEventListeners() {
        const el = this.elements;

        // Live summary sync
        el.patientName?.addEventListener('input',       () => this.updateSummary());
        el.appointmentReason?.addEventListener('input', () => this.updateSummary());
        el.startTime?.addEventListener('change',        () => this.updateSummary());
        el.endTime?.addEventListener('change',          () => this.updateSummary());

        // Action buttons
        el.backBtn?.addEventListener('click',   () => this.handleBack());
        el.cancelBtn?.addEventListener('click', () => this.handleDelete());
        el.saveBtn?.addEventListener('click',   () => this.handleSave());

        // Sidebar navigation
        document.getElementById('DashboardPage-BTN')?.addEventListener('click',   () => { window.location.href = '../HTML/Dashboard.html'; });
        document.getElementById('RecordsPage-BTN')?.addEventListener('click',     () => { window.location.href = '../HTML/Records.html'; });
        document.getElementById('AppointmentsPage-BTN')?.addEventListener('click',() => { window.location.href = '../HTML/appointments.html'; });
        document.getElementById('NewPatientPage-BTN')?.addEventListener('click',  () => { window.location.href = '../HTML/NewPatient.html'; });
        document.getElementById('StaffPage-BTN')?.addEventListener('click',       () => { window.location.href = '../HTML/Staff.html'; });
        document.getElementById('Logout-BTN')?.addEventListener('click',          () => { window.location.href = '../HTML/Login.html'; });
    },

    /* -----------------------------------------------
       UI HELPERS
    ----------------------------------------------- */
    ui: {
        setLoading(element, isLoading) {
            if (!element) return;
            if (isLoading) { element.classList.add('is-loading'); element.disabled = true; }
            else           { element.classList.remove('is-loading'); element.disabled = false; }
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
        delete(endpoint)     { return this.request(endpoint, { method: 'DELETE' }); },
    }
};