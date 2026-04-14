// This Is Only Boilerplate Script, Copy & Paste This To A New JS File And Go From There.

// ─── PAGE FLOW OVERVIEW ─────────────────────────────────────────────────────
/*
    Edit Appointment page flow:

    1. Read the appointment id from the page URL.
       Example:
       edit-appointment.html?id=67

    2. Cache all edit-page elements used by this file.

    3. Initialize the custom time dropdown UI and bind all page-specific events.

    4. Fetch the appointment from the backend using:
       GET /appointments/{id}

    5. Normalize the returned data so this page can still work even if the
       backend field names differ slightly from the front-end field names.

    6. Populate the form fields and summary header using the fetched data.

    7. As the user edits the form, keep the summary header in sync in real time.

    8. On Save:
       send PUT /appointments/{id}
       then redirect back to Appointments.html if successful.

    9. On Delete:
       send DELETE /appointments/{id}
       then redirect back to Appointments.html if successful.
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

// ─── PAGE STATE ─────────────────────────────────────────────────────────────
const state = {
    currentAppointmentId: null,
    currentAppointment: null
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────
function getAppointmentIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

function formatAppointmentDateDisplay(value) {
    if (!value) {
        return 'MM/DD/YYYY';
    }

    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
}

function getSelectedOptionText(selectElement, fallback = 'Select') {
    if (!selectElement) {
        return fallback;
    }

    return selectElement.options[selectElement.selectedIndex]?.text || fallback;
}

function selectMatchingTimeOption(selectElement, timeValue) {
    if (!selectElement || !timeValue) {
        return;
    }

    const match = Array.from(selectElement.options).find((option) => option.text.trim() === timeValue.trim());

    if (match) {
        selectElement.value = match.value;
    }
}

function normalizeAppointmentData(appointmentData) {
    return {
        id: appointmentData.id ?? null,
        procedure: appointmentData.procedure ?? appointmentData.reason ?? '',
        patientName: appointmentData.patientName ?? appointmentData.patient ?? '',
        contactNumber: appointmentData.contactNumber ?? appointmentData.contact ?? '',
        appointmentDate: appointmentData.appointmentDate ?? appointmentData.date ?? '',
        startTime: appointmentData.startTime ?? appointmentData.start ?? '',
        endTime: appointmentData.endTime ?? appointmentData.end ?? '',
        color: appointmentData.color ?? '#097BAC'
    };
}

const App = {
    /**
     * 2. ELEMENT CACHE
     * Store your querySelectors here so you don't hunt the DOM twice.
     */
    elements: {},

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    async init() {
        console.log('Edit Appointment Page Initialized');

        state.currentAppointmentId = getAppointmentIdFromUrl();

        this.elements = {
            body: document.querySelector('body'),
            breadcrumbAppointmentId: document.getElementById('breadcrumb-appointment-id'),
            appointmentColorStub: document.getElementById('appointment-color-stub'),
            summaryProcedure: document.getElementById('summary-procedure'),
            summaryPatient: document.getElementById('summary-patient'),
            summaryTime: document.getElementById('summary-time'),
            patientNameInput: document.getElementById('patient-name'),
            contactNumberInput: document.getElementById('contact-number'),
            procedureInput: document.getElementById('appointment-procedure'),
            appointmentDateInput: document.getElementById('appointment-date'),
            appointmentDateDisplay: document.getElementById('appointment-date-display'),
            appointmentDatePickerTrigger: document.getElementById('appointment-date-picker-trigger'),
            startTimeSelect: document.getElementById('start-time'),
            endTimeSelect: document.getElementById('end-time'),
            timeDropdowns: document.querySelectorAll('.appointment-dropdown'),
            backButton: document.getElementById('back-btn'),
            deleteButton: document.getElementById('delete-btn'),
            saveButton: document.getElementById('save-btn')
        };

        this.setupTimeDropdowns();
        this.setupEventListeners();
        this.ui.checkOrientation();

        await this.fetchAppointmentById();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        const el = this.elements;

        el.patientNameInput?.addEventListener('input', () => this.syncAppointmentSummary());
        el.procedureInput?.addEventListener('input', () => this.syncAppointmentSummary());

        el.appointmentDateInput?.addEventListener('change', () => {
            this.syncAppointmentDateDisplay();
            this.syncAppointmentSummary();
        });

        el.startTimeSelect?.addEventListener('change', () => {
            this.syncAllTimeDropdownDisplays();
            this.syncAppointmentSummary();
        });

        el.endTimeSelect?.addEventListener('change', () => {
            this.syncAllTimeDropdownDisplays();
            this.syncAppointmentSummary();
        });

        el.appointmentDatePickerTrigger?.addEventListener('click', () => {
            this.openAppointmentDatePicker();
        });

        el.appointmentDatePickerTrigger?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openAppointmentDatePicker();
            }
        });

        el.backButton?.addEventListener('click', () => this.goBackToAppointments());
        el.deleteButton?.addEventListener('click', () => this.deleteAppointment());
        el.saveButton?.addEventListener('click', () => this.updateAppointment());
    },

    // ─── DATA LOADING ────────────────────────────────────────────────────────
    async fetchAppointmentById() {
        const appointmentId = parseInt(state.currentAppointmentId, 10);

        if (!appointmentId) {
            console.warn('Missing appointment id in URL.');

            if (this.elements.breadcrumbAppointmentId) {
                this.elements.breadcrumbAppointmentId.textContent = 'Appointment #—';
            }

            this.resetAppointmentView();
            return;
        }

        try {
            const appointmentData = await this.api.get(`/appointments/${appointmentId}`);
            const normalizedAppointment = normalizeAppointmentData(appointmentData);

            state.currentAppointment = normalizedAppointment;
            this.populateAppointmentForm(normalizedAppointment);
        } catch (error) {
            console.error(`Failed to fetch appointment #${appointmentId}:`, error.message);

            if (this.elements.breadcrumbAppointmentId) {
                this.elements.breadcrumbAppointmentId.textContent = `Appointment #${appointmentId}`;
            }

            this.resetAppointmentView();
        }
    },

    resetAppointmentView() {
        const el = this.elements;

        if (el.appointmentColorStub) {
            el.appointmentColorStub.style.background = '#097BAC';
        }

        if (el.patientNameInput) {
            el.patientNameInput.value = '';
        }

        if (el.contactNumberInput) {
            el.contactNumberInput.value = '';
        }

        if (el.procedureInput) {
            el.procedureInput.value = '';
        }

        if (el.appointmentDateInput) {
            el.appointmentDateInput.value = '';
        }

        if (el.startTimeSelect) {
            el.startTimeSelect.value = '';
        }

        if (el.endTimeSelect) {
            el.endTimeSelect.value = '';
        }

        this.syncAllTimeDropdownDisplays();
        this.syncAppointmentDateDisplay();
        this.syncAppointmentSummary();
    },

    populateAppointmentForm(appointment) {
        const el = this.elements;

        if (el.breadcrumbAppointmentId) {
            el.breadcrumbAppointmentId.textContent = `Appointment #${appointment.id}`;
        }

        if (el.appointmentColorStub) {
            el.appointmentColorStub.style.background = appointment.color || '#097BAC';
        }

        if (el.patientNameInput) {
            el.patientNameInput.value = appointment.patientName || '';
        }

        if (el.contactNumberInput) {
            el.contactNumberInput.value = appointment.contactNumber || '';
        }

        if (el.procedureInput) {
            el.procedureInput.value = appointment.procedure || '';
        }

        if (el.appointmentDateInput) {
            el.appointmentDateInput.value = appointment.appointmentDate || '';
        }

        selectMatchingTimeOption(el.startTimeSelect, appointment.startTime);
        selectMatchingTimeOption(el.endTimeSelect, appointment.endTime);

        this.syncAllTimeDropdownDisplays();
        this.syncAppointmentDateDisplay();
        this.syncAppointmentSummary();
    },

    // ─── TIME DROPDOWN LOGIC ────────────────────────────────────────────────

    setupTimeDropdowns() {
        this.elements.timeDropdowns.forEach((dropdown) => {
            this.buildTimeDropdownOptions(dropdown);
            this.syncTimeDropdownDisplay(dropdown);

            dropdown.querySelector('.appointment-dropdown-toggle')?.addEventListener('click', () => {
                this.toggleTimeDropdown(dropdown);
            });
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(this.elements.timeDropdowns)
                .some((dropdown) => dropdown.contains(event.target));

            if (!clickedInsideDropdown) {
                this.closeAllTimeDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllTimeDropdowns();
            }
        });
    },

    buildTimeDropdownOptions(dropdownElement) {
        const selectElement = dropdownElement?.querySelector('.appointment-select-input');
        const menuElement = dropdownElement?.querySelector('.appointment-dropdown-menu');

        if (!selectElement || !menuElement) {
            return;
        }

        menuElement.innerHTML = '';

        Array.from(selectElement.options).forEach((option) => {
            if (option.disabled) {
                return;
            }

            const optionButton = document.createElement('button');
            optionButton.className = 'appointment-dropdown-option';
            optionButton.type = 'button';
            optionButton.role = 'option';
            optionButton.dataset.value = option.value;
            optionButton.textContent = option.text;

            optionButton.addEventListener('click', () => {
                this.selectTimeDropdownOption(dropdownElement, option.value);
            });

            menuElement.appendChild(optionButton);
        });
    },

    syncTimeDropdownDisplay(dropdownElement) {
        const selectElement = dropdownElement?.querySelector('.appointment-select-input');
        const displayElement = dropdownElement?.querySelector('.appointment-dropdown-value');

        if (!selectElement || !displayElement) {
            return;
        }

        const selectedText = getSelectedOptionText(selectElement);
        const isPlaceholder = !selectElement.value;

        displayElement.textContent = isPlaceholder ? 'Select' : selectedText;
        displayElement.classList.toggle('is-placeholder', isPlaceholder);

        dropdownElement.querySelectorAll('.appointment-dropdown-option').forEach((option) => {
            const isSelected = option.dataset.value === selectElement.value;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
    },

    syncAllTimeDropdownDisplays() {
        this.elements.timeDropdowns.forEach((dropdown) => {
            this.syncTimeDropdownDisplay(dropdown);
        });
    },

    toggleTimeDropdown(dropdownElement) {
        if (!dropdownElement) {
            return;
        }

        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllTimeDropdowns();

        if (!isOpen) {
            this.openTimeDropdown(dropdownElement);
        }
    },

    openTimeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.appointment-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.appointment-dropdown-menu');

        if (!toggle || !menu) {
            return;
        }

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeTimeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.appointment-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.appointment-dropdown-menu');

        if (!dropdownElement || !toggle || !menu) {
            return;
        }

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllTimeDropdowns() {
        this.elements.timeDropdowns.forEach((dropdown) => {
            this.closeTimeDropdown(dropdown);
        });
    },

    selectTimeDropdownOption(dropdownElement, value) {
        const selectElement = dropdownElement?.querySelector('.appointment-select-input');

        if (!selectElement || !value) {
            return;
        }

        if (selectElement.value !== value) {
            selectElement.value = value;
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            this.syncTimeDropdownDisplay(dropdownElement);
        }

        this.closeTimeDropdown(dropdownElement);
    },

    // ─── DISPLAY SYNC HELPERS ───────────────────────────────────────────────

    syncAppointmentDateDisplay() {
        const el = this.elements;

        if (!el.appointmentDateDisplay || !el.appointmentDateInput) {
            return;
        }

        el.appointmentDateDisplay.textContent = formatAppointmentDateDisplay(el.appointmentDateInput.value);
    },

    openAppointmentDatePicker() {
        const appointmentDateInput = this.elements.appointmentDateInput;

        if (!appointmentDateInput) {
            return;
        }

        if (appointmentDateInput.showPicker) {
            appointmentDateInput.showPicker();
        } else {
            appointmentDateInput.focus();
            appointmentDateInput.click();
        }
    },

    syncAppointmentSummary() {
        const el = this.elements;

        const procedure = el.procedureInput?.value.trim() || '—';
        const patient = el.patientNameInput?.value.trim() || '—';

        const hasStartTime = !!el.startTimeSelect?.value;
        const hasEndTime = !!el.endTimeSelect?.value;

        const startTime = hasStartTime ? getSelectedOptionText(el.startTimeSelect, '') : '';
        const endTime = hasEndTime ? getSelectedOptionText(el.endTimeSelect, '') : '';

        if (el.summaryProcedure) {
            el.summaryProcedure.textContent = procedure;
        }

        if (el.summaryPatient) {
            el.summaryPatient.textContent = patient;
        }

        if (el.summaryTime) {
            el.summaryTime.textContent = startTime && endTime ? `${startTime} - ${endTime}` : '—';
        }
    },

    async updateAppointment() {
        const el = this.elements;

        const payload = {
            patientName: el.patientNameInput?.value.trim(),
            contactNumber: el.contactNumberInput?.value.trim(),
            procedure: el.procedureInput?.value.trim(),
            appointmentDate: el.appointmentDateInput?.value,
            startTime: el.startTimeSelect?.value || '',
            endTime: el.endTimeSelect?.value || ''
        };

        if (!payload.patientName || !payload.contactNumber || !payload.procedure || !payload.appointmentDate || !payload.startTime || !payload.endTime) {
            console.warn('Validation failed - missing required fields:', payload);
            return;
        }

        try {
            this.ui.setLoading(el.saveButton, true);
            await this.api.put(`/appointments/${state.currentAppointmentId}`, payload);
            window.location.href = '../HTML/Appointments.html';
        } catch (error) {
            console.error('Failed to update appointment:', error.message);
        } finally {
            this.ui.setLoading(el.saveButton, false);
        }
    },

    async deleteAppointment() {
        const el = this.elements;

        try {
            this.ui.setLoading(el.deleteButton, true);
            await this.api.delete(`/appointments/${state.currentAppointmentId}`);
            window.location.href = '../HTML/Appointments.html';
        } catch (error) {
            console.error('Failed to delete appointment:', error.message);
        } finally {
            this.ui.setLoading(el.deleteButton, false);
        }
    },

    goBackToAppointments() {
        window.location.href = '../HTML/Appointments.html';
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
     */
    ui: {
        setLoading(element, isLoading) {
            if (!element) {
                return;
            }

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
     * 6. API LAYER (REST)
     * Centralized methods for communicating with the Spring Boot controllers.
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

        get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        },

        post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }
    }
};