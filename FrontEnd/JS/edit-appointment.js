document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Use same-origin API routes so this page works under the current Spring setup.
 */
const API_CONFIG = {
    BASE_URL: '/api/v1',
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

    const normalizedTarget = normalizeTimeLabel(timeValue);

    const match = Array.from(selectElement.options).find((option) => {
        return normalizeTimeLabel(option.text) === normalizedTarget
            || normalizeTimeLabel(option.value) === normalizedTarget;
    });

    if (match) {
        selectElement.value = match.value;
    }
}

/**
 * Matches a select option by value first, then by visible text.
 * This is used for branch because the backend may return either branchId or branch name.
 */
function selectMatchingOption(selectElement, expectedValue) {
    if (!selectElement || expectedValue === null || expectedValue === undefined || expectedValue === '') {
        return;
    }

    const normalizedExpectedValue = String(expectedValue).trim();

    const valueMatch = Array.from(selectElement.options).find((option) => {
        return String(option.value).trim() === normalizedExpectedValue;
    });

    if (valueMatch) {
        selectElement.value = valueMatch.value;
        return;
    }

    const textMatch = Array.from(selectElement.options).find((option) => {
        return option.text.trim() === normalizedExpectedValue;
    });

    if (textMatch) {
        selectElement.value = textMatch.value;
    }
}

function normalizeAppointmentData(appointmentData) {
    return {
        id: appointmentData.id ?? null,
        procedure: appointmentData.procedure ?? appointmentData.reason ?? '',
        patientName: appointmentData.patientName ?? appointmentData.patient ?? '',
        contactNumber: appointmentData.contactNumber ?? appointmentData.contact ?? '',

        // Normalize date for <input type="date">
        appointmentDate: normalizeDateInputValue(
            appointmentData.appointmentDate ?? appointmentData.date ?? ''
        ),

        // Normalize time so it can match the dropdown options
        startTime: normalizeTimeLabel(
            appointmentData.startTime ?? appointmentData.start ?? ''
        ),
        endTime: normalizeTimeLabel(
            appointmentData.endTime ?? appointmentData.end ?? ''
        ),

        // Branch support for dropdown + summary
        branchId: appointmentData.branchId ?? appointmentData.branch_id ?? '',
        branchName: appointmentData.branchName ?? appointmentData.branch ?? '',
        status: appointmentData.status ?? 1,
        color: appointmentData.color ?? '#097BAC'
    };
}

function normalizeDateInputValue(value) {
    if (!value) {
        return '';
    }

    const rawValue = String(value).trim();

    // Already correct for <input type="date">
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue;
    }

    // Handle ISO / timestamp-like values from backend
    const parsedDate = new Date(rawValue);
    if (!Number.isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return '';
}

function normalizeTimeLabel(value) {
    if (!value) {
        return '';
    }

    const rawValue = String(value).trim().toUpperCase();

    // Convert 24-hour values like 09:00 or 09:00:00
    const time24Match = rawValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (time24Match) {
        const hours24 = Number(time24Match[1]);
        const minutes = time24Match[2];
        const meridiem = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        return `${hours12}:${minutes} ${meridiem}`;
    }

    // Normalize 12-hour values like 09:00 AM -> 9:00 AM
    const time12Match = rawValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (time12Match) {
        const hours = Number(time12Match[1]);
        const minutes = time12Match[2];
        const meridiem = time12Match[3];
        return `${hours}:${minutes} ${meridiem}`;
    }

    return rawValue;
}

function selectMatchingOption(selectElement, expectedValue) {
    if (!selectElement || expectedValue === null || expectedValue === undefined || expectedValue === '') {
        return;
    }

    const normalizedExpectedValue = String(expectedValue).trim();

    const valueMatch = Array.from(selectElement.options).find((option) => {
        return String(option.value).trim() === normalizedExpectedValue;
    });

    if (valueMatch) {
        selectElement.value = valueMatch.value;
        return;
    }

    const textMatch = Array.from(selectElement.options).find((option) => {
        return option.text.trim() === normalizedExpectedValue;
    });

    if (textMatch) {
        selectElement.value = textMatch.value;
    }
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
            summaryDetails: document.getElementById('summary-details'),
            patientNameInput: document.getElementById('patient-name'),
            contactNumberInput: document.getElementById('contact-number'),
            procedureInput: document.getElementById('appointment-procedure'),
            appointmentDateInput: document.getElementById('appointment-date'),
            appointmentDateDisplay: document.getElementById('appointment-date-display'),
            appointmentDatePickerTrigger: document.getElementById('appointment-date-picker-trigger'),
            startTimeSelect: document.getElementById('start-time'),
            endTimeSelect: document.getElementById('end-time'),
            appointmentBranchSelect: document.getElementById('appointment-branch'),

            // Branch dropdown source select
            appointmentBranchSelect: document.getElementById('appointment-branch'),

            // Keep existing structure; branch dropdown is included because it uses .appointment-dropdown
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

        // Branch dropdown reuses the same dropdown component structure as start/end
        el.appointmentBranchSelect?.addEventListener('change', () => {
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

        if (el.appointmentBranchSelect) {
            el.appointmentBranchSelect.value = '';
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

        selectMatchingOption(el.appointmentBranchSelect, appointment.branchId || appointment.branchName);

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

        const branch = el.appointmentBranchSelect?.value
            ? getSelectedOptionText(el.appointmentBranchSelect, '')
            : '';

        const date = el.appointmentDateInput?.value
            ? formatAppointmentDateDisplay(el.appointmentDateInput.value)
            : '';

        const hasStartTime = !!el.startTimeSelect?.value;
        const hasEndTime = !!el.endTimeSelect?.value;

        const startTime = hasStartTime ? getSelectedOptionText(el.startTimeSelect, '') : '';
        const endTime = hasEndTime ? getSelectedOptionText(el.endTimeSelect, '') : '';
        const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';

        const detailParts = [branch, date, timeRange].filter(Boolean);

        if (el.summaryProcedure) {
            el.summaryProcedure.textContent = procedure;
        }

        if (el.summaryPatient) {
            el.summaryPatient.textContent = patient;
        }

        if (el.summaryDetails) {
            el.summaryDetails.textContent = detailParts.length ? detailParts.join(' - ') : '—';
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
            endTime: el.endTimeSelect?.value || '',
            branchId: el.appointmentBranchSelect?.value || ''
        };

        if (
            !payload.patientName ||
            !payload.contactNumber ||
            !payload.procedure ||
            !payload.appointmentDate ||
            !payload.startTime ||
            !payload.endTime ||
            !payload.branchId
        ) {
            console.warn('Validation failed - missing required fields:', payload);
            return;
        }

        try {
            this.ui.setLoading(el.saveButton, true);
            await this.api.put(`/appointments/${state.currentAppointmentId}`, payload);
            window.location.href = '/appointments';
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
            window.location.href = '/appointments';
        } catch (error) {
            console.error('Failed to delete appointment:', error.message);
        } finally {
            this.ui.setLoading(el.deleteButton, false);
        }
    },

    goBackToAppointments() {
        window.location.href = '/appointments';
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