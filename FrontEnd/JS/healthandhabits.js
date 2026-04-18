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
    /**
     * 2. ELEMENT CACHE
     */
    elements: {},

    originalHealthHabitsData: null,

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('SmileWell Page Logic Initialized');
        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadHealthHabits();
    },

    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),
            topBarPatientName: document.querySelector('.TopBar-Nav-Text span'),
            editBtn: document.querySelector('#editBtn'),
            saveBtn: document.querySelector('#saveBtn')
        };
    },

    /**
     * 4. EVENT LISTENERS
     */
    setupEventListeners() {
        this.elements.editBtn?.addEventListener('click', () => this.handleRevert());
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
    },

    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    async loadHealthHabits() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            return;
        }

        try {
            const healthHabits = await this.api.get(`/patient-medical-info/${patientId}/health-habits`);
            this.originalHealthHabitsData = healthHabits;
            this.populateHealthHabits(healthHabits);
        } catch (error) {
            console.error('Failed to load health habits:', error.message);
        }
    },

    populateHealthHabits(data) {
        const breadcrumbName = `${data.patient_last_name || ''} ${data.patient_first_name || ''}`.trim() || 'Unknown Patient';

        if (this.elements.topBarPatientName) {
            this.elements.topBarPatientName.textContent = `Records > ${breadcrumbName} > Full Profile > Health & Habits`;
        }

        this.setBooleanRadio('goodHealth', data.in_good_health);
        this.setBooleanRadio('smoke', data.smoker);
        this.setBooleanRadio('alcohol', data.alcohol);
        this.setBooleanRadio('drugs', data.illicit_drugs);
        this.setBooleanRadio('pregnant', data.pregnant);
        this.setBooleanRadio('birthControl', data.birth_control);
        this.setBooleanRadio('nursing', data.nursing);
    },

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

    getBooleanRadio(groupName) {
        const checked = document.querySelector(`input[name="${groupName}"]:checked`);
        return checked?.value === 'yes' ? 1 : 0;
    },

    handleRevert() {
        if (!this.originalHealthHabitsData) {
            console.warn('No original health habits data available to revert.');
            return;
        }

        this.populateHealthHabits(this.originalHealthHabitsData);
        console.log('Form reverted to original health habits data.');
    },

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

            await this.api.put(`/patient-medical-info/${patientId}/health-habits`, payload);

            this.originalHealthHabitsData = {
                ...this.originalHealthHabitsData,
                ...payload,
                patient_id: patientId
            };

            console.log('Patient health habits saved successfully.');
            this.handleNavigation('full-profile-main-menu');
        } catch (error) {
            console.error('Failed to save health habits:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    collectFormData() {
        return {
            in_good_health: this.getBooleanRadio('goodHealth'),
            smoker: this.getBooleanRadio('smoke'),
            alcohol: this.getBooleanRadio('alcohol'),
            illicit_drugs: this.getBooleanRadio('drugs'),
            pregnant: this.getBooleanRadio('pregnant'),
            birth_control: this.getBooleanRadio('birthControl'),
            nursing: this.getBooleanRadio('nursing')
        };
    },

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

        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
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
        delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
    }
};