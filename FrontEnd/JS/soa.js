document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const App = {
    state: {
        statement: null
    },

    elements: {
        body: document.querySelector('body'),
        topBarText:      document.querySelector('.TopBar-Nav-Text span'),
        staffName:       document.querySelector('#Staff-Name'),
        staffRole:       document.querySelector('#Staff-Role'),
        patientName:     document.querySelector('.patient-name'),
        balanceValue:    document.querySelector('.summary-col-item.value.highlight'),
        statementDate:   document.querySelector('#SOA-Statement-Date'),
        lastUpdated:     document.querySelector('#SOA-Last-Updated'),
        transactionList: document.querySelector('.transaction-list-container'),
        emptyState:      document.querySelector('#SOA-Empty-State'),
        makePaymentBtn:  document.querySelector('#makePaymentBtn'),
        saveBtn:         document.querySelector('#SOA-Save-BTN'),
        resetBtn:        document.querySelector('#SOA-Reset-BTN'),
        paymentModal:    document.querySelector('#paymentModal'),
        paymentAmount:   document.querySelector('#paymentAmount'),
        paymentDesc:     document.querySelector('#paymentDesc'),
        cancelBtn:       document.querySelector('#cancelBtn'),
        payBtn:          document.querySelector('#payBtn'),
        historyBtn:      document.querySelector('#historyBtn')
    },

    init() {
        console.log('Statement of Account Initialized');
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadStatement();
    },

    setupEventListeners() {
        this.elements.makePaymentBtn?.addEventListener('click',  () => this.openPaymentModal());
        this.elements.cancelBtn?.addEventListener('click',       () => this.closePaymentModal());
        this.elements.payBtn?.addEventListener('click',          () => this.handlePayment());
        this.elements.saveBtn?.addEventListener('click',         () => this.handleSave());
        this.elements.resetBtn?.addEventListener('click',        () => this.loadStatement());
        
        this.elements.historyBtn?.addEventListener('click', () => {
            const patientId = this.getPatientId();
            if (patientId) {
                window.location.href = `/transactionhistory?patientId=${patientId}`;
            }
        });

        window.addEventListener('resize', () => this.ui.checkOrientation());
    },

    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    async loadStatement() {
        const patientId = this.getPatientId();
        if (!patientId) {
            console.warn('No patientId in URL. Cannot load statement.');
            return;
        }

        try {
            const statement = await this.getOrCreateStatement(patientId);
            this.state.statement = statement;

            this.populateStatement(statement);
            
            // Fetches only UNPAID procedures for the SOA view
            const items = await this.api.get(`/statements/${patientId}/items`);
            this.renderTable(items);

        } catch (error) {
            console.error('Failed to load statement:', error.message);
        }
    },

    renderTable(items) {
        const container = this.elements.transactionList;
        if (!container) return;

        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = items.length === 0 ? 'block' : 'none';
        }

        container.innerHTML = items.map(item => `
            <div class="col-label-container record-row" data-item-id="${item.item_id}">
                <div class="record-col trans-id">${item.item_id}</div>
                <div class="record-col item-name">${item.description}</div>
                <div class="record-col amount">${this.ui.formatCurrency(item.amount)}</div>
                <div class="record-col date">${item.created_at}</div>
            </div>
        `).join('');
    },

    async getOrCreateStatement(patientId) {
        try {
            return await this.api.get(`/statements/${patientId}`);
        } catch (error) {
            if (error.status !== 404) throw error;
            await this.api.post('/statements', {
                patientId: Number(patientId),
                currentBalance: 0
            });
            return await this.api.get(`/statements/${patientId}`);
        }
    },

    populateStatement(statement) {
        const patientName = statement.patient_name    ?? 'Patient';
        const balance     = statement.current_balance ?? 0;

        if (this.elements.topBarText) {
            this.elements.topBarText.innerHTML = `Records > ${patientName} > <b>SOA</b>`;
        }
        if (this.elements.patientName)   this.elements.patientName.textContent   = patientName;
        if (this.elements.balanceValue)  this.elements.balanceValue.textContent  = this.ui.formatCurrency(balance);
        if (this.elements.statementDate) this.elements.statementDate.textContent = statement.created_at ?? '-';
        if (this.elements.lastUpdated)   this.elements.lastUpdated.textContent   = statement.updated_at ?? '-';
    },

    openPaymentModal() {
        if (!this.elements.paymentModal) return;
        this.elements.paymentModal.style.display = 'flex';
    },

    closePaymentModal() {
        if (!this.elements.paymentModal) return;
        this.elements.paymentModal.style.display = 'none';
        if (this.elements.paymentAmount) this.elements.paymentAmount.value = '';
        if (this.elements.paymentDesc)   this.elements.paymentDesc.value   = '';
    },

    async handlePayment() {
        const patientId = this.getPatientId();
        if (!patientId) return;

        const paymentAmount = Number(this.elements.paymentAmount?.value || 0);
        const paymentNote = this.elements.paymentDesc?.value || "Patient Payment";

        if (paymentAmount <= 0) return alert('Enter a valid amount');

        this.ui.setLoading(this.elements.payBtn, true);

        try {
            await this.api.put(`/statements/${patientId}`, {
                currentBalance: paymentAmount,
                description: paymentNote 
            });

            this.closePaymentModal();
            await this.loadStatement(); 
        } catch (error) {
            alert("Error processing payment: " + error.message);
        } finally {
            this.ui.setLoading(this.elements.payBtn, false);
        }
    },

    async handleSave() {
        const patientId = this.getPatientId();
        const saveBtn   = this.elements.saveBtn;
        if (!patientId) return;

        const rawBalance = this.elements.balanceValue?.textContent.replace(/[^0-9.]/g, '') ?? '0';
        this.ui.setLoading(saveBtn, true);
        try {
            await this.api.put(`/statements/${patientId}`, {
                currentBalance: parseFloat(rawBalance)
            });
        } catch (error) {
            console.error('Failed to save statement:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    ui: {
        setLoading(element, isLoading) {
            if (!element) return;
            isLoading ? (element.classList.add('is-loading'), element.disabled = true) : (element.classList.remove('is-loading'), element.disabled = false);
        },
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) console.warn('System optimized for Landscape view.');
        },
        formatCurrency(value) {
            const amount = Number(value ?? 0);
            return '₱ ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        formatType(type) {
            return type ? type.charAt(0).toUpperCase() + type.slice(1) : '-';
        }
    },

    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            try {
                const response = await fetch(url, settings);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const error = new Error(errorData.error || errorData.message || `Status: ${response.status}`);
                    error.status = response.status;
                    throw error;
                }
                return response.status === 204 ? null : await response.json();
            } catch (error) {
                console.error('Fetch Error:', error.message);
                throw error;
            }
        },
        get(endpoint)         { return this.request(endpoint, { method: 'GET' }); },
        post(endpoint, data)  { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
        put(endpoint, data)   { return this.request(endpoint, { method: 'PUT',  body: JSON.stringify(data) }); },
        delete(endpoint)      { return this.request(endpoint, { method: 'DELETE' }); }
    }
};