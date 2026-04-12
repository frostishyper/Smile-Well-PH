/**
 * NewAppointment.js — SmileWell Dental System
 * Handles the New Appointment page.
 * Save wired to App.api.post (Spring Boot). Discard navigates back.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Set your Spring Boot API base URL and default headers here.
 */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/* =====================================================
2. APP
===================================================== */
const App = {

    /**
     * 2. ELEMENT CACHE
     * Store your querySelectors here so you don't hunt the DOM twice.
     */
    elements: {
        body:              document.querySelector('body'),

        // Summary header (live preview)
        summaryProcedure:  document.getElementById('summary-procedure'),
        summaryPatient:    document.getElementById('summary-patient'),
        summaryTime:       document.getElementById('summary-time'),
        colorStub:         document.getElementById('appt-color-stub'),

        // Form inputs
        patientName:       document.getElementById('patient-name'),
        contactNumber:     document.getElementById('contact-number'),
        appointmentReason: document.getElementById('appointment-reason'),
        appointmentDate:   document.getElementById('appointment-date'),
        startTime:         document.getElementById('start-time'),
        endTime:           document.getElementById('end-time'),

        // Time display spans (show selected value in dropdown)
        dateDisplay:       document.getElementById('date-display'),
        dateDropdownWrapper: document.getElementById('date-dropdown-wrapper'),
        startDisplay:      document.getElementById('start-display'),
        endDisplay:        document.getElementById('end-display'),

        // Action buttons
        cancelBtn:         document.getElementById('cancel-btn'),
        saveBtn:           document.getElementById('save-btn'),
    },

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('New Appointment Page Initialized');
        this.updateSummary();
        if (this.elements.appointmentDate && this.elements.dateDisplay) {
            this.elements.dateDisplay.textContent = this.formatDateDisplay(this.elements.appointmentDate.value);
        }
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        const el = this.elements;

        // Live summary sync
        el.patientName?.addEventListener('input',  () => this.updateSummary());
        el.appointmentReason?.addEventListener('input', () => this.updateSummary());
        el.appointmentDate?.addEventListener('change', () => this.updateSummary());
        el.startTime?.addEventListener('change',   () => this.updateSummary());
        el.endTime?.addEventListener('change',     () => this.updateSummary());

        el.dateDropdownWrapper?.addEventListener('click', () => {
            if (el.appointmentDate?.showPicker) {
                el.appointmentDate.showPicker();
            } else {
                el.appointmentDate?.focus();
                el.appointmentDate?.click();
            }
        });

        el.dateDropdownWrapper?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();

                if (el.appointmentDate?.showPicker) {
                    el.appointmentDate.showPicker();
                } else {
                    el.appointmentDate?.focus();
                    el.appointmentDate?.click();
                }
            }
        });

        // Action buttons
        el.saveBtn?.addEventListener('click',   () => this.handleSave());
        el.cancelBtn?.addEventListener('click', () => this.handleCancel());

        // Sidebar navigation
        document.getElementById('DashboardPage-BTN')?.addEventListener('click',  () => { window.location.href = '../HTML/Dashboard.html'; });
        document.getElementById('RecordsPage-BTN')?.addEventListener('click',    () => { window.location.href = '../HTML/Records.html'; });
        document.getElementById('AppointmentsPage-BTN')?.addEventListener('click',() => { window.location.href = '../HTML/Appointments.html'; });
        document.getElementById('NewPatientPage-BTN')?.addEventListener('click', () => { window.location.href = '../HTML/NewPatient.html'; });
        document.getElementById('StaffPage-BTN')?.addEventListener('click',      () => { window.location.href = '../HTML/Staff.html'; });
        document.getElementById('Logout-BTN')?.addEventListener('click',         () => { window.location.href = '../HTML/Login.html'; });
    },

    /**
     * Formats a date value for display in the UI.
     *  
     *  
     */
    formatDateDisplay(value) {
        if (!value) return 'MM/DD/YYYY';

        const [year, month, day] = value.split('-');
        return `${month}/${day}/${year}`;
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
     */
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

    /**
     * 6. API LAYER (REST)
     * Centralized methods for communicating with the Spring Boot controllers.
     */
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

        // Usage: App.api.get('/patients/123')
        get(endpoint)        { 
            return this.request(endpoint, { method: 'GET' }); 
        },

        // Usage: App.api.post('/auth/login', { user, pass })
        post(endpoint, data) { 
            return this.request(endpoint, { 
                method: 'POST',   
                body: JSON.stringify(data) 
            }); 
        },

        // Usage: App.api.put('/billing/update', updatedData)
        put(endpoint, data)  { 
            return this.request(endpoint, { 
                method: 'PUT',    
                body: JSON.stringify(data) 
            }); 
        },
        
        // Usage: App.api.delete('/records/99')
        delete(endpoint)     { 
            return this.request(endpoint, { method: 'DELETE' }); 
        },
    },

    /* -----------------------------------------------
       LIVE SUMMARY UPDATE
       Keeps the appointment entry header in sync with the form
    ----------------------------------------------- */
    updateSummary() {
        const el = this.elements;

        const procedure = el.appointmentReason?.value.trim() || 'New Appointment';
        const patient   = el.patientName?.value.trim()       || '—';
        const start     = el.startTime?.options[el.startTime.selectedIndex]?.value || '--:--';
        const end       = el.endTime?.options[el.endTime.selectedIndex]?.value     || '--:--';

        if (el.summaryProcedure) el.summaryProcedure.textContent = procedure;
        if (el.summaryPatient)   el.summaryPatient.textContent   = patient;
        if (el.summaryTime)      el.summaryTime.textContent       = `${start} - ${end}`;

        // Sync time display text spans
        if (el.startDisplay && el.startTime) {
            // Show only the time part (strip AM/PM for the compact display)
            el.startDisplay.textContent = el.startTime.options[el.startTime.selectedIndex]?.text?.split(' ')[0] || '—';
        }
        if (el.endDisplay && el.endTime) {
            el.endDisplay.textContent = el.endTime.options[el.endTime.selectedIndex]?.text?.split(' ')[0] || '—';
        }
        if (el.dateDisplay && el.appointmentDate) {
        el.dateDisplay.textContent = this.formatDateDisplay(el.appointmentDate.value);
        }
    },

    /* -----------------------------------------------
       SAVE
    ----------------------------------------------- */
    handleSave() {
        const el = this.elements;

        const payload = {
            patientName:   el.patientName?.value.trim(),
            contactNumber: el.contactNumber?.value.trim(),
            reason:        el.appointmentReason?.value.trim(),
            appointmentDate: el.appointmentDate?.value,
            startTime:     el.startTime?.options[el.startTime.selectedIndex]?.value,
            endTime:       el.endTime?.options[el.endTime.selectedIndex]?.value,
        };

        if (!payload.patientName || !payload.contactNumber || !payload.reason) {
            // TODO: replace with in-page validation UI when designed
            console.warn('Validation failed — missing required fields:', payload);
            return;
        }

        console.log('Saving appointment:', payload);

        // TODO: App.api.post('/appointments', payload)
        //   .then(() => { window.location.href = '../HTML/Appointments.html'; })
        //   .catch(err => { console.error('Save failed:', err); });

        // Placeholder: navigate back after mock save
        window.location.href = '../HTML/appointments.html';
    },

    /* -----------------------------------------------
       DISCARD — navigate back, no confirm dialog
    ----------------------------------------------- */
    handleCancel() {
        window.location.href = '../HTML/appointments.html';
    },

    
};