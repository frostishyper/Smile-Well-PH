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

const CONDITION_CONFIG = [
    {
        category: 'Cardiovascular & Blood Conditions',
        checkboxId: 'conditionCardiovascularCheckbox',
        notesId: 'conditionCardiovascularNotes'
    },
    {
        category: 'Respiratory & Lung Health',
        checkboxId: 'conditionRespiratoryCheckbox',
        notesId: 'conditionRespiratoryNotes'
    },
    {
        category: 'Neurological & Mental Health',
        checkboxId: 'conditionNeurologicalCheckbox',
        notesId: 'conditionNeurologicalNotes'
    },
    {
        category: 'Metabolic & Endocrine Systems',
        checkboxId: 'conditionMetabolicCheckbox',
        notesId: 'conditionMetabolicNotes'
    },
    {
        category: 'Gastrointestinal & Hepatic (Liver) Health',
        checkboxId: 'conditionGastroCheckbox',
        notesId: 'conditionGastroNotes'
    },
    {
        category: 'Infectious Diseases & Immune System',
        checkboxId: 'conditionInfectiousCheckbox',
        notesId: 'conditionInfectiousNotes'
    },
    {
        category: 'Musculoskeletal & Surgical',
        checkboxId: 'conditionMusculoskeletalCheckbox',
        notesId: 'conditionMusculoskeletalNotes'
    },
    {
        category: 'Oncology & Specialized Treatments',
        checkboxId: 'conditionOncologyCheckbox',
        notesId: 'conditionOncologyNotes'
    },
    {
        category: 'Miscellaneous',
        checkboxId: 'conditionMiscellaneousCheckbox',
        notesId: 'conditionMiscellaneousNotes'
    }
];

const App = {
    /**
     * 2. ELEMENT CACHE
     */
    elements: {},

    originalConditionsData: null,

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('SmileWell Page Logic Initialized');
        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadConditions();
    },

    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),
            topBarPatientName: document.querySelector('.TopBar-Nav-Text span'),
            revertBtn: document.querySelector('#editConditionsBtn'),
            saveBtn: document.querySelector('#saveConditionsBtn') || document.querySelector('#saveAllergensBtn'),
            conditionRows: CONDITION_CONFIG.map((item) => ({
                category: item.category,
                checkbox: document.querySelector(`#${item.checkboxId}`),
                notes: document.querySelector(`#${item.notesId}`)
            }))
        };
    },

    /**
     * 4. EVENT LISTENERS
     */
    setupEventListeners() {
        this.elements.revertBtn?.addEventListener('click', () => this.handleRevert());
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
    },

    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    async loadConditions() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            return;
        }

        try {
            const response = await this.api.get(`/patient-medical-info/${patientId}/conditions`);
            this.originalConditionsData = response;
            this.populateConditions(response);
        } catch (error) {
            console.error('Failed to load conditions:', error.message);
        }
    },

    populateConditions(response) {
        const patientFirstName = response.patient_first_name || '';
        const patientLastName = response.patient_last_name || '';
        const breadcrumbName = `${patientLastName} ${patientFirstName}`.trim() || 'Unknown Patient';

        if (this.elements.topBarPatientName) {
            this.elements.topBarPatientName.textContent = `Records > ${breadcrumbName} > Full Profile > Conditions`;
        }

        const conditions = Array.isArray(response.conditions) ? response.conditions : [];
        const conditionMap = new Map(
            conditions.map((item) => [item.condition_category, item])
        );

        this.elements.conditionRows.forEach((row) => {
            const condition = conditionMap.get(row.category);

            if (row.checkbox) {
                row.checkbox.checked = this.toBoolean(condition?.has_condition);
            }

            if (row.notes) {
                row.notes.value = condition?.condition_notes || '';
            }
        });
    },

    handleRevert() {
        if (!this.originalConditionsData) {
            console.warn('No original conditions data available to revert.');
            return;
        }

        this.populateConditions(this.originalConditionsData);
        console.log('Form reverted to original conditions data.');
    },

    async handleSave() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('Cannot save without patientId.');
            return;
        }

        const payload = {
            conditions: this.collectFormData()
        };

        const saveBtn = this.elements.saveBtn;

        try {
            this.ui.setLoading(saveBtn, true);

            await this.api.put(`/patient-medical-info/${patientId}/conditions`, payload);

            this.originalConditionsData = {
                ...this.originalConditionsData,
                conditions: payload.conditions
            };

            console.log('Patient conditions saved successfully.');
            this.handleNavigation('full-profile-main-menu');
        } catch (error) {
            console.error('Failed to save conditions:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    collectFormData() {
        return this.elements.conditionRows.map((row) => ({
            condition_category: row.category,
            has_condition: row.checkbox?.checked ? 1 : 0,
            condition_notes: row.notes?.value?.trim() || ''
        }));
    },

    toBoolean(value) {
        return value === true || value === 1 || value === '1';
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