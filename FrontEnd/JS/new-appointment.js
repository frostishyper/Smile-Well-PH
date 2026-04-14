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

function formatDateDisplay(value) {
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
    elements: {
        body: document.querySelector('body'),
        summaryProcedure: document.getElementById('summary-procedure'),
        summaryPatient: document.getElementById('summary-patient'),
        summaryTime: document.getElementById('summary-time'),
        colorStub: document.getElementById('appt-color-stub'),
        patientName: document.getElementById('patient-name'),
        contactNumber: document.getElementById('contact-number'),
        appointmentReason: document.getElementById('appointment-reason'),
        appointmentDate: document.getElementById('appointment-date'),
        startTime: document.getElementById('start-time'),
        endTime: document.getElementById('end-time'),
        dateDisplay: document.getElementById('date-display'),
        dateDropdownWrapper: document.getElementById('date-dropdown-wrapper'),
        dropdowns: document.querySelectorAll('.appointment-dropdown'),
        cancelBtn: document.getElementById('cancel-btn'),
        saveBtn: document.getElementById('save-btn')
    },

    init() {
        console.log('New Appointment Page Initialized');
        this.setupCustomDropdowns();
        this.syncDateDisplay();
        this.updateSummary();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    setupEventListeners() {
        const el = this.elements;

        el.patientName?.addEventListener('input', () => this.updateSummary());
        el.appointmentReason?.addEventListener('input', () => this.updateSummary());
        el.appointmentDate?.addEventListener('change', () => {
            this.syncDateDisplay();
            this.updateSummary();
        });
        el.startTime?.addEventListener('change', () => {
            this.syncAllDropdownDisplays();
            this.updateSummary();
        });
        el.endTime?.addEventListener('change', () => {
            this.syncAllDropdownDisplays();
            this.updateSummary();
        });

        el.dateDropdownWrapper?.addEventListener('click', () => {
            this.openDatePicker();
        });

        el.dateDropdownWrapper?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openDatePicker();
            }
        });

        el.saveBtn?.addEventListener('click', () => this.handleSave());
        el.cancelBtn?.addEventListener('click', () => this.handleCancel());

        
    },

    setupCustomDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => {
            this.buildDropdownOptions(dropdown);
            this.syncDropdownDisplay(dropdown);

            dropdown.querySelector('.appointment-dropdown-toggle')?.addEventListener('click', () => {
                this.toggleDropdown(dropdown);
            });
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(this.elements.dropdowns).some((dropdown) => dropdown.contains(event.target));

            if (!clickedInsideDropdown) {
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
    },

    buildDropdownOptions(dropdownElement) {
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
                this.selectDropdownOption(dropdownElement, option.value);
            });

            menuElement.appendChild(optionButton);
        });
    },

    syncDropdownDisplay(dropdownElement) {
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

    syncAllDropdownDisplays() {
        this.elements.dropdowns.forEach((dropdown) => {
            this.syncDropdownDisplay(dropdown);
        });
    },

    toggleDropdown(dropdownElement) {
        if (!dropdownElement) {
            return;
        }

        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllDropdowns();

        if (!isOpen) {
            this.openDropdown(dropdownElement);
        }
    },

    openDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.appointment-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.appointment-dropdown-menu');

        if (!toggle || !menu) {
            return;
        }

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.appointment-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.appointment-dropdown-menu');

        if (!dropdownElement || !toggle || !menu) {
            return;
        }

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => {
            this.closeDropdown(dropdown);
        });
    },

    selectDropdownOption(dropdownElement, value) {
        const selectElement = dropdownElement?.querySelector('.appointment-select-input');

        if (!selectElement || !value) {
            return;
        }

        if (selectElement.value !== value) {
            selectElement.value = value;
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            this.syncDropdownDisplay(dropdownElement);
        }

        this.closeDropdown(dropdownElement);
    },

    syncDateDisplay() {
        const el = this.elements;

        if (!el.dateDisplay || !el.appointmentDate) {
            return;
        }

        el.dateDisplay.textContent = formatDateDisplay(el.appointmentDate.value);
    },

    openDatePicker() {
        const appointmentDate = this.elements.appointmentDate;

        if (!appointmentDate) {
            return;
        }

        if (appointmentDate.showPicker) {
            appointmentDate.showPicker();
        } else {
            appointmentDate.focus();
            appointmentDate.click();
        }
    },

    updateSummary() {
        const el = this.elements;

        const procedure = el.appointmentReason?.value.trim() || 'New Appointment';
        const patient = el.patientName?.value.trim() || '-';
        const start = getSelectedOptionText(el.startTime, '--:--');
        const end = getSelectedOptionText(el.endTime, '--:--');

        if (el.summaryProcedure) {
            el.summaryProcedure.textContent = procedure;
        }

        if (el.summaryPatient) {
            el.summaryPatient.textContent = patient;
        }

        if (el.summaryTime) {
            el.summaryTime.textContent = `${start} - ${end}`;
        }
    },

    handleSave() {
        const el = this.elements;

        const payload = {
            patientName: el.patientName?.value.trim(),
            contactNumber: el.contactNumber?.value.trim(),
            reason: el.appointmentReason?.value.trim(),
            appointmentDate: el.appointmentDate?.value,
            startTime: getSelectedOptionText(el.startTime, ''),
            endTime: getSelectedOptionText(el.endTime, '')
        };

        if (!payload.patientName || !payload.contactNumber || !payload.reason) {
            console.warn('Validation failed - missing required fields:', payload);
            return;
        }

        console.log('Saving appointment:', payload);
        window.location.href = '../HTML/appointments.html';
    },

    handleCancel() {
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
