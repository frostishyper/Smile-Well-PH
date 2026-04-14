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

const App = {
    elements: {
        body: document.querySelector('body'),
        makePaymentBtn: document.querySelector('#makePaymentBtn'),
        paymentModal: document.querySelector('#paymentModal'),
        cancelBtn: document.querySelector('#cancelBtn'),
        payBtn: document.querySelector('#payBtn'),
        paymentAmount: document.querySelector('#paymentAmount'),
        paymentDesc: document.querySelector('#paymentDesc'),
    },

    init() {
        console.log('Page Logic Initialized');
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    setupEventListeners() {
        const { makePaymentBtn, paymentModal, cancelBtn, payBtn } = this.elements;

        

        // Submit payment
        payBtn.addEventListener('click', () => {
            this.handlePayment();
        });
    },

    /**
     * MODAL HELPERS
     * Open and close the payment modal.
     */
    modal: {
        open() {
            document.querySelector('#paymentModal').classList.add('active');
        },
        close() {
            document.querySelector('#paymentModal').classList.remove('active');
            document.querySelector('#paymentAmount').value = '';
            document.querySelector('#paymentDesc').value = '';
        }
    },

    /**
     * PAYMENT HANDLER
     * Reads the modal inputs and calls the API.
     * Replace the endpoint and payload shape to match your Spring Boot controller.
     */
    async handlePayment() {
        const { payBtn, paymentAmount, paymentDesc } = this.elements;

        const amount = paymentAmount.value.trim();
        const description = paymentDesc.value.trim();

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            alert('Please enter a valid payment amount.');
            return;
        }

        this.ui.setLoading(payBtn, true);

        try {
            // TODO: replace '/payments' and payload with your actual endpoint
            await App.api.post('/payments', {
                amount: Number(amount),
                description: description,
            });

            console.log('Payment successful');
            this.modal.close();

        } catch (error) {
            console.error('Payment failed:', error.message);
            alert(`Payment failed: ${error.message}`);
        } finally {
            this.ui.setLoading(payBtn, false);
        }
    },

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