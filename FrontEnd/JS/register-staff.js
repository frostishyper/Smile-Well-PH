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
        form: document.getElementById('Register-Staff-Form'),
        firstName: document.getElementById('First-Name'),
        middleName: document.getElementById('Middle-Name'),
        lastName: document.getElementById('Last-Name'),
        phoneNumber: document.getElementById('Phone-Number'),
        emailAddress: document.getElementById('Email-Address'),
        birthdate: document.getElementById('Birthdate'),
        birthdateField: document.getElementById('Birthdate-Field'),
        birthdateDisplay: document.getElementById('Birthdate-Display'),
        dropdowns: document.querySelectorAll('.register-staff-dropdown'),
        dropdownOptions: document.querySelectorAll('.register-staff-dropdown-option'),
        sex: document.getElementById('Sex'),
        sexDropdown: document.querySelector('[data-dropdown="sex"]'),
        sexToggle: document.getElementById('Sex-Toggle'),
        sexDisplay: document.getElementById('Sex-Display'),
        role: document.getElementById('Role'),
        roleDropdown: document.querySelector('[data-dropdown="role"]'),
        roleToggle: document.getElementById('Role-Toggle'),
        roleDisplay: document.getElementById('Role-Display'),
        displayName: document.getElementById('Display-Name'),
        password: document.getElementById('Password'),
        confirmPassword: document.getElementById('Confirm-Password'),
        homeAddress: document.getElementById('Home-Address'),
        modalBackdrop: document.getElementById('Register-Staff-Modal-Backdrop'),
        modalConfirm: document.getElementById('Register-Staff-Modal-Confirm-BTN'),
        modalCancel: document.getElementById('Register-Staff-Modal-Cancel-BTN'),
    },

    /**
     * 3. INITIALIZATION
     * This runs immediately when the page loads.
     */
    init() {
        console.log('Register Staff Page Initialized');
        this.setupEventListeners();
        this.syncBirthdateDisplay();
        this.syncSelectDisplay(this.elements.sex, this.elements.sexDisplay, this.elements.sexDropdown);
        this.syncSelectDisplay(this.elements.role, this.elements.roleDisplay, this.elements.roleDropdown);
        this.ui.checkOrientation();
    },

    /**
     * 4. EVENT LISTENERS
     * Define all clicks, submits, and input changes for this specific page here.
     */
    setupEventListeners() {
        const el = this.elements;

        el.form?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleRegister();
        });

        el.sex?.addEventListener('change', () => {
            this.syncSelectDisplay(el.sex, el.sexDisplay, el.sexDropdown);
        });

        el.role?.addEventListener('change', () => {
            this.syncSelectDisplay(el.role, el.roleDisplay, el.roleDropdown);
        });

        el.birthdate?.addEventListener('change', () => {
            this.syncBirthdateDisplay();
        });

        el.birthdateField?.addEventListener('click', () => {
            this.openBirthdatePicker();
        });

        el.birthdateField?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openBirthdatePicker();
            }
        });

        el.phoneNumber?.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(/\D/g, '').slice(0, 11);
        });

        el.password?.addEventListener('input', () => {
            this.validatePasswords();
        });

        el.confirmPassword?.addEventListener('input', () => {
            this.validatePasswords();
        });

        el.sexToggle?.addEventListener('click', () => {
            this.toggleDropdown(el.sexDropdown);
        });

        el.roleToggle?.addEventListener('click', () => {
            this.toggleDropdown(el.roleDropdown);
        });

        el.dropdownOptions.forEach((option) => {
            option.addEventListener('click', () => {
                this.selectDropdownOption(option.dataset.target, option.dataset.value, option.textContent.trim());
            });
        });

        el.modalCancel?.addEventListener('click', () => {
            this.closeModal();
        });

        el.modalConfirm?.addEventListener('click', () => {
            this.confirmRegister();
        });

        el.modalBackdrop?.addEventListener('click', (event) => {
            if (event.target === el.modalBackdrop) {
                this.closeModal();
            }
        });

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(el.dropdowns).some((dropdown) =>
                dropdown.contains(event.target)
            );

            if (!clickedInsideDropdown) {
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllDropdowns();
                this.closeModal();
            }
        });
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
    },

    // ─── Page-Specific Methods ───────────────────────────────────────────────

    formatDateDisplay(value) {
        if (!value) return 'MM / DD / YYYY';
        const [year, month, day] = value.split('-');
        return `${month} / ${day} / ${year}`;
    },

    toTitleCase(value) {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },

    syncSelectDisplay(selectElement, displayElement, dropdownElement) {
        if (!selectElement || !displayElement || !dropdownElement) return;

        const isPlaceholder = !selectElement.value;
        const selectedText = isPlaceholder
            ? 'Select'
            : selectElement.options[selectElement.selectedIndex]?.text || 'Select';

        displayElement.textContent = isPlaceholder ? 'Select' : this.toTitleCase(selectedText);
        displayElement.classList.toggle('is-placeholder', isPlaceholder);

        dropdownElement.querySelectorAll('.register-staff-dropdown-option').forEach((option) => {
            option.classList.toggle('is-selected', option.dataset.value === selectElement.value);
        });
    },

    toggleDropdown(dropdownElement) {
        if (!dropdownElement) return;

        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllDropdowns();

        if (!isOpen) {
            this.openDropdown(dropdownElement);
        }
    },

    openDropdown(dropdownElement) {
        const toggle = dropdownElement.querySelector('.register-staff-dropdown-toggle');
        const menu = dropdownElement.querySelector('.register-staff-dropdown-menu');

        if (!toggle || !menu) return;

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.register-staff-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.register-staff-dropdown-menu');

        if (!dropdownElement || !toggle || !menu) return;

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => {
            this.closeDropdown(dropdown);
        });
    },

    selectDropdownOption(target, value, label) {
        const selectElement = this.elements[target];
        const displayElement = this.elements[`${target}Display`];
        const dropdownElement = this.elements[`${target}Dropdown`];

        if (!selectElement || !displayElement || !dropdownElement || !value) return;

        selectElement.value = value;
        displayElement.textContent = label;
        this.syncSelectDisplay(selectElement, displayElement, dropdownElement);
        this.closeDropdown(dropdownElement);
    },

    syncBirthdateDisplay() {
        const el = this.elements;
        if (!el.birthdateDisplay || !el.birthdate) return;

        const hasValue = Boolean(el.birthdate.value);
        el.birthdateDisplay.textContent = this.formatDateDisplay(el.birthdate.value);
        el.birthdateDisplay.classList.toggle('is-placeholder', !hasValue);
    },

    openBirthdatePicker() {
        const birthdateInput = this.elements.birthdate;
        if (!birthdateInput) return;

        if (birthdateInput.showPicker) {
            birthdateInput.showPicker();
        } else {
            birthdateInput.focus();
            birthdateInput.click();
        }
    },

    validatePasswords() {
        const { password, confirmPassword } = this.elements;

        if (!password || !confirmPassword) return true;
        if (!confirmPassword.value) {
            confirmPassword.setCustomValidity('');
            return true;
        }

        const matches = password.value === confirmPassword.value;
        confirmPassword.setCustomValidity(matches ? '' : 'Passwords do not match.');
        return matches;
    },

    getFormPayload() {
        const el = this.elements;

        return {
            firstName: el.firstName.value.trim(),
            middleName: el.middleName.value.trim(),
            lastName: el.lastName.value.trim(),
            phoneNumber: el.phoneNumber.value.trim(),
            emailAddress: el.emailAddress.value.trim(),
            birthdate: el.birthdate.value,
            sex: el.sex.value,
            role: el.role.value,
            displayName: el.displayName.value.trim(),
            password: el.password.value,
            confirmPassword: el.confirmPassword.value,
            homeAddress: el.homeAddress.value.trim()
        };
    },

    handleRegister() {
        const passwordsValid = this.validatePasswords();

        if (!passwordsValid) {
            this.elements.confirmPassword?.reportValidity();
            return;
        }

        if (!this.elements.form?.reportValidity()) return;

        this.openModal();
    },

    openModal() {
        if (!this.elements.modalBackdrop) return;
        this.elements.modalBackdrop.hidden = false;
    },

    closeModal() {
        if (!this.elements.modalBackdrop) return;
        this.elements.modalBackdrop.hidden = true;
    },

    confirmRegister() {
        const payload = this.getFormPayload();
        console.log('Mock register staff payload:', payload);

        // TODO: Replace with actual backend registration call, e.g.:
        // await App.api.post('/staff/register', payload);
        this.closeModal();
        window.alert('Registration confirmed. Backend integration goes here next.');
    }
};