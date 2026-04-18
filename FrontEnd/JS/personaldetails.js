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

    // Keeps a clean copy of the loaded patient data for Revert
    originalPatientData: null,

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('SmileWell Personal Details Page Initialized');

        this.cacheElements();
        this.initDropdowns();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadPatientData();
    },

    /**
     * Cache all DOM elements for this page here.
     * Fallback selectors are used so this file is more forgiving
     * while the page IDs are still being finalized.
     */
    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),

            // Header / patient context
            topBarPatientName: document.querySelector('.TopBar-Nav-Text span'),
            pagePatientName:
                this.getElement([
                    '#PD-Patient-Name',
                    '#PersonalDetails-Patient-Name',
                    '#Patient-Name'
                ]),

            // Form fields
            firstName:
                this.getElement([
                    '#firstnamefield'
                ]),

            middleName:
                this.getElement([
                    '#middlenamefield'
                ]),

            lastName:
                this.getElement([
                    '#lastnamefield'
                ]),

            contactNumber:
                this.getElement([
                    '#contactNumber',
                    'input[name="contactNumber"]'
                ]),

            email:
                this.getElement([
                    '#emailAddress',
                    'input[name="emailAddress"]'
                ]),

            birthday:
                this.getElement([
                    '#kinBirthdate'
                ]),

            sex:
                this.getElement([
                    '#Sex-Dropdown'
                ]),

            bloodType:
                this.getElement([
                    '#Bloodtype-Dropdown'
                ]),

            validIdNumber:
                this.getElement([
                    '#validId'
                ]),

            homeAddress:
                this.getElement([
                    '#homeAddress',
                    'input[name="homeAddress"]'
                ]),

            occupation:
                this.getElement([
                    '#occupation',
                    'input[name="occupation"]'
                ]),

            religion:
                this.getElement([
                    '#religion',
                    'input[name="religion"]'
                ]),

            // Action buttons
            saveBtn:
                this.getElement([
                    '#saveEditBtnControl'
                ]),

            revertBtn:
                this.getElement([
                    '#editVisitBtnControl'
                ]),

            // Cache all custom dropdowns
            customDropdowns: document.querySelectorAll('.Custom-Dropdown')
        };
    },

    /**
     * Small selector helper so we can try multiple possible IDs
     * without writing a long chain of querySelector calls everywhere.
     */
    getElement(selectors = []) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    },

    /**
     * CUSTOM DROPDOWN LOGIC
     * Updated to scan the DOM dynamically
     */
    initDropdowns() {
        const dropdowns = document.querySelectorAll('.Custom-Dropdown');

        console.log(`Dropdown Scan: Found ${dropdowns.length} elements`);

        if (dropdowns.length === 0) {
            console.warn('No dropdowns found! Are they rendered yet?');
            return;
        }

        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.Dropdown-Trigger');
            const label = dropdown.querySelector('.Dropdown-Label');
            const items = dropdown.querySelectorAll('.Dropdown-Item');

            if (!trigger) return;

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();

                // Close other open dropdowns first
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('is-open');
                });

                dropdown.classList.toggle('is-open');
                console.log('Dropdown toggled:', dropdown.id, dropdown.classList.contains('is-open'));
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const selectedText = item.textContent.trim();
                    const selectedValue = item.getAttribute('data-value') || item.textContent.trim();

                    if (label) {
                        label.textContent = selectedText;
                        label.style.color = '#000000';
                    }

                    dropdown.classList.remove('is-open');
                    dropdown.dataset.selectedValue = selectedValue;

                    console.log(`Selected: ${selectedValue}`);
                });
            });
        });

        document.addEventListener('click', () => {
            dropdowns.forEach(d => d.classList.remove('is-open'));
        });
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
        this.elements.revertBtn?.addEventListener('click', () => this.handleRevert());
    },

    /**
     * Reads the patientId from the current page URL.
     * This keeps the page tied to the patient selected from the previous screen.
     */
    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    /**
     * Load the patient currently being edited.
     * Uses the personal details endpoint.
     */
    async loadPatientData() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            this.showMissingPatientState();
            return;
        }

        try {
            const patient = await this.api.get(`/patients/${patientId}/personal-details`);

            this.originalPatientData = patient;
            this.populatePatient(patient);
        } catch (error) {
            console.error('Failed to load patient details:', error.message);
            this.showErrorState();
        }
    },

    /**
     * Push backend data into the page fields.
     * Some fields may stay blank if the current GET endpoint does not return them yet.
     */
    populatePatient(patient) {
        const e = this.elements;
        const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient';
        const breadcrumbName = `${patient.last_name || ''} ${patient.first_name || ''}`.trim() || 'Unknown Patient';

        // Header / page identity
        if (e.topBarPatientName) {
            e.topBarPatientName.textContent = `Records > ${breadcrumbName} > Full Profile > Personal Details`;
        }
        if (e.pagePatientName) e.pagePatientName.textContent = fullName;

        // Standard text/date inputs
        this.setFieldValue(e.firstName, patient.first_name);
        this.setFieldValue(e.middleName, patient.middle_name);
        this.setFieldValue(e.lastName, patient.last_name);
        this.setFieldValue(e.contactNumber, patient.contact_number);
        this.setFieldValue(e.email, patient.email);
        this.setFieldValue(e.birthday, this.formatDateForInput(patient.birthday));
        this.setFieldValue(e.validIdNumber, patient.valid_id_number);
        this.setFieldValue(e.homeAddress, patient.home_address);
        this.setFieldValue(e.occupation, patient.occupation);
        this.setFieldValue(e.religion, patient.religion);

        // Dropdown / select style inputs
        this.setFieldValue(e.sex, patient.sex, { type: 'dropdown', displayText: this.formatSex(patient.sex) });
        this.setFieldValue(e.bloodType, patient.blood_type, { type: 'dropdown', displayText: patient.blood_type || 'Select' });
    },

    /**
     * Revert restores the last successfully loaded patient data.
     * It does not navigate away from the page.
     */
    handleRevert() {
        if (!this.originalPatientData) {
            console.warn('No original patient data available to revert.');
            return;
        }

        this.populatePatient(this.originalPatientData);
        console.log('Form reverted to original patient data.');
    },

    /**
     * Save collects the current form values and sends them to the backend.
     * Frontend is ready here, but the backend still needs a matching PUT endpoint.
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

            await this.api.put(`/patients/${patientId}`, payload);

            // Update our local "original" copy so Revert now returns to the newly saved state
            this.originalPatientData = {
                ...this.originalPatientData,
                ...payload,
                patient_id: patientId
            };

            console.log('Patient personal details saved successfully.');

            // After successful save, return to the full profile main menu
            this.handleNavigation('full-profile-main-menu');
        } catch (error) {
            console.error('Failed to save patient details:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    /**
     * Gather all current field values into one payload.
     * Snake_case is used here so it maps more naturally to backend/database naming.
     */
    collectFormData() {
        return {
            first_name: this.getFieldValue(this.elements.firstName),
            middle_name: this.getFieldValue(this.elements.middleName),
            last_name: this.getFieldValue(this.elements.lastName),
            contact_number: this.getFieldValue(this.elements.contactNumber),
            email: this.getFieldValue(this.elements.email),
            birthday: this.getFieldValue(this.elements.birthday),
            sex: this.normalizeSexValue(this.getFieldValue(this.elements.sex)),
            blood_type: this.getFieldValue(this.elements.bloodType),
            valid_id_number: this.getFieldValue(this.elements.validIdNumber),
            home_address: this.getFieldValue(this.elements.homeAddress),
            occupation: this.getFieldValue(this.elements.occupation),
            religion: this.getFieldValue(this.elements.religion)
        };
    },

    /**
     * Generic field writer.
     * Handles normal inputs, textareas, selects, and custom dropdowns.
     */
    setFieldValue(element, value, options = {}) {
        if (!element) return;

        const safeValue = value ?? '';

        if (this.isCustomDropdown(element) || options.type === 'dropdown') {
            this.setDropdownValue(element, safeValue, options.displayText);
            return;
        }

        if ('value' in element) {
            element.value = safeValue;
        } else {
            element.textContent = safeValue;
        }
    },

    /**
     * Generic field reader.
     * Handles normal inputs and custom dropdowns.
     */
    getFieldValue(element) {
        if (!element) return '';

        if (this.isCustomDropdown(element)) {
            return element.dataset.selectedValue || '';
        }

        if ('value' in element) {
            return element.value?.trim() || '';
        }

        return element.textContent?.trim() || '';
    },

    /**
     * Custom dropdown detector.
     */
    isCustomDropdown(element) {
        return element?.classList?.contains('Custom-Dropdown');
    },

    /**
     * Programmatically set a custom dropdown's selected value and label.
     */
    setDropdownValue(dropdown, value, displayText = null) {
        if (!dropdown) return;

        // Native select fallback
        if (dropdown.tagName === 'SELECT') {
            dropdown.value = value ?? '';
            return;
        }

        if (!this.isCustomDropdown(dropdown)) {
            if ('value' in dropdown) dropdown.value = value ?? '';
            return;
        }

        const label = dropdown.querySelector('.Dropdown-Label');
        const items = dropdown.querySelectorAll('.Dropdown-Item');

        let matchedItem = null;

        items.forEach(item => {
            const itemValue = item.getAttribute('data-value') || item.textContent.trim();
            if (String(itemValue).toUpperCase() === String(value).toUpperCase()) {
                matchedItem = item;
            }
        });

        dropdown.dataset.selectedValue = value ?? '';

        if (label) {
            if (matchedItem) {
                label.textContent = matchedItem.textContent.trim();
                label.style.color = '#000000';
            } else {
                label.textContent = displayText || value || 'Select';
                if (value) label.style.color = '#000000';
            }
        }
    },

    /**
     * Convert DB/backend sex value into readable page text.
     */
    formatSex(sex) {
        if (sex === 'M') return 'Male';
        if (sex === 'F') return 'Female';
        return sex || 'Other';
    },

    /**
     * Convert user-facing sex selection back into the compact backend value.
     */
    normalizeSexValue(value) {
        if (!value) return '';

        const clean = String(value).trim().toUpperCase();

        if (clean === 'MALE' || clean === 'M') return 'M';
        if (clean === 'FEMALE' || clean === 'F') return 'F';
        return value;
    },

    /**
     * If the API returns YYYY-MM-DD, this works for date inputs.
     */
    formatDateForInput(dateValue) {
        return dateValue || '';
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
     * Fallback state when patientId is missing from the route.
     */
    showMissingPatientState() {
        if (this.elements.topBarPatientName) {
            this.elements.topBarPatientName.textContent = 'No Patient Selected';
        }

        if (this.elements.pagePatientName) {
            this.elements.pagePatientName.textContent = 'No Patient Selected';
        }
    },

    /**
     * Fallback state when the patient load fails.
     */
    showErrorState() {
        if (this.elements.topBarPatientName) {
            this.elements.topBarPatientName.textContent = 'Error Loading Patient';
        }

        if (this.elements.pagePatientName) {
            this.elements.pagePatientName.textContent = 'Error Loading Patient';
        }
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