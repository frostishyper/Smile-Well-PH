    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });

    /**
     * 1. BACKEND CONFIGURATION
     */
    const API_CONFIG = {
        BASE_URL: '/api/v1',
        HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const App = {

        state: {
            allItems:    [],
            currentPage: 1,
            itemsPerPage: 10
        },

        /**
         * 2. ELEMENT CACHE
         */
        elements: {
            body:            document.querySelector('body'),
            topBarText:      document.querySelector('#TopBar-Nav-Text'),
            patientName:     document.querySelector('#patient-name'),
            transactionList: document.querySelector('#transaction-list-container'),
            emptyState:      document.querySelector('#SOA-Empty-State'),
            currentPage:     document.querySelector('#CurrentPage'),
            prevBtn:         document.querySelector('#PrevBTN'),
            nextBtn:         document.querySelector('#NextBTN'),
            soaBtn:          document.querySelector('#soaBtn')
        },

        /**
         * 3. INITIALIZATION
         */
        init() {
            console.log('Transaction History Initialized');
            this.setupEventListeners();
            this.ui.checkOrientation();
            this.loadHistory();
        },

        /**
         * 4. EVENT LISTENERS
         */
        setupEventListeners() {
            this.elements.prevBtn?.addEventListener('click', () => this.changePage(-1));
            this.elements.nextBtn?.addEventListener('click', () => this.changePage(1));

            this.elements.soaBtn?.addEventListener('click', () => {
                const patientId = this.getPatientId();
                if (patientId) {
                    window.location.href = `/soa?patientId=${patientId}`;
                }
            });

            window.addEventListener('resize', () => this.ui.checkOrientation());
        },

        getPatientId() {
            return new URLSearchParams(window.location.search).get('patientId');
        },

        /**
         * 5. DATA LOADING
         */
        async loadHistory() {
            const patientId = this.getPatientId();
            if (!patientId) {
                console.warn('No patientId in URL. Cannot load history.');
                return;
            }

            try {
                const items = await this.api.get(`/statements/${patientId}/history`);
                this.state.allItems    = items;
                this.state.currentPage = 1;

                // Populate patient name from first record's context via the statement endpoint
                const statement = await this.api.get(`/statements/${patientId}`);
                this.populatePatientInfo(statement);

                this.renderTable();
            } catch (error) {
                console.error('Failed to load transaction history:', error.message);
            }
        },

        populatePatientInfo(statement) {
            const patientName = statement.patient_name ?? 'Patient';

            if (this.elements.topBarText) {
                this.elements.topBarText.innerHTML = `Records > ${patientName} > <b>Transaction History</b>`;
            }
            if (this.elements.patientName) {
                this.elements.patientName.textContent = patientName;
            }
        },

        /**
         * 6. RENDER TABLE (paginated)
         */
        renderTable() {
            const { allItems, currentPage, itemsPerPage } = this.state;
            const container = this.elements.transactionList;
            if (!container) return;

            const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
            const safePage   = Math.min(currentPage, totalPages);
            this.state.currentPage = safePage;

            const start     = (safePage - 1) * itemsPerPage;
            const pageItems = allItems.slice(start, start + itemsPerPage);

            // Empty state
            if (this.elements.emptyState) {
                this.elements.emptyState.style.display = allItems.length === 0 ? 'block' : 'none';
            }

            container.innerHTML = pageItems.map(item => {
    const isPayment   = item.type === 'payment';
    const isPaid      = isPayment || item.is_paid === true || item.is_paid === 1;

    const statusClass = isPaid ? 'status-paid' : 'status-unpaid';
    const statusLabel = isPaid ? 'Paid' : 'Unpaid';

    const amountClass = isPayment ? 'amount payment-amount' : 'amount';
    const rowClass    = isPayment ? 'record-row payment-row' : 'record-row';

    return `
        <div class="col-label-container ${rowClass}" data-item-id="${item.item_id}">
            <div class="record-col trans-id">${item.item_id}</div>
            <div class="record-col item-name">
                ${isPayment ? '<span class="payment-tag">PAYMENT</span>' : ''}
                ${item.description}
            </div>
            <div class="record-col ${amountClass}">${this.ui.formatCurrency(item.amount)}</div>
            <div class="record-col status">
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="record-col date">${item.created_at}</div>
        </div>
    `;
}).join('');

            // Update pagination label
            if (this.elements.currentPage) {
                this.elements.currentPage.textContent = `${safePage}/${totalPages}`;
            }

            // Disable/enable pagination buttons
            if (this.elements.prevBtn) this.elements.prevBtn.style.opacity = safePage <= 1           ? '0.3' : '1';
            if (this.elements.nextBtn) this.elements.nextBtn.style.opacity = safePage >= totalPages  ? '0.3' : '1';
        },

        changePage(direction) {
            const totalPages = Math.max(1, Math.ceil(this.state.allItems.length / this.state.itemsPerPage));
            const next       = this.state.currentPage + direction;
            if (next < 1 || next > totalPages) return;
            this.state.currentPage = next;
            this.renderTable();
        },

        /**
         * 7. UI HELPERS
         */
        ui: {
            setLoading(element, isLoading) {
                if (!element) return;
                isLoading
                    ? (element.classList.add('is-loading'),    element.disabled = true)
                    : (element.classList.remove('is-loading'), element.disabled = false);
            },
            checkOrientation() {
                if (window.innerHeight > window.innerWidth) console.warn('System optimized for Landscape view.');
            },
            formatCurrency(value) {
                const amount = Number(value ?? 0);
                return '₱ ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        },

        /**
         * 8. API LAYER (REST)
         */
        api: {
            async request(endpoint, options = {}) {
                const url      = `${API_CONFIG.BASE_URL}${endpoint}`;
                const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
                try {
                    const response = await fetch(url, settings);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const error     = new Error(errorData.error || errorData.message || `Status: ${response.status}`);
                        error.status    = response.status;
                        throw error;
                    }
                    return response.status === 204 ? null : await response.json();
                } catch (error) {
                    console.error('Fetch Error:', error.message);
                    throw error;
                }
            },
            get(endpoint)        { return this.request(endpoint, { method: 'GET' }); },
            post(endpoint, data) { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(data) }); },
            put(endpoint, data)  { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }); },
            delete(endpoint)     { return this.request(endpoint, { method: 'DELETE' }); }
        }
        
    };

    