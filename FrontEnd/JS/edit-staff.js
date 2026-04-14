/**
 * Edit Staff Page Logic
 * Handles form population, custom dropdowns, and date displays.
 * Convention: Pascal-Kebab for IDs, camelCase for variables.
 */

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

// --- Helpers ---

function formatDateDisplay(value) {
    if (!value) return 'MM / DD / YYYY';
    const [year, month, day] = value.split('-');
    return `${month} / ${day} / ${year}`;
}

function toTitleCase(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// --- Core Application ---

const App = {
    elements: {
        body: document.querySelector('body'),
        form: document.getElementById('EditStaff-Form'),
        
        // Input Fields (Pascal-Kebab matching HTML)
        firstName: document.getElementById('FirstName-Input'),
        middleName: document.getElementById('MiddleName-Input'),
        lastName: document.getElementById('LastName-Input'),
        phoneNumber: document.getElementById('PhoneNumber-Input'),
        emailAddress: document.getElementById('EmailAddress-Input'),
        displayName: document.getElementById('DisplayName-Input'),
        homeAddress: document.getElementById('HomeAddress-Input'),

        // Birthdate Components
        birthdate: document.getElementById('Birthdate-Input'),
        birthdateField: document.getElementById('Birthdate-Field'),
        birthdateDisplay: document.getElementById('Birthdate-Display'),

        // Custom Dropdown UI Components
        dropdowns: document.querySelectorAll('.edit-staff-dropdown'),
        dropdownOptions: document.querySelectorAll('.edit-staff-dropdown-option'),
        
        sex: document.getElementById('Sex-Input'),
        sexDropdown: document.querySelector('[data-dropdown="sex"]'),
        sexToggle: document.getElementById('Sex-Toggle'),
        sexDisplay: document.getElementById('Sex-Display'),
        
        role: document.getElementById('Role-Input'),
        roleDropdown: document.querySelector('[data-dropdown="role"]'),
        roleToggle: document.getElementById('Role-Toggle'),
        roleDisplay: document.getElementById('Role-Display'),

        // Action Buttons
        resetBtn: document.getElementById('EditStaff-Reset-BTN'),
        deleteBtn: document.getElementById('EditStaff-Delete-BTN'),
        saveBtn: document.getElementById('EditStaff-Save-BTN'),
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

        el.resetBtn?.addEventListener('click', () => this.handleReset());
        el.deleteBtn?.addEventListener('click', () => this.handleDelete());

        // Sync hidden select changes to custom UI
        el.sex?.addEventListener('change', () => this.syncSelectDisplay(el.sex, el.sexDisplay, el.sexDropdown));
        el.role?.addEventListener('change', () => this.syncSelectDisplay(el.role, el.roleDisplay, el.roleDropdown));

        // Birthdate Logic
        el.birthdate?.addEventListener('change', () => this.syncBirthdateDisplay());
        el.birthdateField?.addEventListener('click', () => this.openBirthdatePicker());
        el.birthdateField?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.openBirthdatePicker();
            }
        });

        // Numerical Phone Restriction
        el.phoneNumber?.addEventListener('input', (event) => {
            event.target.value = event.target.value.replace(/\D/g, '').slice(0, 11);
        });

        // Dropdown Toggle Clicks
        el.sexToggle?.addEventListener('click', () => this.toggleDropdown(el.sexDropdown));
        el.roleToggle?.addEventListener('click', () => this.toggleDropdown(el.roleDropdown));

        // Custom Menu Option Clicks
        el.dropdownOptions.forEach((option) => {
            option.addEventListener('click', () => {
                this.selectDropdownOption(option.dataset.target, option.dataset.value, option.textContent.trim());
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (event) => {
            const isInside = Array.from(el.dropdowns).some((d) => d.contains(event.target));
            if (!isInside) this.closeAllDropdowns();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') this.closeAllDropdowns();
        });
    },

    populateForm(staffMember) {
        const el = this.elements;
        if (!staffMember) return;

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
        if (!selectElement || !displayElement || !dropdownElement) return;

        const hasValue = selectElement.value !== "";
        const selectedText = selectElement.options[selectElement.selectedIndex]?.text || 'Select';
        
        displayElement.textContent = hasValue ? toTitleCase(selectedText) : 'Select';
        displayElement.classList.toggle('is-placeholder', !hasValue);

        dropdownElement.querySelectorAll('.edit-staff-dropdown-option').forEach((option) => {
            option.classList.toggle('is-selected', option.dataset.value === selectElement.value);
        });
    },

    toggleDropdown(dropdownElement) {
        if (!dropdownElement) return;
        const isOpen = dropdownElement.classList.contains('open');
        this.closeAllDropdowns();
        if (!isOpen) this.openDropdown(dropdownElement);
    },

    openDropdown(dropdownElement) {
        const toggle = dropdownElement.querySelector('.edit-staff-dropdown-toggle');
        const menu = dropdownElement.querySelector('.edit-staff-dropdown-menu');
        if (!toggle || !menu) return;

        dropdownElement.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        menu.hidden = false;
    },

    closeDropdown(dropdownElement) {
        const toggle = dropdownElement?.querySelector('.edit-staff-dropdown-toggle');
        const menu = dropdownElement?.querySelector('.edit-staff-dropdown-menu');
        if (!dropdownElement || !toggle || !menu) return;

        dropdownElement.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    },

    closeAllDropdowns() {
        this.elements.dropdowns.forEach((dropdown) => this.closeDropdown(dropdown));
    },

    selectDropdownOption(target, value, label) {
        const selectElement = this.elements[target]; 
        const displayElement = this.elements[`${target}Display`];
        const dropdownElement = this.elements[`${target}Dropdown`];

        if (!selectElement || !value) return;

        selectElement.value = value;
        this.syncSelectDisplay(selectElement, displayElement, dropdownElement);
        this.closeDropdown(dropdownElement);
    },

    syncBirthdateDisplay() {
        const el = this.elements;
        if (!el.birthdateDisplay || !el.birthdate) return;

        const val = el.birthdate.value;
        el.birthdateDisplay.textContent = formatDateDisplay(val);
        el.birthdateDisplay.classList.toggle('is-placeholder', !val);
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
        if (!this.elements.form?.reportValidity()) return;
        const payload = this.getFormPayload();
        console.log('Payload for API:', payload);
        window.alert('Details validated. Ready for backend integration.');
    },

    handleDelete() {
        if (window.confirm('Delete this staff record?')) {
            console.log('Action: Delete', state.originalStaff);
        }
    },

    ui: {
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) {
                console.warn('System optimized for Landscape view.');
            }
        }
    }
};