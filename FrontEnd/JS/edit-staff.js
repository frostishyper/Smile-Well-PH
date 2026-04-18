document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},
    state: {
        staffId: null,
        originalStaff: null
    },

    init() {
        this.cacheElements();
        const urlParams = new URLSearchParams(window.location.search);
        this.state.staffId = urlParams.get('id');

        if (!this.state.staffId) {
            window.location.href = '/staff-list';
            return;
        }

        this.initDropdowns();
        this.loadDynamicDropdowns();
        this.fetchStaffDetails();
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements = {
            form: document.getElementById('EditStaff-Form'),
            firstName: document.getElementById('FirstName-Input'),
            middleName: document.getElementById('MiddleName-Input'),
            lastName: document.getElementById('LastName-Input'),
            phoneNumber: document.getElementById('PhoneNumber-Input'),
            emailAddress: document.getElementById('EmailAddress-Input'),
            displayName: document.getElementById('DisplayName-Input'),
            homeAddress: document.getElementById('HomeAddress-Input'),
            birthdate: document.getElementById('Birthdate-Input'),
            sexDropdown: document.getElementById('Sex-Dropdown'),
            roleDropdown: document.getElementById('Role-Dropdown'),
            resetBtn: document.getElementById('EditStaff-Reset-BTN'),
            deleteBtn: document.getElementById('EditStaff-Delete-BTN'),
            saveBtn: document.getElementById('EditStaff-Save-BTN'),
            backBtn: document.getElementById('Back-BTN')
        };
    },

    async loadDynamicDropdowns() {
        const sexMenu = this.elements.sexDropdown?.querySelector('.Dropdown-Menu');
        if (!sexMenu) return;

        try {
            const data = await this.api.get('/reference/sex');
            if (data && data.length > 0) {
                sexMenu.innerHTML = data.map(s => {
                    const cleanVal = s.sex_name.charAt(0).toUpperCase();
                    if (cleanVal === 'M' || cleanVal === 'F') {
                        return `<li class="Dropdown-Item" data-value="${cleanVal}">${s.sex_name}</li>`;
                    }
                    return '';
                }).join('');
            } else {
                this.injectFallbackSexOptions(sexMenu);
            }
        } catch (e) {
            this.injectFallbackSexOptions(sexMenu);
        }
    },

    injectFallbackSexOptions(menuElement) {
        menuElement.innerHTML = `
            <li class="Dropdown-Item" data-value="M">Male</li>
            <li class="Dropdown-Item" data-value="F">Female</li>
        `;
    },

    initDropdowns() {
        document.addEventListener('click', (e) => {
            const option = e.target.closest('.Dropdown-Item');
            if (option) {
                e.stopPropagation();
                const dropdown = option.closest('.Custom-Dropdown');
                const display = dropdown.querySelector('.Dropdown-Label');
                
                display.textContent = option.textContent;
                display.style.color = '#000000';
                display.classList.remove('is-placeholder');
                dropdown.dataset.selectedValue = option.dataset.value;
                
                dropdown.classList.remove('is-open');
                return;
            }

            const trigger = e.target.closest('.Dropdown-Trigger');
            if (trigger) {
                e.stopPropagation();
                const dropdown = trigger.closest('.Custom-Dropdown');
                
                document.querySelectorAll('.Custom-Dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('is-open');
                });

                dropdown.classList.toggle('is-open');
                return;
            }

            document.querySelectorAll('.Custom-Dropdown').forEach(d => {
                d.classList.remove('is-open');
            });
        });
    },

    setupEventListeners() {
        const el = this.elements;

        el.backBtn?.addEventListener('click', () => {
            window.location.href = '/staff-list';
        });

        el.resetBtn?.addEventListener('click', () => {
            if (this.state.originalStaff) this.populateForm(this.state.originalStaff);
        });

        el.saveBtn?.addEventListener('click', () => {
            if (el.form.reportValidity() && this.validateForm()) {
                this.handleSave();
            }
        });

        el.deleteBtn?.addEventListener('click', () => {
            this.handleDelete();
        });

        el.phoneNumber?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        });
    },

    validateForm() {
        const el = this.elements;
        if (!el.sexDropdown.dataset.selectedValue || !el.roleDropdown.dataset.selectedValue) {
            alert("Please select both Sex and Role from the dropdowns.");
            return false;
        }
        return true;
    },

    async fetchStaffDetails() {
        try {
            const data = await this.api.get(`/staff/${this.state.staffId}`);
            this.state.originalStaff = data;
            this.populateForm(data);
        } catch (e) {
            alert("Failed to load staff details.");
            window.location.href = '/staff-list';
        }
    },

    populateForm(data) {
        const el = this.elements;
        el.firstName.value = data.first_name || '';
        el.middleName.value = data.middle_name || '';
        el.lastName.value = data.last_name || '';
        el.phoneNumber.value = data.contact_number || '';
        el.emailAddress.value = data.email || '';
        el.birthdate.value = data.birthday || '';
        el.displayName.value = data.display_name || '';
        el.homeAddress.value = data.home_address || '';

        this.ui.updateDropdownUI(el.sexDropdown, data.sex);
        this.ui.updateDropdownUI(el.roleDropdown, data.role);
    },

    async handleSave() {
        const el = this.elements;
        const payload = {
            firstName: el.firstName.value.trim(),
            middleName: el.middleName.value.trim(),
            lastName: el.lastName.value.trim(),
            phoneNumber: el.phoneNumber.value.trim(),
            emailAddress: el.emailAddress.value.trim(),
            birthdate: el.birthdate.value,
            sex: el.sexDropdown.dataset.selectedValue,
            role: el.roleDropdown.dataset.selectedValue,
            displayName: el.displayName.value.trim(),
            homeAddress: el.homeAddress.value.trim()
        };

        try {
            this.ui.setLoading(el.saveBtn, true);
            await this.api.put(`/staff/${this.state.staffId}`, payload);
            alert("Staff details updated successfully.");
            window.location.href = '/staff-list';
        } catch (e) {
            alert("Failed to update staff.");
        } finally {
            this.ui.setLoading(el.saveBtn, false);
        }
    },

    async handleDelete() {
        if (!window.confirm("Are you sure you want to deactivate this staff member?")) return;

        try {
            this.ui.setLoading(this.elements.deleteBtn, true);
            await this.api.delete(`/staff/${this.state.staffId}`);
            window.location.href = '/staff-list';
        } catch (e) {
            alert("Failed to deactivate staff.");
        } finally {
            this.ui.setLoading(this.elements.deleteBtn, false);
        }
    },

    ui: {
        updateDropdownUI(dropdownEl, value) {
            if (!dropdownEl || !value) return;
            const menu = dropdownEl.querySelector('.Dropdown-Menu');
            const display = dropdownEl.querySelector('.Dropdown-Label');
            
            setTimeout(() => {
                const item = menu.querySelector(`[data-value="${value}"]`);
                if (item) {
                    dropdownEl.dataset.selectedValue = value;
                    display.textContent = item.textContent;
                    display.style.color = '#000000';
                    display.classList.remove('is-placeholder');
                }
            }, 100); // Small delay to wait for dynamic menu items
        },
        setLoading(element, isLoading) {
            if (!element) return;
            element.disabled = isLoading;
            element.style.opacity = isLoading ? '0.5' : '1';
        },
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) console.warn('Landscape optimized');
        }
    },

    api: {
        async request(endpoint, options = {}) {
            const url = `${API_CONFIG.BASE_URL}${endpoint}`;
            const settings = { ...options, headers: { ...API_CONFIG.HEADERS, ...options.headers } };
            const response = await fetch(url, settings);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return response.status === 204 ? null : response.json();
        },
        get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
        put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
        delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
    }
};