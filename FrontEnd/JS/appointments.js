document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Spring Boot base URL and default headers.
 *
 * Appointments route contract used by this page:
 * - GET    /appointments?date=YYYY-MM-DD&branch=BranchName
 *          Returns an array of appointment objects for one day and one branch.
 * - POST   /appointments
 * - PUT    /appointments/{id}
 * - DELETE /appointments/{id}
 *
 * Expected GET response shape:
 * [
 *   {
 *     id: 1,
 *     procedure: 'Dental Cleaning',
 *     patient: 'Juan Dela Cruz',
 *     start: '09:00',
 *     end: '10:00'
 *   }
 * ]
 */
const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// ─── PAGE CONSTANTS ─────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 5;
const TODAY = new Date();

const STUB_COLORS = [
    '#097BAC',
    '#19D646',
    '#F5B119',
    '#D3030D',
    '#097BAC'
];

// ─── PAGE STATE ─────────────────────────────────────────────────────────────
const state = {
    selectedDate: new Date(TODAY),
    viewMonth: TODAY.getMonth(),
    viewYear: TODAY.getFullYear(),
    selectedBranch: 'Manila',
    currentPage: 1,
    appointments: {}
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────
function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDay(firstDate, secondDate) {
    return firstDate.getFullYear() === secondDate.getFullYear()
        && firstDate.getMonth() === secondDate.getMonth()
        && firstDate.getDate() === secondDate.getDate();
}

function fmt12(time24) {
    const [hour, minute] = time24.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function getSelectedOptionText(selectElement, fallback = 'Select') {
    if (!selectElement) return fallback;
    return selectElement.options[selectElement.selectedIndex]?.text || fallback;
}

function getStubColor(slotIndex) {
    return STUB_COLORS[slotIndex % STUB_COLORS.length];
}

// Optional safety helper for text rendered through innerHTML
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ─── ICON LIBRARY ───────────────────────────────────────────────────────────
const Icons = {
    edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
    cancel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    go: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`
};

// ────────────────────────────────────────────────────────────────────────────

const App = {
    /**
     * 2. ELEMENT CACHE
     * Populated inside init() after DOMContentLoaded.
     */
    elements: {
        body: null
    },

    /**
     * 3. INITIALIZATION
     * Runs on DOMContentLoaded. Caches elements first, then bootstraps
     * all sub-systems in dependency order.
     */
    async init() {
        console.log('Page Logic Initialized');

        this.elements = {
            body: document.querySelector('body'),

            // ─── Appointment List ───
            apptList: document.getElementById('appt-list'),
            apptDateLabel: document.getElementById('appt-date-label'),

            // ─── Pagination ─────────
            pagPrev: document.getElementById('pag-prev'),
            pagNext: document.getElementById('pag-next'),
            pagInfo: document.getElementById('pag-info'),

            // ─── Booking ────────────
            newBookingBtn: document.getElementById('new-booking-btn'),

            // ─── Calendar Grid ──────
            calDayLabels: document.getElementById('cal-day-labels'),
            calDates: document.getElementById('cal-dates'),
            calDayPill: document.getElementById('cal-day-pill'),
            calPrevDay: document.getElementById('cal-prev-day'),
            calNextDay: document.getElementById('cal-next-day'),

            // ─── Calendar Dropdowns ─
            calMonthDropdown: document.getElementById('cal-month-dropdown'),
            calMonthSelect: document.getElementById('cal-month-select'),
            calYearDropdown: document.getElementById('cal-year-dropdown'),
            calYearSelect: document.getElementById('cal-year-select'),
            calBranchDropdown: document.getElementById('cal-branch-dropdown'),
            calBranchSelect: document.getElementById('cal-branch-select'),
            dropdowns: document.querySelectorAll('.Cal-Dropdown')
        };

        this.buildYearSelect();
        this.setupDropdowns();
        this.syncDropdowns();
        this.renderCalendar();
        this.setupEventListeners();
        this.ui.checkOrientation();

        await this.loadAppointmentsForSelectedDate();
        this.renderAppointments();
    },

    // ─── CALENDAR HELPERS ────────────────────────────────────────────────────

    buildYearSelect() {
        const selectElement = this.elements.calYearSelect;
        if (!selectElement) return;

        selectElement.innerHTML = '';

        for (let year = 2024; year <= 2030; year += 1) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === state.viewYear) option.selected = true;
            selectElement.appendChild(option);
        }
    },

    // ─── DATA LOADING ────────────────────────────────────────────────────────

    /**
     * Loads appointments for the currently selected day and branch.
     *
     * Route used:
     * GET /appointments?date=YYYY-MM-DD&branch=BranchName
     *
     * The result is stored in state.appointments using the date key:
     * state.appointments['2026-04-15'] = [...]
     */
    async loadAppointmentsForSelectedDate() {
        const selectedDateKey = dateKey(state.selectedDate);

        try {
            const endpoint =
                `/appointments?date=${encodeURIComponent(selectedDateKey)}&branch=${encodeURIComponent(state.selectedBranch)}`;

            const response = await this.api.get(endpoint);

            state.appointments[selectedDateKey] = Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Failed to load appointments:', error.message);
            state.appointments[selectedDateKey] = [];
        }
    },

    // ─── CUSTOM DROPDOWN LOGIC ───────────────────────────────────────────────

    setupDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => {
            this.buildDropdownOptions(dropdown);
            this.syncDropdownDisplay(dropdown);

            dropdown.querySelector('.Cal-Dropdown-Toggle')?.addEventListener('click', () => {
                this.toggleDropdown(dropdown);
            });
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(this.elements.dropdowns)
                .some((dropdown) => dropdown.contains(event.target));

            if (!clickedInsideDropdown) this.closeAllDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.closeAllDropdowns();
        });
    },

    buildDropdownOptions(dropdownElement) {
        const selectElement = dropdownElement?.querySelector('.Cal-Select');
        const menuElement = dropdownElement?.querySelector('.Cal-Dropdown-Menu');
        if (!selectElement || !menuElement) return;

        menuElement.innerHTML = '';

        Array.from(selectElement.options).forEach((option) => {
            if (option.disabled) return;

            const optionButton = document.createElement('button');
            optionButton.className = 'Cal-Dropdown-Option';
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
        const selectElement = dropdownElement?.querySelector('.Cal-Select');
        const displayElement = dropdownElement?.querySelector('.Cal-Dropdown-Value');
        if (!selectElement || !displayElement) return;

        displayElement.textContent = getSelectedOptionText(selectElement);

        dropdownElement.querySelectorAll('.Cal-Dropdown-Option').forEach((option) => {
            const isSelected = option.dataset.value === selectElement.value;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
    },

    syncDropdowns() {
        const { calMonthSelect, calYearSelect, calBranchSelect, dropdowns } = this.elements;

        if (calMonthSelect) calMonthSelect.value = String(state.viewMonth);
        if (calYearSelect) calYearSelect.value = String(state.viewYear);
        if (calBranchSelect) calBranchSelect.value = state.selectedBranch;

        dropdowns.forEach((dropdown) => this.syncDropdownDisplay(dropdown));
    },

    toggleDropdown(dropdownElement) {
        if (!dropdownElement) return;
        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) this.openDropdown(dropdownElement);
    },

    openDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.Cal-Dropdown-Toggle');
        const menu = dropdownElement?.querySelector('.Cal-Dropdown-Menu');
        if (!toggle || !menu) return;

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.Cal-Dropdown-Toggle');
        const menu = dropdownElement?.querySelector('.Cal-Dropdown-Menu');
        if (!dropdownElement || !toggle || !menu) return;

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => this.closeDropdown(dropdown));
    },

    selectDropdownOption(dropdownElement, value) {
        const selectElement = dropdownElement?.querySelector('.Cal-Select');
        if (!selectElement || !value) return;

        if (selectElement.value !== value) {
            selectElement.value = value;
            selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            this.syncDropdownDisplay(dropdownElement);
        }

        this.closeDropdown(dropdownElement);
    },

    // ─── RENDER FUNCTIONS ────────────────────────────────────────────────────

    renderCalendar() {
        const { calDayLabels, calDates, calDayPill } = this.elements;
        const year = state.viewYear;
        const month = state.viewMonth;

        calDayLabels.innerHTML = '';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((dayName, index) => {
            const cell = document.createElement('div');
            cell.className = `Cal-Day-Cell${index === 0 ? ' sunday' : ''}`;
            cell.innerHTML = `<span class="Cal-Day-Label">${dayName}</span>`;
            calDayLabels.appendChild(cell);
        });

        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const previousMonthDays = new Date(year, month, 0).getDate();
        const cells = [];

        for (let offset = firstDayOfWeek - 1; offset >= 0; offset -= 1) {
            cells.push({ day: previousMonthDays - offset, type: 'other' });
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({ day, type: 'current' });
        }

        const remainder = cells.length % 7;
        if (remainder !== 0) {
            for (let day = 1; day <= 7 - remainder; day += 1) {
                cells.push({ day, type: 'other' });
            }
        }

        calDates.innerHTML = '';

        for (let rowIndex = 0; rowIndex < cells.length; rowIndex += 7) {
            const row = document.createElement('div');
            row.className = 'Cal-Row';

            cells.slice(rowIndex, rowIndex + 7).forEach((cellData, columnIndex) => {
                const isSunday = columnIndex === 0;
                const isOtherMonth = cellData.type === 'other';
                const isSelected = !isOtherMonth && isSameDay(new Date(year, month, cellData.day), state.selectedDate);

                const cell = document.createElement('div');
                cell.className = ['Cal-Day-Cell', isSunday ? 'sunday' : '', isOtherMonth ? 'other-month' : '']
                    .filter(Boolean)
                    .join(' ');

                cell.innerHTML = isSelected
                    ? `<div class="Cal-Day-Selection"><span class="Cal-Day-Label">${cellData.day}</span></div>`
                    : `<span class="Cal-Day-Label">${cellData.day}</span>`;

                if (!isOtherMonth) {
                    cell.addEventListener('click', async () => {
                        state.selectedDate = new Date(year, month, cellData.day);
                        state.currentPage = 1;
                        this.renderCalendar();
                        await this.loadAppointmentsForSelectedDate();
                        this.renderAppointments();
                    });
                }

                row.appendChild(cell);
            });

            calDates.appendChild(row);
        }

        calDayPill.textContent = state.selectedDate.getDate();
        this.syncDropdowns();
    },

    renderAppointments() {
        const { apptList, apptDateLabel, pagPrev, pagNext, pagInfo } = this.elements;

        const appointmentsForDay = state.appointments[dateKey(state.selectedDate)] || [];
        const totalPages = Math.max(1, Math.ceil(appointmentsForDay.length / ITEMS_PER_PAGE));
        state.currentPage = Math.min(state.currentPage, totalPages);

        apptDateLabel.textContent = isSameDay(state.selectedDate, TODAY)
            ? 'Today'
            : state.selectedDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

        const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
        const pageAppointments = appointmentsForDay.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        if (pagInfo) pagInfo.textContent = `${state.currentPage} / ${totalPages}`;
        if (pagPrev) pagPrev.disabled = state.currentPage <= 1;
        if (pagNext) pagNext.disabled = state.currentPage >= totalPages;

        apptList.innerHTML = '';

        if (pageAppointments.length === 0) {
            apptList.innerHTML = '<div class="Appt-Empty-State"><p>No appointments scheduled for this day.</p></div>';
            return;
        }

        pageAppointments.forEach((appointment, index) => {
            const stubColor = getStubColor(index);
            const isCancelled = Number(appointment.status) === 0;

            const entry = document.createElement('div');
            entry.className = 'Appointment-Entry';
            entry.innerHTML = `
                <div class="Appt-Color-Stub" style="background:${stubColor}"></div>
                <div class="Appt-Details">
                    <span class="Appt-Procedure">${escapeHtml(appointment.procedure)}</span>
                    <span class="Appt-Patient">${escapeHtml(appointment.patient)}</span>
                    <div class="Appt-Time-Row">
                        <span class="Appt-Time">${fmt12(appointment.start)} - ${fmt12(appointment.end)}</span>
                        ${isCancelled ? '<span class="Appt-Status Appt-Status-Cancelled">Cancelled</span>' : ''}
                    </div>
                </div>
                <div class="Appointment-Control">
                    <button class="Appt-Control-BTN Appt-BTN-Edit edit-btn" data-id="${appointment.id}" title="Edit">${Icons.edit}</button>
                    <button
                        class="Appt-Control-BTN Appt-BTN-Cancel cancel-btn"
                        data-id="${appointment.id}"
                        data-status="${appointment.status ?? 1}"
                        title="${isCancelled ? 'Already Cancelled' : 'Cancel'}"
                        ${isCancelled ? 'disabled aria-disabled="true"' : ''}
                    >${Icons.cancel}</button>
                    <button class="Appt-Control-BTN Appt-BTN-Go go-btn" data-id="${appointment.id}" data-patient="${escapeHtml(appointment.patient)}" title="View Patient">${Icons.go}</button>
                </div>
            `;
            apptList.appendChild(entry);
        });

        apptList.querySelectorAll('.edit-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const appointmentId = button.dataset.id;

                // Route to the edit appointment page and pass the appointment id in the query string.
                if (!appointmentId) {
                    console.warn('Missing appointment id on edit button.');
                    return;
                }

                window.location.href = `/edit-appointment?id=${encodeURIComponent(appointmentId)}`;
            });
        });


        apptList.querySelectorAll('.cancel-btn').forEach((button) => {
            button.addEventListener('click', async () => {
                const appointmentId = button.dataset.id;
                const currentStatus = button.dataset.status;

                if (!appointmentId) {
                    console.warn('Missing appointment id on cancel button.');
                    return;
                }

                // Already cancelled, so do nothing.
                if (String(currentStatus) === '0') {
                    return;
                }

                const confirmed = window.confirm('Cancel this appointment?');
                if (!confirmed) {
                    return;
                }

                try {
                    await this.api.put(`/appointments/${appointmentId}/cancel`, {});

                    const selectedDateKey = dateKey(state.selectedDate);
                    const currentAppointments = state.appointments[selectedDateKey] || [];

                    // Keep the row, only flip its status to cancelled.
                    state.appointments[selectedDateKey] = currentAppointments.map((appointment) => {
                        if (String(appointment.id) !== String(appointmentId)) {
                            return appointment;
                        }

                        return {
                            ...appointment,
                            status: 0
                        };
                    });

                    this.renderAppointments();
                } catch (error) {
                    console.error(`Failed to cancel appointment #${appointmentId}:`, error.message);
                }
            });
        });

        apptList.querySelectorAll('.go-btn').forEach((button) => {
            button.addEventListener('click', () => {
                console.log('Go to patient:', button.dataset.patient);
            });
        });
    },

    /**
     * 4. EVENT LISTENERS
     * All click, change, and navigation bindings for this page.
     */
    setupEventListeners() {
        const {
            pagPrev,
            pagNext,
            calBranchSelect,
            calBranchDropdown,
            calMonthSelect,
            calYearSelect,
            calPrevDay,
            calNextDay,
            newBookingBtn
        } = this.elements;

        newBookingBtn?.addEventListener('click', () => {
            window.location.href = '../Pages/new-appointment.html';
        });

        pagPrev?.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage -= 1;
                this.renderAppointments();
            }
        });

        pagNext?.addEventListener('click', () => {
            const appointmentsForDay = state.appointments[dateKey(state.selectedDate)] || [];
            const totalPages = Math.max(1, Math.ceil(appointmentsForDay.length / ITEMS_PER_PAGE));

            if (state.currentPage < totalPages) {
                state.currentPage += 1;
                this.renderAppointments();
            }
        });

        calBranchSelect?.addEventListener('change', async () => {
            state.selectedBranch = calBranchSelect.value;
            state.currentPage = 1;
            this.syncDropdownDisplay(calBranchDropdown);
            await this.loadAppointmentsForSelectedDate();
            this.renderAppointments();
        });

        calMonthSelect?.addEventListener('change', async () => {
            state.viewMonth = parseInt(calMonthSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;
            this.renderCalendar();
            await this.loadAppointmentsForSelectedDate();
            this.renderAppointments();
        });

        calYearSelect?.addEventListener('change', async () => {
            state.viewYear = parseInt(calYearSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;
            this.renderCalendar();
            await this.loadAppointmentsForSelectedDate();
            this.renderAppointments();
        });

        calPrevDay?.addEventListener('click', async () => {
            state.selectedDate.setDate(state.selectedDate.getDate() - 1);
            state.viewMonth = state.selectedDate.getMonth();
            state.viewYear = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            await this.loadAppointmentsForSelectedDate();
            this.renderAppointments();
        });

        calNextDay?.addEventListener('click', async () => {
            state.selectedDate.setDate(state.selectedDate.getDate() + 1);
            state.viewMonth = state.selectedDate.getMonth();
            state.viewYear = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            await this.loadAppointmentsForSelectedDate();
            this.renderAppointments();
        });
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states.
     */
    ui: {
        setLoading(element, isLoading) {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },

        put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        },

        delete(endpoint) {
            return this.request(endpoint, { method: 'DELETE' });
        }
    }
};