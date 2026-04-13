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

const MOCK_APPOINTMENTS = {
    1:  { id: 1,  procedure: 'Tooth Removal',    patient: 'Jared Ocampo',      contact: '0912345678', start: '1:00 PM', end: '1:30 PM', color: '#097BAC', date: '2026-04-06' },
    2:  { id: 2,  procedure: 'Dental Cleaning',  patient: 'Lee RC',             contact: '0923456789', start: '2:00 PM', end: '3:00 PM', color: '#19D646', date: '2026-04-06' },
    3:  { id: 3,  procedure: 'Brace Adjustment', patient: 'Sebastien Trampe',   contact: '0934567890', start: '4:00 PM', end: '5:00 PM', color: '#F5B119', date: '2026-04-06' },
    4:  { id: 4,  procedure: 'Pasta',            patient: 'Tom Dwayne',         contact: '0945678901', start: '5:00 PM', end: '6:00 PM', color: '#D3030D', date: '2026-04-06' },
    5:  { id: 5,  procedure: 'Tooth Removal',    patient: 'Ryan Tianela Amba',  contact: '0956789012', start: '8:00 PM', end: '9:30 PM', color: '#097BAC', date: '2026-04-06' },
    6:  { id: 6,  procedure: 'Whitening',        patient: 'Maria Santos',       contact: '0967890123', start: '9:00 AM', end: '10:00 AM', color: '#097BAC', date: '2026-04-07' },
    7:  { id: 7,  procedure: 'Root Canal',       patient: 'Juan dela Cruz',     contact: '0978901234', start: '11:00 AM', end: '12:30 PM', color: '#D3030D', date: '2026-04-07' },
    8:  { id: 8,  procedure: 'Checkup',          patient: 'Carlos Mendez',      contact: '0989012345', start: '9:00 AM', end: '9:30 AM', color: '#097BAC', date: '2026-04-11' },
    9:  { id: 9,  procedure: 'Brace Adjustment', patient: 'Sofia Garcia',       contact: '0990123456', start: '11:00 AM', end: '12:00 PM', color: '#F5B119', date: '2026-04-11' },
    10: { id: 10, procedure: 'Tooth Removal',    patient: 'Miguel Torres',      contact: '0901234567', start: '2:00 PM', end: '2:30 PM', color: '#D3030D', date: '2026-04-11' },
    67: { id: 67, procedure: 'Tooth Removal',    patient: 'Jared Ocampo',       contact: '0912345678', start: '1:00 PM', end: '1:30 PM', color: '#097BAC', date: '2026-04-11' }
};

const state = {
    appointmentId: null,
    appointment: null
};

function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

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

function selectClosestTime(selectElement, timeValue) {
    if (!selectElement || !timeValue) {
        return;
    }

    const match = Array.from(selectElement.options).find((option) => option.text.trim() === timeValue.trim());

    if (match) {
        selectElement.value = match.value;
    }
}

const App = {
    elements: {
        body: document.querySelector('body'),
        breadcrumb: document.getElementById('breadcrumb-appt'),
        colorStub: document.getElementById('appt-color-stub'),
        summaryProcedure: document.getElementById('summary-procedure'),
        summaryPatient: document.getElementById('summary-patient'),
        summaryTime: document.getElementById('summary-time'),
        patientName: document.getElementById('patient-name'),
        contactNumber: document.getElementById('contact-number'),
        appointmentReason: document.getElementById('appointment-reason'),
        appointmentDate: document.getElementById('appointment-date'),
        dateDisplay: document.getElementById('date-display'),
        dateDropdownWrapper: document.getElementById('date-dropdown-wrapper'),
        startTime: document.getElementById('start-time'),
        endTime: document.getElementById('end-time'),
        dropdowns: document.querySelectorAll('.appointment-dropdown'),
        backBtn: document.getElementById('back-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        saveBtn: document.getElementById('save-btn')
    },

    init() {
        console.log('Edit Appointment Page Initialized');
        state.appointmentId = getIdFromUrl();

        this.setupCustomDropdowns();
        this.loadAppointment();
        this.syncAllDropdownDisplays();
        this.syncDateDisplay();
        this.updateSummary();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    loadAppointment() {
        const appointmentId = parseInt(state.appointmentId, 10);
        const appointment = MOCK_APPOINTMENTS[appointmentId] || null;

        if (!appointment) {
            console.warn(`Appointment #${appointmentId} not found in mock data.`);

            if (this.elements.breadcrumb) {
                this.elements.breadcrumb.textContent = `Appointment #${appointmentId || '-'}`;
            }

            return;
        }

        state.appointment = appointment;
        this.populateForm(appointment);
    },

    populateForm(appointment) {
        const el = this.elements;

        if (el.breadcrumb) {
            el.breadcrumb.textContent = `Appointment #${appointment.id}`;
        }

        if (el.colorStub) {
            el.colorStub.style.background = appointment.color || '#097BAC';
        }

        if (el.patientName) {
            el.patientName.value = appointment.patient || '';
        }

        if (el.contactNumber) {
            el.contactNumber.value = appointment.contact || '';
        }

        if (el.appointmentReason) {
            el.appointmentReason.value = appointment.procedure || '';
        }

        if (el.appointmentDate) {
            el.appointmentDate.value = appointment.date || '2026-04-11';
        }

        selectClosestTime(el.startTime, appointment.start);
        selectClosestTime(el.endTime, appointment.end);

        this.syncAllDropdownDisplays();
        this.syncDateDisplay();
        this.updateSummary();
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

        el.backBtn?.addEventListener('click', () => this.handleBack());
        el.cancelBtn?.addEventListener('click', () => this.handleDelete());
        el.saveBtn?.addEventListener('click', () => this.handleSave());

        document.getElementById('DashboardPage-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/Dashboard.html';
        });
        document.getElementById('RecordsPage-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/Records.html';
        });
        document.getElementById('AppointmentsPage-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/appointments.html';
        });
        document.getElementById('NewPatientPage-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/NewPatient.html';
        });
        document.getElementById('StaffPage-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/Staff.html';
        });
        document.getElementById('Logout-BTN')?.addEventListener('click', () => {
            window.location.href = '../HTML/Login.html';
        });
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
        const procedure = el.appointmentReason?.value.trim() || 'Appointment';
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
            id: state.appointmentId,
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

        console.log('Saving appointment edit:', payload);
        window.location.href = '../HTML/Appointments.html';
    },

    handleDelete() {
        console.log('Delete appointment id:', state.appointmentId);
    },

    handleBack() {
        window.location.href = '../HTML/Appointments.html';
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
