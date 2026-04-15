document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

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

const App = {
    elements: {},

    init() {
        console.log('New Appointment Page Initialized');

        this.elements = {
            body: document.querySelector('body'),
            summaryProcedure: document.getElementById('summary-procedure'),
            summaryPatient: document.getElementById('summary-patient'),
            summaryTime: document.getElementById('summary-time'),
            appointmentColorStub: document.getElementById('appointment-color-stub'),
            patientNameInput: document.getElementById('patient-name'),
            contactNumberInput: document.getElementById('contact-number'),
            procedureInput: document.getElementById('appointment-procedure'),
            appointmentDateInput: document.getElementById('appointment-date'),
            startTimeSelect: document.getElementById('start-time'),
            endTimeSelect: document.getElementById('end-time'),
            appointmentDateDisplay: document.getElementById('appointment-date-display'),
            appointmentDatePickerTrigger: document.getElementById('appointment-date-picker-trigger'),
            timeDropdowns: document.querySelectorAll('.appointment-dropdown'),
            cancelButton: document.getElementById('cancel-btn'),
            saveButton: document.getElementById('save-btn')
        };

        this.setupTimeDropdowns();
        this.syncAppointmentDateDisplay();
        this.syncAppointmentSummary();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

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

        el.saveButton?.addEventListener('click', () => this.createAppointment());
        el.cancelButton?.addEventListener('click', () => this.cancelAppointmentCreation());
    },

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

        const procedure = el.procedureInput?.value.trim() || 'New Appointment';
        const patient = el.patientNameInput?.value.trim() || '-';
        const startTime = getSelectedOptionText(el.startTimeSelect, '--:--');
        const endTime = getSelectedOptionText(el.endTimeSelect, '--:--');

        if (el.summaryProcedure) {
            el.summaryProcedure.textContent = procedure;
        }

        if (el.summaryPatient) {
            el.summaryPatient.textContent = patient;
        }

        if (el.summaryTime) {
            el.summaryTime.textContent = `${startTime} - ${endTime}`;
        }
    },

    createAppointment() {
        const el = this.elements;

        const payload = {
            patientName: el.patientNameInput?.value.trim(),
            contactNumber: el.contactNumberInput?.value.trim(),
            procedure: el.procedureInput?.value.trim(),
            appointmentDate: el.appointmentDateInput?.value,
            startTime: getSelectedOptionText(el.startTimeSelect, ''),
            endTime: getSelectedOptionText(el.endTimeSelect, '')
        };

        if (!payload.patientName || !payload.contactNumber || !payload.procedure) {
            console.warn('Validation failed - missing required fields:', payload);
            return;
        }

        console.log('Saving appointment:', payload);
        window.location.href = '../HTML/appointments.html';
    },

    cancelAppointmentCreation() {
        window.location.href = '../HTML/appointments.html';
    },

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