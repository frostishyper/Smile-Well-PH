document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
};

const ROUTES = {
    dashboard: './index.html',
    records: './patient-procedures.html',
    appointments: './appointments.html',
    newPatient: './new-patient.html',
    staff: './staff-list.html',
    logout: './login.html',
    createVisit: './patient-procedures.html'
};

const state = {
    fields: {
        dentistNotes: '',
        dentist: 'Frostishyper',
        branch: 'Manila',
        visitDate: '2026-04-13',
        startTime: '1:00 PM',
        endTime: '1:30 PM'
    },
    dropdowns: {
        dentist: false,
        branch: false,
        startTime: false,
        endTime: false
    },
    procedures: [
        { id: 2, name: 'Procedure Name 2', amount: 800.0 },
        { id: 1, name: 'Procedure Name 1', amount: 800.0 }
    ]
};

const DROPDOWN_OPTIONS = {
    dentist: ['Frostishyper', 'Yeeard'],
    branch: ['Manila', 'Buendia'],
    startTime: ['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'],
    endTime: ['8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM']
};

function formatPeso(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function formatDateForDisplay(value) {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.split('-').map(Number);
    return `${month}/${day}/${year}`;
}

const App = {
    elements: {
        body: document.querySelector('body'),
        dentistNotesInput: document.getElementById('dentist-notes-input'),
        procedureNameInput: document.getElementById('AppointmentTitleEntryInput'),
        procedureAmountInput: document.getElementById('AppointmentEntryInput'),
        addProcedureBtn: document.getElementById('SaveEditBTN'),
        procedureList: document.getElementById('procedure-list'),
        createVisitBtn: document.getElementById('create-visit-btn'),
        dateInput: document.getElementById('visit-date'),
        nav: {
            dashboard: document.getElementById('DashboardPage-BTN'),
            records: document.getElementById('RecordsPage-BTN'),
            appointments: document.getElementById('AppointmentsPage-BTN'),
            newPatient: document.getElementById('NewPatientPage-BTN'),
            staff: document.getElementById('StaffPage-BTN'),
            logout: document.getElementById('Logout-BTN')
        },
        dropdowns: {
            dentist: {
                wrapper: document.getElementById('dentist-dropdown-wrapper'),
                toggle: document.getElementById('dentist-toggle'),
                value: document.getElementById('dentist-display'),
                menu: document.getElementById('dentist-menu'),
                select: document.getElementById('attending-dentist')
            },
            branch: {
                wrapper: document.getElementById('branch-dropdown-wrapper'),
                toggle: document.getElementById('branch-toggle'),
                value: document.getElementById('branch-display'),
                menu: document.getElementById('branch-menu'),
                select: document.getElementById('branch-select')
            },
            startTime: {
                wrapper: document.getElementById('start-dropdown-wrapper'),
                toggle: document.getElementById('start-time-toggle'),
                value: document.getElementById('start-time-display'),
                menu: document.getElementById('start-time-menu'),
                select: document.getElementById('start-time')
            },
            endTime: {
                wrapper: document.getElementById('end-dropdown-wrapper'),
                toggle: document.getElementById('end-time-toggle'),
                value: document.getElementById('end-time-display'),
                menu: document.getElementById('end-time-menu'),
                select: document.getElementById('end-time')
            }
        }
    },

    init() {
        this.syncInitialState();
        this.setupEventListeners();
        this.renderDropdowns();
        this.renderProcedures();
        this.ui.checkOrientation();
    },

    syncInitialState() {
        if (this.elements.dentistNotesInput) {
            this.elements.dentistNotesInput.value = state.fields.dentistNotes;
        }

        if (this.elements.dateInput) {
            this.elements.dateInput.value = state.fields.visitDate;
        }
    },

    setupEventListeners() {
        this.elements.addProcedureBtn?.addEventListener('click', () => this.addProcedure());
        this.elements.createVisitBtn?.addEventListener('click', () => {
            window.location.href = ROUTES.createVisit;
        });

        this.elements.dentistNotesInput?.addEventListener('input', (event) => {
            state.fields.dentistNotes = event.target.value;
        });

        this.elements.dateInput?.addEventListener('change', (event) => {
            state.fields.visitDate = event.target.value;
        });

        this.elements.procedureList?.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-action="remove"]');
            if (!removeButton) {
                return;
            }

            this.removeProcedure(Number(removeButton.dataset.id));
        });

        Object.entries(this.elements.dropdowns).forEach(([key, dropdown]) => {
            dropdown.toggle?.addEventListener('click', () => {
                this.toggleDropdown(key);
            });
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Object.values(this.elements.dropdowns).some((dropdown) => {
                return dropdown.wrapper?.contains(event.target);
            });

            if (!clickedInsideDropdown) {
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        this.elements.nav.dashboard?.addEventListener('click', () => {
            window.location.href = ROUTES.dashboard;
        });

        this.elements.nav.records?.addEventListener('click', () => {
            window.location.href = ROUTES.records;
        });

        this.elements.nav.appointments?.addEventListener('click', () => {
            window.location.href = ROUTES.appointments;
        });

        this.elements.nav.newPatient?.addEventListener('click', () => {
            window.location.href = ROUTES.newPatient;
        });

        this.elements.nav.staff?.addEventListener('click', () => {
            window.location.href = ROUTES.staff;
        });

        this.elements.nav.logout?.addEventListener('click', () => {
            window.location.href = ROUTES.logout;
        });
    },

    renderDropdowns() {
        Object.entries(this.elements.dropdowns).forEach(([key, dropdown]) => {
            if (!dropdown.menu || !dropdown.value || !dropdown.toggle || !dropdown.wrapper || !dropdown.select) {
                return;
            }

            dropdown.menu.innerHTML = DROPDOWN_OPTIONS[key].map((option) => `
                <button
                    class="appointment-dropdown-option ${state.fields[key] === option ? 'is-selected' : ''}"
                    type="button"
                    data-dropdown-option="${key}"
                    data-value="${option}"
                    role="option"
                    aria-selected="${String(state.fields[key] === option)}"
                >
                    ${option}
                </button>
            `).join('');

            dropdown.value.textContent = state.fields[key];
            dropdown.select.value = state.fields[key];
            dropdown.menu.hidden = !state.dropdowns[key];
            dropdown.wrapper.classList.toggle('open', state.dropdowns[key]);
            dropdown.toggle.setAttribute('aria-expanded', String(state.dropdowns[key]));

            dropdown.menu.querySelectorAll('[data-dropdown-option]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.selectDropdownValue(key, button.dataset.value || '');
                });
            });
        });
    },

    toggleDropdown(key) {
        const nextState = !state.dropdowns[key];
        this.closeAllDropdowns();
        state.dropdowns[key] = nextState;
        this.renderDropdowns();
    },

    closeAllDropdowns() {
        Object.keys(state.dropdowns).forEach((key) => {
            state.dropdowns[key] = false;
        });
        this.renderDropdowns();
    },

    selectDropdownValue(key, value) {
        state.fields[key] = value;
        state.dropdowns[key] = false;
        this.renderDropdowns();
    },

    renderProcedures() {
        if (!this.elements.procedureList) {
            return;
        }

        if (!state.procedures.length) {
            this.elements.procedureList.innerHTML = '<p class="ProcedureListEmpty">No procedures added yet.</p>';
            return;
        }

        this.elements.procedureList.innerHTML = state.procedures.map((procedure) => `
            <article class="ProcedureListItem" data-id="${procedure.id}">
                <div class="ProcedureListStub" aria-hidden="true"></div>
                <div class="ProcedureListItemMain">
                    <h3 class="ProcedureListItemTitle">${procedure.name}</h3>
                    <p class="ProcedureListItemAmount">${formatPeso(procedure.amount)}</p>
                </div>
                <div class="ProcedureListRemoveWrap">
                    <button
                        class="ProcedureListRemoveBTN"
                        type="button"
                        data-action="remove"
                        data-id="${procedure.id}"
                        aria-label="Remove ${procedure.name}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                            <path d="M15 27.5C21.9036 27.5 27.5 21.9036 27.5 15C27.5 8.09644 21.9036 2.5 15 2.5C8.09644 2.5 2.5 8.09644 2.5 15C2.5 21.9036 8.09644 27.5 15 27.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19.1667 10.8333L10.8333 19.1667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10.8333 10.8333L19.1667 19.1667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </article>
        `).join('');
    },

    addProcedure() {
        const name = this.elements.procedureNameInput?.value.trim() || '';
        const amountRaw = this.elements.procedureAmountInput?.value.trim() || '';
        const amount = Number(amountRaw);

        if (!name || !amountRaw || Number.isNaN(amount) || amount < 0) {
            return;
        }

        state.procedures.unshift({
            id: Date.now(),
            name,
            amount
        });

        if (this.elements.procedureNameInput) {
            this.elements.procedureNameInput.value = '';
        }

        if (this.elements.procedureAmountInput) {
            this.elements.procedureAmountInput.value = '';
        }

        this.renderProcedures();
    },

    removeProcedure(id) {
        state.procedures = state.procedures.filter((procedure) => procedure.id !== id);
        this.renderProcedures();
    },

    helpers: {
        formatPeso,
        formatDateForDisplay
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

        createVisit(payload) {
            // TODO: Replace this placeholder with a real backend create-visit endpoint.
            return this.request('/procedures/visits', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
    }
};
