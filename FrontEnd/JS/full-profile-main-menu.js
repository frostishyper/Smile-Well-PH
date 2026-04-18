// This Is Only  Boilerplate Script, Copy & Paste This To A New JS File And Go From There.

document.addEventListener('DOMContentLoaded', () => App.init());

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

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadPatientData();
    },

    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),

            // Header / patient context
            topBarPatientName: document.querySelector('.TopBar-Nav-Text strong'),
            patientName:
                document.querySelector('#FP-Patient-Name') ||
                document.querySelector('#FPMM-Patient-Name') ||
                document.querySelector('#Patient-Name'),

            patientSex:
                document.querySelector('#FP-Patient-Sex') ||
                document.querySelector('#FPMM-Patient-Sex') ||
                document.querySelector('#Patient-Sex'),

            patientAge:
                document.querySelector('#FP-Patient-Age') ||
                document.querySelector('#FPMM-Patient-Age') ||
                document.querySelector('#Patient-Age'),

            patientIdText:
                document.querySelector('#FP-Patient-Id') ||
                document.querySelector('#FPMM-Patient-Id') ||
                document.querySelector('#Patient-Id'),

            // Menu buttons
            personalDetailsBtn: document.querySelector('#Personal-DetailsBtn'),
            habitsandhealthBtn: document.querySelector('#Habits-And-Health-BTN'),
            relatedDetailsBtn: document.querySelector('#Related-Details-BTN'),
            medicalconditionsBtn: document.querySelector('#Medical-Conditions-BTN'),
            allergiesBtn: document.querySelector('#Allergies-BTN'),
            consentformsBtn: document.querySelector('#Consent-Forms-BTN'),
        };
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        this.elements.personalDetailsBtn?.addEventListener('click', () => this.handleNavigation('personaldetails'));
        this.elements.habitsandhealthBtn?.addEventListener('click', () => this.handleNavigation('healthandhabits'));
        this.elements.relatedDetailsBtn?.addEventListener('click', () => this.handleNavigation('relatedinfo'));
        this.elements.medicalconditionsBtn?.addEventListener('click', () => this.handleNavigation('conditions'));
        this.elements.allergiesBtn?.addEventListener('click', () => this.handleNavigation('allergies'));
        this.elements.consentformsBtn?.addEventListener('click', () => this.handleNavigation('medical-profile'));
    },

    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    async loadPatientData() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            this.showMissingPatientState();
            return;
        }

        try {
            const patient = await this.api.get(`/patients/${patientId}`);
            this.populatePatient(patient);
        } catch (error) {
            console.error('Failed to load patient data:', error.message);
            this.showErrorState();
        }
    },

    populatePatient(patient) {
        const e = this.elements;
        const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient';

        if (e.topBarPatientName) e.topBarPatientName.textContent = fullName;
        if (e.patientName) e.patientName.textContent = fullName;
        if (e.patientSex) e.patientSex.textContent = this.formatSex(patient.sex);
        if (e.patientAge) e.patientAge.textContent = patient.age || '-';
        if (e.patientIdText) e.patientIdText.textContent = patient.patient_id || '-';
    },

    formatSex(sex) {
        if (sex === 'M') return 'Male';
        if (sex === 'F') return 'Female';
        return 'Other';
    },

    showMissingPatientState() {
        const e = this.elements;

        if (e.topBarPatientName) e.topBarPatientName.textContent = 'No Patient Selected';
        if (e.patientName) e.patientName.textContent = 'No Patient Selected';
        if (e.patientSex) e.patientSex.textContent = '-';
        if (e.patientAge) e.patientAge.textContent = '-';
        if (e.patientIdText) e.patientIdText.textContent = '-';
    },

    showErrorState() {
        const e = this.elements;

        if (e.topBarPatientName) e.topBarPatientName.textContent = 'Error Loading Patient';
        if (e.patientName) e.patientName.textContent = 'Error Loading Patient';
        if (e.patientSex) e.patientSex.textContent = '-';
        if (e.patientAge) e.patientAge.textContent = '-';
        if (e.patientIdText) e.patientIdText.textContent = '-';
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
                headers: {
                    ...API_CONFIG.HEADERS,
                    ...options.headers
                }
            };

            const response = await fetch(url, settings);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return response.status === 204 ? null : response.json();
        },

        get(endpoint) {
            return this.request(endpoint, { method: 'GET' });
        }
    }
};