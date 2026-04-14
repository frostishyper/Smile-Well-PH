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

const MOCK_STAFF_MEMBER = {
    firstName: 'Lee',
    middleName: 'Ramos',
    lastName: 'Yu',
    phoneNumber: '09123456789',
    emailAddress: 'lee.yu@smilewell.com',
    birthdate: '2006-03-06',
    sex: 'female',
    role: 'dentist',
    displayName: 'Frostishyper',
    homeAddress: '69 Vocaloid St, Shibuya Tokyo JP'
};

const state = {
    originalStaff: null
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
        form: document.getElementById('edit-staff-form'),
        firstName: document.getElementById('first-name'),
        middleName: document.getElementById('middle-name'),
        lastName: document.getElementById('last-name'),
        phoneNumber: document.getElementById('phone-number'),
        emailAddress: document.getElementById('email-address'),
        birthdate: document.getElementById('birthdate'),
        birthdateField: document.getElementById('birthdate-field'),
        birthdateDisplay: document.getElementById('birthdate-display'),
        dropdowns: document.querySelectorAll('.edit-staff-dropdown'),
        dropdownOptions: document.querySelectorAll('.edit-staff-dropdown-option'),
        sex: document.getElementById('sex'),
        sexDropdown: document.querySelector('[data-dropdown="sex"]'),
        sexToggle: document.getElementById('sex-toggle'),
        sexDisplay: document.getElementById('sex-display'),
        role: document.getElementById('role'),
        roleDropdown: document.querySelector('[data-dropdown="role"]'),
        roleToggle: document.getElementById('role-toggle'),
        roleDisplay: document.getElementById('role-display'),
        displayName: document.getElementById('display-name'),
        homeAddress: document.getElementById('home-address'),
        resetBtn: document.getElementById('edit-staff-reset-btn'),
        deleteBtn: document.getElementById('edit-staff-delete-btn'),
        saveBtn: document.getElementById('edit-staff-save-btn'),
        dashboardBtn: document.getElementById('dashboardpage-btn'),
        recordsBtn: document.getElementById('recordspage-btn'),
        appointmentsBtn: document.getElementById('appointmentspage-btn'),
        newPatientBtn: document.getElementById('newpatientpage-btn'),
        logoutBtn: document.getElementById('logout-btn')
    },

    init() {
        console.log('Edit Staff Page Initialized');
        state.originalStaff = { ...MOCK_STAFF_MEMBER };

        this.populateForm(state.originalStaff);
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    setupEventListeners() {
        const el = this.elements;

        el.form?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSave();
        });

        el.resetBtn?.addEventListener('click', () => {
            this.handleReset();
        });

        el.deleteBtn?.addEventListener('click', () => {
            this.handleDelete();
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

        document.addEventListener('click', (event) => {
            const clickedInsideDropdown = Array.from(el.dropdowns).some((dropdown) => dropdown.contains(event.target));

            if (!clickedInsideDropdown) {
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        
    },

    populateForm(staffMember) {
        const el = this.elements;

        if (!staffMember) {
            return;
        }

        el.firstName.value = staffMember.firstName;
        el.middleName.value = staffMember.middleName;
        el.lastName.value = staffMember.lastName;
        el.phoneNumber.value = staffMember.phoneNumber;
        el.emailAddress.value = staffMember.emailAddress;
        el.birthdate.value = staffMember.birthdate;
        el.sex.value = staffMember.sex;
        el.role.value = staffMember.role;
        el.displayName.value = staffMember.displayName;
        el.homeAddress.value = staffMember.homeAddress;

        this.syncSelectDisplay(el.sex, el.sexDisplay, el.sexDropdown);
        this.syncSelectDisplay(el.role, el.roleDisplay, el.roleDropdown);
        this.syncBirthdateDisplay();
    },

    syncSelectDisplay(selectElement, displayElement, dropdownElement) {
        if (!selectElement || !displayElement || !dropdownElement) {
            return;
        }

        const selectedText = selectElement.options[selectElement.selectedIndex]?.text || 'Select';
        displayElement.textContent = toTitleCase(selectedText);

        dropdownElement.querySelectorAll('.edit-staff-dropdown-option').forEach((option) => {
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
        const toggle = dropdownElement.querySelector('.edit-staff-dropdown-toggle');
        const menu = dropdownElement.querySelector('.edit-staff-dropdown-menu');

        if (!toggle || !menu) {
            return;
        }

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.edit-staff-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.edit-staff-dropdown-menu');

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
            homeAddress: el.homeAddress.value.trim()
        };
    },

    handleReset() {
        this.populateForm(state.originalStaff);
        this.closeAllDropdowns();
    },

    handleSave() {
        const el = this.elements;

        if (!el.form?.reportValidity()) {
            return;
        }

        const payload = this.getFormPayload();
        console.log('Mock save staff payload:', payload);

        // TODO: Replace this mock save with backend update integration.
        window.alert('Staff details validated. Backend save integration goes here next.');
    },

    handleDelete() {
        const confirmed = window.confirm('Delete this staff record? This is a mock action only.');

        if (!confirmed) {
            return;
        }

        console.log('Mock delete staff record:', state.originalStaff);

        // TODO: Replace this mock delete with backend delete integration.
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
