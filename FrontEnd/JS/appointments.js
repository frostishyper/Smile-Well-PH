/**
 * Appointments.js — SmileWell Dental System
 * Node 209:481 — built from Figma
 */

document.addEventListener('DOMContentLoaded', () => { App.init(); });

/* ── API Config ── */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

/* ── Mock Data ── */
const MOCK_APPOINTMENTS = {
    '2026-04-06': [
        { id: 1, procedure: 'Tooth Removal',    patient: 'Jared Ocampo',     start: '13:00', end: '13:30', color: '#097BAC' },
        { id: 2, procedure: 'Dental Cleaning',  patient: 'Lee RC',            start: '14:00', end: '15:00', color: '#19D646' },
        { id: 3, procedure: 'Brace Adjustment', patient: 'Sebastien Trampe',  start: '16:00', end: '17:00', color: '#F5B119' },
        { id: 4, procedure: 'Pasta',            patient: 'Tom Dwayne',        start: '17:00', end: '18:00', color: '#D3030D' },
        { id: 5, procedure: 'Tooth Removal',    patient: 'Ryan Tianela Amba', start: '20:00', end: '21:30', color: '#097BAC' },
    ],
    '2026-04-07': [
        { id: 6, procedure: 'Whitening',  patient: 'Maria Santos',  start: '09:00', end: '10:00', color: '#097BAC' },
        { id: 7, procedure: 'Root Canal', patient: 'Juan dela Cruz', start: '11:00', end: '12:30', color: '#D3030D' },
    ],
    '2026-04-11': [
        { id: 8,  procedure: 'Checkup',          patient: 'Carlos Mendez', start: '09:00', end: '09:30', color: '#097BAC' },
        { id: 9,  procedure: 'Brace Adjustment', patient: 'Sofia Garcia',  start: '11:00', end: '12:00', color: '#F5B119' },
        { id: 10, procedure: 'Tooth Removal',    patient: 'Miguel Torres', start: '14:00', end: '14:30', color: '#D3030D' },
        { id: 11, procedure: 'Dental Cleaning',  patient: 'Lena Cruz',     start: '15:00', end: '16:00', color: '#19D646' },
    ],
    '2026-04-15': [
        { id: 12, procedure: 'X-Ray',      patient: 'Ramon Diaz',    start: '09:00', end: '09:30', color: '#097BAC' },
        { id: 13, procedure: 'Root Canal', patient: 'Isabel Reyes',  start: '10:00', end: '11:30', color: '#D3030D' },
        { id: 14, procedure: 'Whitening',  patient: 'Paolo Bautista',start: '13:00', end: '14:00', color: '#19D646' },
    ],
    '2026-04-22': [
        { id: 15, procedure: 'Dental Cleaning', patient: 'Grace Lee', start: '10:00', end: '11:00', color: '#19D646' },
    ],
};

const ITEMS_PER_PAGE = 5;

/* ── State ── */
const TODAY = new Date();
const state = {
    selectedDate: new Date(TODAY),
    viewMonth:    TODAY.getMonth(),
    viewYear:     TODAY.getFullYear(),
    currentPage:  1,
    appointments: JSON.parse(JSON.stringify(MOCK_APPOINTMENTS)),
};

/* ── Helpers ── */
function dateKey(d)    { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function fmt12(t24)    { const [h,m]=t24.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }

/* ── SVG Icons ── */
const Icons = {
    edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
    </svg>`,
    cancel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>`,
    go: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
    </svg>`,
};

/* ════════════════════════════════════════════
   APP
════════════════════════════════════════════ */
const App = {

    el: {
        apptList:       document.getElementById('appt-list'),
        apptDateLabel:  document.getElementById('appt-date-label'),
        pagPrev:        document.getElementById('pag-prev'),
        pagNext:        document.getElementById('pag-next'),
        pagInfo:        document.getElementById('pag-info'),
        newBookingBtn:  document.getElementById('new-booking-btn'),
        calDayLabels:   document.getElementById('cal-day-labels'),
        calDates:       document.getElementById('cal-dates'),
        calMonthSelect: document.getElementById('cal-month-select'),
        calYearSelect:  document.getElementById('cal-year-select'),
        calPrevDay:     document.getElementById('cal-prev-day'),
        calNextDay:     document.getElementById('cal-next-day'),
        calDayPill:     document.getElementById('cal-day-pill'),
    },

    init() {
        this.buildYearSelect();
        this.syncDropdowns();
        this.renderCalendar();
        this.renderAppointments();
        this.bindEvents();
        if (window.innerHeight > window.innerWidth) console.warn('Landscape mode recommended.');
    },

    /* ── Year select ── */
    buildYearSelect() {
        const sel = this.el.calYearSelect;
        for (let y = 2024; y <= 2030; y++) {
            const o = document.createElement('option');
            o.value = y; o.textContent = y;
            if (y === state.viewYear) o.selected = true;
            sel.appendChild(o);
        }
    },

    syncDropdowns() {
        if (this.el.calMonthSelect) {
            this.el.calMonthSelect.value = state.viewMonth;
        }

        if (this.el.calYearSelect) {
            this.el.calYearSelect.value = state.viewYear;
        }
    },

    /* ── Calendar ── */
    renderCalendar() {
        const { viewYear: y, viewMonth: m } = state;

        /* --- Day header row --- */
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        this.el.calDayLabels.innerHTML = '';
        dayNames.forEach((d, i) => {
            const cell = document.createElement('div');
            cell.className = `Cal-Day-Cell${i===0?' sunday':''}`;
            cell.innerHTML = `<span class="Cal-Day-Label">${d}</span>`;
            this.el.calDayLabels.appendChild(cell);
        });

        /* --- Build rows of 7 --- */
        const firstDow   = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m+1, 0).getDate();
        const prevDays   = new Date(y, m, 0).getDate();

        // Flatten all cells first
        const cells = [];

        // Leading blank / prev-month cells
        for (let i = firstDow - 1; i >= 0; i--) {
            cells.push({ day: prevDays - i, type: 'other' });
        }
        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ day: d, type: 'current' });
        }
        // Trailing cells to complete last row
        const remainder = cells.length % 7;
        if (remainder !== 0) {
            for (let d = 1; d <= 7 - remainder; d++) {
                cells.push({ day: d, type: 'other' });
            }
        }

        // Render rows
        this.el.calDates.innerHTML = '';
        for (let r = 0; r < cells.length; r += 7) {
            const row = document.createElement('div');
            row.className = 'Cal-Row';
            cells.slice(r, r+7).forEach((c, col) => {
                const isSun      = col === 0;
                const isOther    = c.type === 'other';
                const isSelected = !isOther && isSameDay(new Date(y, m, c.day), state.selectedDate);

                const cell = document.createElement('div');
                cell.className = ['Cal-Day-Cell', isSun?'sunday':'', isOther?'other-month':''].filter(Boolean).join(' ');

                if (isSelected) {
                    cell.innerHTML = `<div class="Cal-Day-Selection"><span class="Cal-Day-Label">${c.day}</span></div>`;
                } else {
                    cell.innerHTML = `<span class="Cal-Day-Label">${c.day}</span>`;
                }

                if (!isOther) {
                    cell.addEventListener('click', () => {
                        state.selectedDate = new Date(y, m, c.day);
                        state.currentPage  = 1;
                        this.renderCalendar();
                        this.renderAppointments();
                    });
                }

                row.appendChild(cell);
            });
            this.el.calDates.appendChild(row);
        }

        // Day pill
        this.el.calDayPill.textContent = state.selectedDate.getDate();
        this.syncDropdowns();
    },

    /* ── Appointments ── */
    renderAppointments() {
        const key      = dateKey(state.selectedDate);
        const allAppts = state.appointments[key] || [];

        // Date label
        this.el.apptDateLabel.textContent = isSameDay(state.selectedDate, TODAY)
            ? 'Today'
            : state.selectedDate.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });

        // Pagination
        const totalPages  = Math.max(1, Math.ceil(allAppts.length / ITEMS_PER_PAGE));
        state.currentPage = Math.min(state.currentPage, totalPages);
        const start       = (state.currentPage - 1) * ITEMS_PER_PAGE;
        const pageAppts   = allAppts.slice(start, start + ITEMS_PER_PAGE);

        this.el.pagInfo.textContent    = `${state.currentPage} / ${totalPages}`;
        this.el.pagPrev.disabled       = state.currentPage <= 1;
        this.el.pagNext.disabled       = state.currentPage >= totalPages;

        // Render
        const list = this.el.apptList;
        list.innerHTML = '';

        if (pageAppts.length === 0) {
            list.innerHTML = `<div class="Appt-Empty-State"><p>No appointments scheduled for this day.</p></div>`;
            return;
        }

        pageAppts.forEach(appt => {
            const entry = document.createElement('div');
            entry.className = 'Appointment-Entry';
            entry.innerHTML = `
                <div class="Appt-Color-Stub" style="background:${appt.color}"></div>
                <div class="Appt-Details">
                    <span class="Appt-Procedure">${appt.procedure}</span>
                    <span class="Appt-Patient">${appt.patient}</span>
                    <span class="Appt-Time">${fmt12(appt.start)} - ${fmt12(appt.end)}</span>
                </div>
                <div class="Appointment-Control">
                    <button class="Appt-Control-BTN Appt-BTN-Edit   edit-btn"   data-id="${appt.id}" title="Edit">${Icons.edit}</button>
                    <button class="Appt-Control-BTN Appt-BTN-Cancel cancel-btn" data-id="${appt.id}" title="Cancel">${Icons.cancel}</button>
                    <button class="Appt-Control-BTN Appt-BTN-Go     go-btn"     data-id="${appt.id}" data-patient="${appt.patient}" title="View Patient">${Icons.go}</button>
                </div>
            `;
            list.appendChild(entry);
        });

        list.querySelectorAll('.edit-btn').forEach(b =>
            b.addEventListener('click', () => { window.location.href = `../HTML/EditAppointment.html?id=${b.dataset.id}`; })
        );
        list.querySelectorAll('.cancel-btn').forEach(b =>
            b.addEventListener('click', () => { console.log('Cancel appt id:', b.dataset.id); /* TODO */ })
        );
        list.querySelectorAll('.go-btn').forEach(b =>
            b.addEventListener('click', () => { console.log('Go to patient:', b.dataset.patient); /* TODO */ })
        );
    },

    /* ── Event Listeners ── */
    bindEvents() {
        const e = this.el;

        // Sidebar
        document.getElementById('DashboardPage-BTN').addEventListener('click',  () => { window.location.href = '../HTML/Dashboard.html'; });
        document.getElementById('RecordsPage-BTN').addEventListener('click',    () => { window.location.href = '../HTML/Records.html'; });
        document.getElementById('NewPatientPage-BTN').addEventListener('click', () => { window.location.href = '../HTML/NewPatient.html'; });
        document.getElementById('StaffPage-BTN').addEventListener('click',      () => { window.location.href = '../HTML/Staff.html'; });
        document.getElementById('Logout-BTN').addEventListener('click',         () => { window.location.href = '../HTML/Login.html'; });

        // New Booking
        e.newBookingBtn.addEventListener('click', () => { window.location.href = '../HTML/NewAppointment.html'; });

        // Appointment pagination
        e.calMonthSelect.addEventListener('change', () => {
            state.viewMonth = parseInt(e.calMonthSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;

            this.renderCalendar();
            this.renderAppointments();
        });

        // Calendar month/year dropdowns
        
        e.calYearSelect.addEventListener('change', () => {
            state.viewYear = parseInt(e.calYearSelect.value, 10);

            const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
            const safeDay = Math.min(state.selectedDate.getDate(), daysInMonth);

            state.selectedDate = new Date(state.viewYear, state.viewMonth, safeDay);
            state.currentPage = 1;

            this.renderCalendar();
            this.renderAppointments();
        });

        // Calendar day navigation
        e.calPrevDay.addEventListener('click', () => {
            state.selectedDate.setDate(state.selectedDate.getDate() - 1);
            state.viewMonth   = state.selectedDate.getMonth();
            state.viewYear    = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });
        e.calNextDay.addEventListener('click', () => {
            state.selectedDate.setDate(state.selectedDate.getDate() + 1);
            state.viewMonth   = state.selectedDate.getMonth();
            state.viewYear    = state.selectedDate.getFullYear();
            state.currentPage = 1;
            this.renderCalendar();
            this.renderAppointments();
        });
    },

    /* ── API Layer ── */
    api: {
        async request(endpoint, options = {}) {
            const url      = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            try {
                const res = await fetch(url, settings);
                if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Status: ${res.status}`); }
                return res.status === 204 ? null : res.json();
            } catch(err) { console.error('Fetch Error:', err.message); throw err; }
        },
        get(ep)        { return this.request(ep, { method: 'GET' }); },
        post(ep, data) { return this.request(ep, { method: 'POST',   body: JSON.stringify(data) }); },
        put(ep, data)  { return this.request(ep, { method: 'PUT',    body: JSON.stringify(data) }); },
        delete(ep)     { return this.request(ep, { method: 'DELETE' }); },
    }
};