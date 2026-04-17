
// This Is Only  Boilerplate Script, Copy & Paste This To A New JS File And Go From There.

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

/**
 * 1. BACKEND CONFIGURATION
 * Set your Spring Boot API base URL and default headers here.
 */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
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
    elements: {
        body: document.querySelector('body'),
        // Example: submitBtn: document.querySelector('#submit-btn')
    },

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        this.cacheElements(); 
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */

    cacheElements() {
    this.elements = {
        body: document.querySelector('body'),
        personalDetailsBtn: document.querySelector('#Personal-DetailsBtn'),
        habitsandhealthBtn: document.querySelector('#Habits-And-Health-BTN'),
        relatedDetailsBtn: document.querySelector('#Related-Details-BTN'),
        medicalconditionsBtn: document.querySelector('#Medical-Conditions-BTN'),
        allergiesBtn: document.querySelector('#Allergies-BTN'),
        consentformsBtn: document.querySelector('#Consent-Forms-BTN'),
    };
},

    setupEventListeners() {
        this.elements.personalDetailsBtn?.addEventListener('click', () => this.handleNavigation('personaldetails'));
        this.elements.habitsandhealthBtn?.addEventListener('click', () => this.handleNavigation('healthandhabits'));
        this.elements.relatedDetailsBtn?.addEventListener('click', () => this.handleNavigation('relatedinfo'));
        this.elements.medicalconditionsBtn?.addEventListener('click', () => this.handleNavigation('conditions'));
        this.elements.allergiesBtn?.addEventListener('click', () => this.handleNavigation('allergies'));
        this.elements.consentformsBtn?.addEventListener('click', () => this.handleNavigation('medical-profile'));
    },

    handleNavigation(destination) {
        const patientId = new URLSearchParams(window.location.search).get('patientId');
        if (!patientId) return;

        // Routing through FrontendController
        const route = `/${destination}?patientId=${patientId}`;
        window.location.href = route;
    },
    /**
     * 5. UI HELPERS
     * Reusable functions for interface states (loading spinners, orientation, etc.)
     */
    ui: {
        // Use this to disable buttons during API calls
        setLoading(element, isLoading) {
            if (isLoading) {
                element.classList.add('is-loading');
                element.disabled = true;
            } else {
                element.classList.remove('is-loading');
                element.disabled = false;
            }
        },

        // Keeps tablet users in Landscape mode
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
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            
            const response = await fetch(url, settings);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return response.status === 204 ? null : response.json();
        },
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    }
};
