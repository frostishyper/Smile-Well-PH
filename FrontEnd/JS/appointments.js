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
    '2026-04-06': [
        { id: 1, procedure: 'Tooth Removal', patient: 'Jared Ocampo', start: '13:00', end: '13:30', color: '#097BAC' },
        { id: 2, procedure: 'Dental Cleaning', patient: 'Lee RC', start: '14:00', end: '15:00', color: '#19D646' },
        { id: 3, procedure: 'Brace Adjustment', patient: 'Sebastien Trampe', start: '16:00', end: '17:00', color: '#F5B119' },
        { id: 4, procedure: 'Pasta', patient: 'Tom Dwayne', start: '17:00', end: '18:00', color: '#D3030D' },
        { id: 5, procedure: 'Tooth Removal', patient: 'Ryan Tianela Amba', start: '20:00', end: '21:30', color: '#097BAC' }
    ],
    '2026-04-07': [
        { id: 6, procedure: 'Whitening', patient: 'Maria Santos', start: '09:00', end: '10:00', color: '#097BAC' },
        { id: 7, procedure: 'Root Canal', patient: 'Juan dela Cruz', start: '11:00', end: '12:30', color: '#D3030D' }
    ],
    '2026-04-11': [
        { id: 8, procedure: 'Checkup', patient: 'Carlos Mendez', start: '09:00', end: '09:30', color: '#097BAC' },
        { id: 9, procedure: 'Brace Adjustment', patient: 'Sofia Garcia', start: '11:00', end: '12:00', color: '#F5B119' },
        { id: 10, procedure: 'Tooth Removal', patient: 'Miguel Torres', start: '14:00', end: '14:30', color: '#D3030D' },
        { id: 11, procedure: 'Dental Cleaning', patient: 'Lena Cruz', start: '15:00', end: '16:00', color: '#19D646' }
    ],
    '2026-04-15': [
        { id: 12, procedure: 'X-Ray', patient: 'Ramon Diaz', start: '09:00', end: '09:30', color: '#097BAC' },
        { id: 13, procedure: 'Root Canal', patient: 'Isabel Reyes', start: '10:00', end: '11:30', color: '#D3030D' },
        { id: 14, procedure: 'Whitening', patient: 'Paolo Bautista', start: '13:00', end: '14:00', color: '#19D646' }
    ],
    '2026-04-22': [
        { id: 15, procedure: 'Dental Cleaning', patient: 'Grace Lee', start: '10:00', end: '11:00', color: '#19D646' }
    ]
};

const ITEMS_PER_PAGE = 5;
const TODAY = new Date();
const state = {
    selectedDate: new Date(TODAY),
    viewMonth: TODAY.getMonth(),
    viewYear: TODAY.getFullYear(),
    selectedBranch: 'Manila',
    currentPage: 1,
    appointments: JSON.parse(JSON.stringify(MOCK_APPOINTMENTS))
};

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
    if (!selectElement) {
        return fallback;
    }

    return selectElement.options[selectElement.selectedIndex]?.text || fallback;
}

const Icons = {
    edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
    cancel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    go: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`
};

const App = {
    el: {
        apptList: document.getElementById('appt-list'),
        apptDateLabel: document.getElementById('appt-date-label'),
        pagPrev: document.getElementById('pag-prev'),
        pagNext: document.getElementById('pag-next'),
        pagInfo: document.getElementById('pag-info'),
        newBookingBtn: document.getElementById('new-booking-btn'),
        calDayLabels: document.getElementById('cal-day-labels'),
        calDates: document.getElementById('cal-dates'),
        calMonthDropdown: document.getElementById('cal-month-dropdown'),
        calMonthSelect: document.getElementById('cal-month-select'),
        calYearDropdown: document.getElementById('cal-year-dropdown'),
        calYearSelect: document.getElementById('cal-year-select'),
        calBranchDropdown: document.getElementById('cal-branch-dropdown'),
        calBranchSelect: document.getElementById('cal-branch-select'),
        calPrevDay: document.getElementById('cal-prev-day'),
        calNextDay: document.getElementById('cal-next-day'),
        calDayPill: document.getElementById('cal-day-pill'),
        dropdowns: document.querySelectorAll('.Cal-Dropdown')
    },

    init() {
        this.buildYearSelect();
        this.setupCustomDropdowns();
        this.syncDropdowns();
        this.renderCalendar();
        this.renderAppointments();
        this.bindEvents();

        if (window.innerHeight > window.innerWidth) {
            console.warn('Landscape mode recommended.');
        }
    },

    buildYearSelect() {
        const selectElement = this.el.calYearSelect;

        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = '';

        for (let year = 2024; year <= 2030; year += 1) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;

            if (year === state.viewYear) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        }
    },

    setupCustomDropdowns() {
        this.el.dropdowns.forEach((dropdown) => {
            this.buildDropdownOptions(dropdown);
            this.syncDropdownDisplay(dropdown);

            dropdown.querySelector('.Cal-Dropdown-Toggle')?.addEventListener('click', () => {
                this.toggleDropdown(dropdown);
            });
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(this.el.dropdowns).some((dropdown) => dropdown.contains(event.target));

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
        const selectElement = dropdownElement?.querySelector('.Cal-Select');
        const menuElement = dropdownElement?.querySelector('.Cal-Dropdown-Menu');

        if (!selectElement || !menuElement) {
            return;
        }

        menuElement.innerHTML = '';

        Array.from(selectElement.options).forEach((option) => {
            if (option.disabled) {
                return;
            }

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

        if (!selectElement || !displayElement) {
            return;
        }

        displayElement.textContent = getSelectedOptionText(selectElement);

        dropdownElement.querySelectorAll('.Cal-Dropdown-Option').forEach((option) => {
            const isSelected = option.dataset.value === selectElement.value;
            option.classList.toggle('is-selected', isSelected);
            option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
    },

    syncDropdowns() {
        if (this.el.calMonthSelect) {
            this.el.calMonthSelect.value = String(state.viewMonth);
        }

        if (this.el.calYearSelect) {
            this.el.calYearSelect.value = String(state.viewYear);
        }

        if (this.el.calBranchSelect) {
            this.el.calBranchSelect.value = state.selectedBranch;
        }

        this.el.dropdowns.forEach((dropdown) => {
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
        const toggle = dropdownElement?.querySelector('.Cal-Dropdown-Toggle');
        const menu = dropdownElement?.querySelector('.Cal-Dropdown-Menu');

        if (!toggle || !menu) {
            return;
        }

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.Cal-Dropdown-Toggle');
        const menu = dropdownElement?.querySelector('.Cal-Dropdown-Menu');

        if (!dropdownElement || !toggle || !menu) {
            return;
        }

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllDropdowns() {
        this.el.dropdowns.forEach((dropdown) => {
            this.closeDropdown(dropdown);
        });
    },

    selectDropdownOption(dropdownElement, value) {
        const selectElement = dropdownElement?.querySelector('.Cal-Select');

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

    renderCalendar() {
        const year = state.viewYear;
        const month = state.viewMonth;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.el.calDayLabels.innerHTML = '';

        dayNames.forEach((dayName, index) => {
            const cell = document.createElement('div');
            cell.className = `Cal-Day-Cell${index === 0 ? ' sunday' : ''}`;
            cell.innerHTML = `<span class="Cal-Day-Label">${dayName}</span>`;
            this.el.calDayLabels.appendChild(cell);
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

        this.el.calDates.innerHTML = '';

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

                if (isSelected) {
                    cell.innerHTML = `<div class="Cal-Day-Selection"><span class="Cal-Day-Label">${cellData.day}</span></div>`;
                } else {
                    cell.innerHTML = `<span class="Cal-Day-Label">${cellData.day}</span>`;
                }

                if (!isOtherMonth) {
                    cell.addEventListener('click', () => {
                        state.selectedDate = new Date(year, month, cellData.day);
                        state.currentPage = 1;
                        this.renderCalendar();
                        this.renderAppointments();
                    });
                }

                row.appendChild(cell);
            });

            this.el.calDates.appendChild(row);
        }

        this.el.calDayPill.textContent = state.selectedDate.getDate();
        this.syncDropdowns();
    },

    renderAppointments() {
        const appointmentsForDay = state.appointments[dateKey(state.selectedDate)] || [];
        const totalPages = Math.max(1, Math.ceil(appointmentsForDay.length / ITEMS_PER_PAGE));
        state.currentPage = Math.min(state.currentPage, totalPages);

        this.el.apptDateLabel.textContent = isSameDay(state.selectedDate, TODAY)
            ? 'Today'
            : state.selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
        const pageAppointments = appointmentsForDay.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        this.el.pagInfo.textContent = `${state.currentPage} / ${totalPages}`;
        this.el.pagPrev.disabled = state.currentPage <= 1;
        this.el.pagNext.disabled = state.currentPage >= totalPages;
        this.el.apptList.innerHTML = '';

        if (pageAppointments.length === 0) {
            this.el.apptList.innerHTML = '<div class="Appt-Empty-State"><p>No appointments scheduled for this day.</p></div>';
            return;
        }

        pageAppointments.forEach((appointment) => {
            const entry = document.createElement('div');
            entry.className = 'Appointment-Entry';
            entry.innerHTML = `
                <div class="Appt-Color-Stub" style="background:${appointment.color}"></div>
                <div class="Appt-Details">
                    <span class="Appt-Procedure">${appointment.procedure}</span>
                    <span class="Appt-Patient">${appointment.patient}</span>
                    <span class="Appt-Time">${fmt12(appointment.start)} - ${fmt12(appointment.end)}</span>
                </div>
                <div class="Appointment-Control">
                    <button class="Appt-Control-BTN Appt-BTN-Edit edit-btn" data-id="${appointment.id}" title="Edit">${Icons.edit}</button>
                    <button class="Appt-Control-BTN Appt-BTN-Cancel cancel-btn" data-id="${appointment.id}" title="Cancel">${Icons.cancel}</button>
                    <button class="Appt-Control-BTN Appt-BTN-Go go-btn" data-id="${appointment.id}" data-patient="${appointment.patient}" title="View Patient">${Icons.go}</button>
                </div>
            `;
            this.el.apptList.appendChild(entry);
        });

        this.el.apptList.querySelectorAll('.edit-btn').forEach((button) => {
            button.addEventListener('click', () => {
                window.location.href = `../HTML/EditAppointment.html?id=${button.dataset.id}`;
            });
        });

        this.el.apptList.querySelectorAll('.cancel-btn').forEach((button) => {
            button.addEventListener('click', () => {
                console.log('Cancel appt id:', button.dataset.id);
            });
        });

        this.el.apptList.querySelectorAll('.go-btn').forEach((button) => {
            button.addEventListener('click', () => {
                console.log('Go to patient:', button.dataset.patient);
            });
        });
    },

    bindEvents() {
        const el = this.el;

        

        el.pagPrev?.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage -= 1;
                this.renderAppointments();
            }
        });

        el.pagNext?.addEventListener('click', () => {
            const appointmentsForDay = state.appointments[dateKey(state.selectedDate)] || [];
            const totalPages = Math.max(1, Math.ceil(appointmentsForDay.length / ITEMS_PER_PAGE));

            if (state.currentPage < totalPages) {
                state.currentPage += 1;
                this.renderAppointments();
            }
        });

        el.calBranchSelect?.addEventListener('change', () => {
            state.selectedBranch = el.calBranchSelect.value;
            this.syncDropdownDisplay(el.calBranchDropdown);
        });

        el.calMonthSelect?.addEventListener('change', () => {
            state.viewMonth = parseInt(el.calMonthSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });

        el.calYearSelect?.addEventListener('change', () => {
            state.viewYear = parseInt(el.calYearSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });

        el.calPrevDay?.addEventListener('click', () => {
            state.selectedDate.setDate(state.selectedDate.getDate() - 1);
            state.viewMonth = state.selectedDate.getMonth();
            state.viewYear = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });

        el.calNextDay?.addEventListener('click', () => {
            state.selectedDate.setDate(state.selectedDate.getDate() + 1);
            state.viewMonth = state.selectedDate.getMonth();
            state.viewYear = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });
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
