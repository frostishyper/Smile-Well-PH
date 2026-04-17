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

    originalRelatedData: null,

    /**
     * 3. INITIALIZATION
     */
    init() {
        console.log('SmileWell Page Logic Initialized');
        this.cacheElements();
        this.initDropdowns();
        this.setupEventListeners();
        this.ui.checkOrientation();
        this.loadRelatedInfo();
    },

    cacheElements() {
        this.elements = {
            body: document.querySelector('body'),
            topBarPatientName: document.querySelector('.TopBar-Nav-Text span'),

            kinFirstname: document.querySelector('#kinFirstname'),
            kinMiddlename: document.querySelector('#kinMiddlename'),
            kinLastname: document.querySelector('#kinLastname'),
            kinContact: document.querySelector('#kinContact'),
            kinEmail: document.querySelector('#kinEmail'),
            kinBirthdate: document.querySelector('#kinBirthdate'),
            kinSex: document.querySelector('#Kin-Sex-Dropdown'),
            kinRelation: document.querySelector('#kinRelation'),
            kinAddress: document.querySelector('#kinAddress'),
            patientReference: document.querySelector('#patientReference'),
            insuranceProvider: document.querySelector('#insuranceProvider'),

            saveBtn: document.querySelector('#saveRelatedBtn'),
            revertBtn: document.querySelector('#editRelatedBtn'),

            // Cache all custom dropdowns
            customDropdowns: document.querySelectorAll('.Custom-Dropdown')
        };
    },

   /**
     * CUSTOM DROPDOWN LOGIC
     * Updated to scan the DOM dynamically
     */
    initDropdowns() {
        // Scan for dropdowns at the moment the function runs
        const dropdowns = document.querySelectorAll('.Custom-Dropdown');
        
        console.log(`Dropdown Scan: Found ${dropdowns.length} elements`);

        if (dropdowns.length === 0) {
            console.warn("No dropdowns found! Are they rendered yet?");
            return;
        }

        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.Dropdown-Trigger');
            const label = dropdown.querySelector('.Dropdown-Label');
            const items = dropdown.querySelectorAll('.Dropdown-Item');

            if (!trigger) return; // Safety check

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close others
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('is-open');
                });

                dropdown.classList.toggle('is-open');
                console.log('Dropdown toggled:', dropdown.id, dropdown.classList.contains('is-open'));
            });

            items.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent trigger from firing
                    const selectedText = item.textContent.trim();
                    const selectedValue = item.getAttribute('data-value') || item.textContent.trim();
                    
                    label.textContent = selectedText;
                    label.style.color = '#000000'; 
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
     */
    setupEventListeners() {
        this.elements.saveBtn?.addEventListener('click', () => this.handleSave());
        this.elements.revertBtn?.addEventListener('click', () => this.handleRevert());
    },

    getPatientId() {
        return new URLSearchParams(window.location.search).get('patientId');
    },

    async loadRelatedInfo() {
        const patientId = this.getPatientId();

        if (!patientId) {
            console.warn('No patientId in URL.');
            return;
        }

        try {
            const relation = await this.api.get(`/patient-relations/${patientId}`);
            this.originalRelatedData = relation;
            this.populateRelatedInfo(relation);
        } catch (error) {
            console.error('Failed to load related info:', error.message);
        }
    },

    populateRelatedInfo(relation) {
        const e = this.elements;
        const breadcrumbName = `${relation.patient_last_name || ''} ${relation.patient_first_name || ''}`.trim() || 'Unknown Patient';

        if (e.topBarPatientName) {
            e.topBarPatientName.textContent = `Records > ${breadcrumbName} > Full Profile > Related Info`;
        }

        if (e.kinFirstname) e.kinFirstname.value = relation.first_name || '';
        if (e.kinMiddlename) e.kinMiddlename.value = relation.middle_name || '';
        if (e.kinLastname) e.kinLastname.value = relation.last_name || '';
        if (e.kinContact) e.kinContact.value = relation.contact_number || '';
        if (e.kinEmail) e.kinEmail.value = relation.email || '';
        if (e.kinBirthdate) e.kinBirthdate.value = relation.birthday || '';
        if (e.kinRelation) e.kinRelation.value = relation.relationship_type || '';
        if (e.kinAddress) e.kinAddress.value = relation.home_address || '';
        if (e.patientReference) e.patientReference.value = relation.reference_source || '';
        if (e.insuranceProvider) e.insuranceProvider.value = relation.insurance_provider || '';

        this.setDropdownValue(e.kinSex, relation.sex, this.formatSex(relation.sex));
    },

    handleRevert() {
        if (!this.originalRelatedData) {
            console.warn('No original related data available to revert.');
            return;
        }

        this.populateRelatedInfo(this.originalRelatedData);
        console.log('Form reverted to original related data.');
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

            await this.api.put(`/patient-relations/${patientId}`, payload);

            this.originalRelatedData = {
                ...this.originalRelatedData,
                ...payload,
                patient_id: patientId
            };

            console.log('Patient related info saved successfully.');
            this.handleNavigation('full-profile-main-menu');
        } catch (error) {
            console.error('Failed to save related info:', error.message);
        } finally {
            this.ui.setLoading(saveBtn, false);
        }
    },

    collectFormData() {
        return {
            first_name: this.elements.kinFirstname?.value?.trim() || '',
            middle_name: this.elements.kinMiddlename?.value?.trim() || '',
            last_name: this.elements.kinLastname?.value?.trim() || '',
            contact_number: this.elements.kinContact?.value?.trim() || '',
            email: this.elements.kinEmail?.value?.trim() || '',
            birthday: this.elements.kinBirthdate?.value || '',
            sex: this.normalizeSexValue(this.getDropdownValue(this.elements.kinSex)),
            relationship_type: this.elements.kinRelation?.value?.trim() || '',
            home_address: this.elements.kinAddress?.value?.trim() || '',
            reference_source: this.elements.patientReference?.value?.trim() || '',
            insurance_provider: this.elements.insuranceProvider?.value?.trim() || ''
        };
    },

    getDropdownValue(dropdown) {
        if (!dropdown) return '';
        return dropdown.dataset.selectedValue || '';
    },

    setDropdownValue(dropdown, value, displayText = null) {
        if (!dropdown) return;

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

    formatSex(sex) {
        if (sex === 'M') return 'Male';
        if (sex === 'F') return 'Female';
        return sex || 'Other';
    },

    normalizeSexValue(value) {
        if (!value) return '';

        const clean = String(value).trim().toUpperCase();

        if (clean === 'MALE' || clean === 'M') return 'M';
        if (clean === 'FEMALE' || clean === 'F') return 'F';
        return value;
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