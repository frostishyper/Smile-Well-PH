// This Is Only  Boilerplate Script, Copy & Paste This To A New JS File And Go From There.

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Set your Spring Boot API base URL and default headers here.
 */
const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const App = {
    /**
     * 2. ELEMENT CACHE
     * Store your querySelectors here so you don't hunt the DOM twice.
     */
    elements: {},

    originalAllergiesData: null,

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('SmileWell Allergies Page Initialized');

        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadAllergies();
    },

    /**
     * Cache all DOM elements for this page here.
     */
    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),
            topBarPatientName: document.querySelector('.TopBar-Nav-Text span'),
            editBtn: document.querySelector('#editAllergensBtn'),
            saveBtn: document.querySelector('#saveAllergensBtn'),
            otherAllergensInput: document.querySelector('#otherAllergensInput')
        };
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        this.elements.editBtn?.addEventListener('click', () => this.handleRevert());
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
    },

    /**
     * Reads the patientId from the current page URL.
     */
    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    /**
     * Loads the allergy record for the current patient.
     */
    async loadAllergies() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            return;
        }

        try {
            const allergies = await this.api.get(`/patient-medical-info/${patientId}/allergies`);
            this.originalAllergiesData = allergies;
            this.populateAllergies(allergies);
        } catch (error) {
            console.error('Failed to load allergies:', error.message);
        }
    },

    /**
     * Populates the page using the API response.
     * This also updates the breadcrumb in the top bar.
     */
    populateAllergies(data) {
        const breadcrumbName = `${data.patient_last_name || ''} ${data.patient_first_name || ''}`.trim() || 'Unknown Patient';

        if (this.elements.topBarPatientName) {
            this.elements.topBarPatientName.textContent = `Records > ${breadcrumbName} > Full Profile > Allergies`;
        }

        this.setBooleanRadio('localAnesthetic', data.local_anesthetics);
        this.setBooleanRadio('antibiotics', data.penicillin_antibiotics);
        this.setBooleanRadio('latex', data.latex);
        this.setBooleanRadio('aspirin', data.aspirin);

        /**
         * IMPORTANT:
         * The current table/registration flow uses "sulfa_drugs",
         * but the current UI label is "Food Allergies?".
         * This is mapped directly for now so the page can function
         * until the UI text and DB field are aligned.
         */
        this.setBooleanRadio('foodAllergy', data.sulfa_drugs);

        if (this.elements.otherAllergensInput) {
            this.elements.otherAllergensInput.value = data.others_notes || '';
        }
    },

    /**
     * Helper for selecting yes/no radio groups from boolean/tinyint values.
     */
    setBooleanRadio(groupName, value) {
        const yesRadio = document.querySelector(`input[name="${groupName}"][value="yes"]`);
        const noRadio = document.querySelector(`input[name="${groupName}"][value="no"]`);

        const isYes = value === true || value === 1 || value === '1';

        if (isYes && yesRadio) {
            yesRadio.checked = true;
        } else if (noRadio) {
            noRadio.checked = true;
        }
    },

    /**
     * Reads a yes/no radio group and converts it to 1 or 0.
     */
    getBooleanRadio(groupName) {
        const checked = document.querySelector(`input[name="${groupName}"]:checked`);
        return checked?.value === 'yes' ? 1 : 0;
    },

    /**
     * Restore the last successfully loaded state.
     */
    handleRevert() {
        if (!this.originalAllergiesData) {
            console.warn('No original allergies data available to revert.');
            return;
        }

        this.populateAllergies(this.originalAllergiesData);
        console.log('Form reverted to original allergies data.');
    },

    /**
     * Save the form and return to the full profile menu.
     */
    async handleSave() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('Cannot save without patientId.');
            return;
        }

        const payload = this.collectFormData();
        const saveBtn = this.elements.saveBtn;

        try {
            this.ui.setLoading(saveBtn, true);

            await this.api.put(`/patient-medical-info/${patientId}/allergies`, payload);

            this.originalAllergiesData = {
                ...this.originalAllergiesData,
                ...payload,
                patient_id: patientId
            };

            console.log('Patient allergies saved successfully.');
            this.handleNavigation('full-profile-main-menu');
        } catch (error) {
            console.error('Failed to save allergies:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    /**
     * Collect all page values into one backend payload.
     */
    collectFormData() {
        return {
            local_anesthetics: this.getBooleanRadio('localAnesthetic'),
            penicillin_antibiotics: this.getBooleanRadio('antibiotics'),
            latex: this.getBooleanRadio('latex'),
            aspirin: this.getBooleanRadio('aspirin'),

            /**
             * TEMPORARY MAPPING:
             * UI uses "foodAllergy", DB currently uses "sulfa_drugs".
             */
            sulfa_drugs: this.getBooleanRadio('foodAllergy'),

            others_notes: this.elements.otherAllergensInput?.value?.trim() || ''
        };
    },

    /**
     * Reuse the same patientId-preserving route pattern as other patient pages.
     */
    handleNavigation(destination) {
        const patientId = this.getPatientId();
        if (!patientId) {
            console.warn('Cannot navigate without patientId.');
            return;
        }

        const route = `/${destination}?patientId=${patientId}`;
        window.location.href = route;
    },

    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
     */
    ui: {
        setLoading(element, isLoading) {
            if (!element) return;

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

        put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }
    }
};