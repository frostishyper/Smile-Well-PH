document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},
    state: {
        patientId: null,
        patientData: null,
        visits: [],
        currentIndex: 0
    },

    init() {
        this.cacheElements();
        this.state.patientId = new URLSearchParams(window.location.search).get('patientId');
        if (!this.state.patientId) return window.location.href = '/records';
        
        this.setupEventListeners();
        this.loadPatientAndVisits();
    },

    cacheElements() {
        this.elements = {
            soaBtn: document.querySelector('#Soa-BTN'),
            newProcedureBtn: document.querySelector('#NewProcedure-BTN'),
            editVisitBtn: document.querySelector('#Edit-Visit-BTN'),
            prevBtn: document.querySelector('#PrevBTN'),
            nextBtn: document.querySelector('#NextBTN'),
            
            topBarPatientName: document.querySelector('#TopBar-Patient-Name'),
            sidebarPatientName: document.querySelector('#Sidebar-Patient-Name'),
            sidebarDentistName: document.querySelector('#Sidebar-Dentist-Name'),
            sidebarBranchName: document.querySelector('#Sidebar-Branch-Name'),

            currentPage: document.querySelector('#CurrentPage'),
            totalVisit: document.querySelector('#TotalVisit'),
            visitNumber: document.querySelector('#VisitNumber'),
            visitCity: document.querySelector('#VisitInfoCity'),
            visitDate: document.querySelector('#VisitInfoDate'),
            operationsContainer: document.querySelector('#VisitOperations-Container'),
            visitNotes: document.querySelector('#VisitNotesText')
        };
    },

    setupEventListeners() {
        const el = this.elements;
        el.soaBtn?.addEventListener('click', () => window.location.href = `/soa?patientId=${this.state.patientId}`);
        el.newProcedureBtn?.addEventListener('click', () => window.location.href = `/new-procedure?patientId=${this.state.patientId}`);
        
        el.prevBtn?.addEventListener('click', () => {
            if (this.state.currentIndex > 0) {
                this.state.currentIndex--;
                this.renderVisit();
            }
        });

        el.nextBtn?.addEventListener('click', () => {
            if (this.state.currentIndex < this.state.visits.length - 1) {
                this.state.currentIndex++;
                this.renderVisit();
            }
        });

        el.editVisitBtn?.addEventListener('click', () => {
            const currentVisit = this.state.visits[this.state.currentIndex];
            if (currentVisit) {
                window.location.href = `/edit-procedure?patientId=${this.state.patientId}&visitId=${currentVisit.visit_id}`;
            }
        });
    },

    async loadPatientAndVisits() {
        try {
            const pRes = await fetch(`${API_CONFIG.BASE_URL}/patients/profile/${this.state.patientId}`, { headers: API_CONFIG.HEADERS });
            if (pRes.ok) {
                this.state.patientData = await pRes.json();
                const fullName = `${this.state.patientData.first_name} ${this.state.patientData.last_name}`;
                this.elements.topBarPatientName.textContent = fullName;
                this.elements.sidebarPatientName.textContent = fullName;
            }

            // POINTING TO NEW CONTROLLER ROUTE
            const vRes = await fetch(`${API_CONFIG.BASE_URL}/dental-visits/patient/${this.state.patientId}`, { headers: API_CONFIG.HEADERS });
            if (!vRes.ok) throw new Error('Visits fetch failed');
            this.state.visits = await vRes.json();
            
            this.renderVisit();
        } catch (e) {
            console.error(e);
            this.elements.visitNotes.textContent = "Error loading visits.";
        }
    },

    renderVisit() {
        const el = this.elements;
        
        const labels = el.operationsContainer.querySelector('.OperationLabels');
        el.operationsContainer.innerHTML = '';
        el.operationsContainer.appendChild(labels);

        if (this.state.visits.length === 0) {
            el.currentPage.textContent = '0';
            el.totalVisit.textContent = '0';
            el.visitNotes.textContent = 'No past visits found.';
            return;
        }

        const visit = this.state.visits[this.state.currentIndex];
        
        el.currentPage.textContent = (this.state.currentIndex + 1).toString();
        el.totalVisit.textContent = this.state.visits.length.toString();
        el.visitNumber.textContent = (this.state.visits.length - this.state.currentIndex).toString();
        
        el.visitCity.textContent = visit.branch_name || 'Unknown';
        el.visitDate.textContent = visit.visit_date || '';
        el.visitNotes.textContent = visit.visit_notes || 'No notes provided.';
        
        el.sidebarDentistName.textContent = visit.dentist_name || '-';
        el.sidebarBranchName.textContent = visit.branch_name || '-';

        let total = 0;

        (visit.procedures || []).forEach(p => {
            const cost = parseFloat(p.procedure_cost || 0);
            total += cost;
            
            const detailDiv = document.createElement('div');
            detailDiv.className = 'OperationDetails';
            detailDiv.innerHTML = `
                <div class="OperationColData">
                    <h1 class="OperationColDataText">${p.procedure_name}</h1>
                </div>
                <div class="OperationColData">
                    <h1 class="OperationColDataTextBill">₱ ${cost.toFixed(2)}</h1>
                </div>
            `;
            el.operationsContainer.appendChild(detailDiv);
        });

        const totalDiv = document.createElement('div');
        totalDiv.className = 'OperationDetails';
        totalDiv.style.borderTop = '1px solid var(--Text-Gray)';
        totalDiv.style.paddingTop = '1rem';
        totalDiv.innerHTML = `
            <div class="OperationColData">
                <h1 class="OperationColDataText" style="font-weight: 700;">Total</h1>
            </div>
            <div class="OperationColData">
                <h1 class="OperationColDataTextBill" style="font-weight: 700;">₱ ${total.toFixed(2)}</h1>
            </div>
        `;
        el.operationsContainer.appendChild(totalDiv);
    }
};