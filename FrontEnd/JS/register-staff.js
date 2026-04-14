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

function formatDateDisplay(value) {
    if (!value) {
        return 'MM / DD / YYYY';
    }

    const [year, month, day] = value.split('-');
    return `${month} / ${day} / ${year}`;
}

function toTitleCase(value) {
    if (!value) {
        return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const App = {
    elements: {
        body: document.querySelector('body'),
        form: document.getElementById('register-staff-form'),
        firstName: document.getElementById('first-name'),
        middleName: document.getElementById('middle-name'),
        lastName: document.getElementById('last-name'),
        phoneNumber: document.getElementById('phone-number'),
        emailAddress: document.getElementById('email-address'),
        birthdate: document.getElementById('birthdate'),
        birthdateField: document.getElementById('birthdate-field'),
        birthdateDisplay: document.getElementById('birthdate-display'),
        dropdowns: document.querySelectorAll('.register-staff-dropdown'),
        dropdownOptions: document.querySelectorAll('.register-staff-dropdown-option'),
        sex: document.getElementById('sex'),
        sexDropdown: document.querySelector('[data-dropdown="sex"]'),
        sexToggle: document.getElementById('sex-toggle'),
        sexDisplay: document.getElementById('sex-display'),
        role: document.getElementById('role'),
        roleDropdown: document.querySelector('[data-dropdown="role"]'),
        roleToggle: document.getElementById('role-toggle'),
        roleDisplay: document.getElementById('role-display'),
        displayName: document.getElementById('display-name'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirm-password'),
        homeAddress: document.getElementById('home-address'),
        modalBackdrop: document.getElementById('register-staff-modal-backdrop'),
        modalConfirm: document.getElementById('register-staff-modal-confirm'),
        modalCancel: document.getElementById('register-staff-modal-cancel'),
        dashboardBtn: document.getElementById('dashboardpage-btn'),
        recordsBtn: document.getElementById('recordspage-btn'),
        appointmentsBtn: document.getElementById('appointmentspage-btn'),
        newPatientBtn: document.getElementById('newpatientpage-btn'),
        logoutBtn: document.getElementById('logout-btn')
    },

    init() {
        console.log('Register Staff Page Initialized');
        this.setupEventListeners();
        this.syncBirthdateDisplay();
        this.syncSelectDisplay(this.elements.sex, this.elements.sexDisplay, this.elements.sexDropdown);
        this.syncSelectDisplay(this.elements.role, this.elements.roleDisplay, this.elements.roleDropdown);
        this.ui.checkOrientation();
    },

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
            const clickedInsideDropdown = Array.from(el.dropdowns).some((dropdown) => dropdown.contains(event.target));

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

    syncSelectDisplay(selectElement, displayElement, dropdownElement) {
        if (!selectElement || !displayElement || !dropdownElement) {
            return;
        }

        const selectedText = selectElement.value
            ? selectElement.options[selectElement.selectedIndex]?.text || 'Select'
            : 'Select';
        const isPlaceholder = !selectElement.value;

        displayElement.textContent = isPlaceholder ? 'Select' : toTitleCase(selectedText);
        displayElement.classList.toggle('is-placeholder', isPlaceholder);

        dropdownElement.querySelectorAll('.register-staff-dropdown-option').forEach((option) => {
            option.classList.toggle('is-selected', option.dataset.value === selectElement.value);
        });
    },

    toggleDropdown(dropdownElement) {
        if (!dropdownElement) {
            return;
        }

        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllDropdowns();

        if (!isOpen) {
            this.openDropdown(dropdownElement);
        }
    },

    openDropdown(dropdownElement) {
        const toggle = dropdownElement.querySelector('.register-staff-dropdown-toggle');
        const menu = dropdownElement.querySelector('.register-staff-dropdown-menu');

        if (!toggle || !menu) {
            return;
        }

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.register-staff-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.register-staff-dropdown-menu');

        if (!dropdownElement || !toggle || !menu) {
            return;
        }

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

        if (!selectElement || !displayElement || !dropdownElement || !value) {
            return;
        }

        selectElement.value = value;
        displayElement.textContent = label;
        this.syncSelectDisplay(selectElement, displayElement, dropdownElement);
        this.closeDropdown(dropdownElement);
    },

    syncBirthdateDisplay() {
        const el = this.elements;
        if (!el.birthdateDisplay || !el.birthdate) {
            return;
        }

        const hasValue = Boolean(el.birthdate.value);
        el.birthdateDisplay.textContent = formatDateDisplay(el.birthdate.value);
        el.birthdateDisplay.classList.toggle('is-placeholder', !hasValue);
    },

    openBirthdatePicker() {
        const birthdateInput = this.elements.birthdate;
        if (!birthdateInput) {
            return;
        }

        if (birthdateInput.showPicker) {
            birthdateInput.showPicker();
        } else {
            birthdateInput.focus();
            birthdateInput.click();
        }
    },

    validatePasswords() {
        const { password, confirmPassword } = this.elements;

        if (!password || !confirmPassword) {
            return true;
        }

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

        if (!this.elements.form?.reportValidity()) {
            return;
        }

        this.openModal();
    },

    openModal() {
        if (!this.elements.modalBackdrop) {
            return;
        }

        this.elements.modalBackdrop.hidden = false;
    },

    closeModal() {
        if (!this.elements.modalBackdrop) {
            return;
        }

        this.elements.modalBackdrop.hidden = true;
    },

    confirmRegister() {
        const payload = this.getFormPayload();
        console.log('Mock register staff payload:', payload);

        // TODO: Replace this confirmation step with backend registration integration.
        this.closeModal();
        window.alert('Registration confirmed. Backend integration goes here next.');
    },

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
