document.addEventListener('DOMContentLoaded', () => App.init());

const API_CONFIG = {
    BASE_URL: '/api/v1',
    HEADERS: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
};

const App = {
    elements: {},

    init() {
        this.cacheElements();
        this.initDropdowns(); 
        this.loadDynamicDropdowns(); 
        this.setupEventListeners();
        this.ui.checkOrientation();
    },

    cacheElements() {
        this.elements = {
            form: document.getElementById('Register-Staff-Form'),
            firstName: document.getElementById('First-Name'),
            middleName: document.getElementById('Middle-Name'),
            lastName: document.getElementById('Last-Name'),
            phoneNumber: document.getElementById('Phone-Number'),
            emailAddress: document.getElementById('Email-Address'),
            birthdate: document.getElementById('Birthdate'),
            sexDropdown: document.querySelector('[data-dropdown="sex"]'),
            roleDropdown: document.querySelector('[data-dropdown="role"]'),
            displayName: document.getElementById('Display-Name'),
            password: document.getElementById('Password'),
            confirmPassword: document.getElementById('Confirm-Password'),
            homeAddress: document.getElementById('Home-Address'),
            modalBackdrop: document.getElementById('Register-Staff-Modal-Backdrop'),
            modalConfirm: document.getElementById('Register-Staff-Modal-Confirm-BTN'),
            modalCancel: document.getElementById('Register-Staff-Modal-Cancel-BTN')
        };
    },

    async loadDynamicDropdowns() {
        const sexMenu = this.elements.sexDropdown?.querySelector('.register-staff-dropdown-menu');
        if (!sexMenu) return;

        try {
            const data = await this.api.get('/reference/sex');
            
            if (data && data.length > 0) {
                const html = data.map(s => {
                    const cleanVal = s.sex_name.charAt(0).toUpperCase(); 
                    
                    if (cleanVal === 'M' || cleanVal === 'F') {
                        return `<button class="register-staff-dropdown-option" type="button" data-value="${cleanVal}">${s.sex_name}</button>`;
                    }
                    return ''; 
                }).join('');
                
                sexMenu.innerHTML = html;
            } else {
                this.injectFallbackSexOptions(sexMenu);
            }
        } catch (e) {
            console.error("Failed to load dynamic dropdowns, using fallback:", e);
            this.injectFallbackSexOptions(sexMenu);
        }
    },

    
    injectFallbackSexOptions(menuElement) {
        menuElement.innerHTML = `
            <button class="register-staff-dropdown-option" type="button" data-value="M">Male</button>
            <button class="register-staff-dropdown-option" type="button" data-value="F">Female</button>
        `;
    },

    initDropdowns() {
        document.addEventListener('click', (e) => {
            // 1. If user clicks a dropdown Option
            const option = e.target.closest('.register-staff-dropdown-option');
            if (option) {
                e.stopPropagation();
                const dropdown = option.closest('.register-staff-dropdown');
                const display = dropdown.querySelector('.register-staff-dropdown-value');
                
                display.textContent = option.textContent;
                display.style.color = '#000000';
                display.classList.remove('is-placeholder');
                dropdown.dataset.selectedValue = option.dataset.value; 
                
                dropdown.classList.remove('open');
                dropdown.querySelector('.register-staff-dropdown-menu').hidden = true;
                return;
            }

            
            const toggle = e.target.closest('.register-staff-dropdown-toggle');
            if (toggle) {
                e.stopPropagation();
                const dropdown = toggle.closest('.register-staff-dropdown');
                const menu = dropdown.querySelector('.register-staff-dropdown-menu');
                
                document.querySelectorAll('.register-staff-dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('open');
                        const m = d.querySelector('.register-staff-dropdown-menu');
                        if (m) m.hidden = true;
                    }
                });

                const isOpen = dropdown.classList.toggle('open');
                if (menu) menu.hidden = !isOpen;
                return;
            }

            
            document.querySelectorAll('.register-staff-dropdown').forEach(d => {
                d.classList.remove('open');
                const menu = d.querySelector('.register-staff-dropdown-menu');
                if (menu) menu.hidden = true;
            });
        });
    },

    setupEventListeners() {
        this.elements.phoneNumber?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        });

        this.elements.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.elements.modalBackdrop.hidden = false;
            }
        });

        this.elements.modalCancel?.addEventListener('click', () => {
            this.elements.modalBackdrop.hidden = true;
        });

        this.elements.modalConfirm?.addEventListener('click', () => {
            this.submitRegistration();
        });
    },

    validateForm() {
        const el = this.elements;
        const required = [el.firstName, el.lastName, el.phoneNumber, el.emailAddress, el.birthdate, el.displayName, el.password, el.confirmPassword, el.homeAddress];
        
        for (let input of required) {
            if (!input || !input.value.trim()) {
                alert("Please fill out all required text fields.");
                return false;
            }
        }

        if (!el.sexDropdown?.dataset.selectedValue || !el.roleDropdown?.dataset.selectedValue) {
            alert("Please select both Sex and Role from the dropdowns.");
            return false;
        }

        if (el.password.value !== el.confirmPassword.value) {
            alert("Passwords do not match.");
            return false;
        }

        return true;
    },

    async submitRegistration() {
        const el = this.elements;
        this.ui.setLoading(el.modalConfirm, true);

        const payload = {
            firstName: el.firstName.value.trim(),
            middleName: el.middleName?.value.trim() || '',
            lastName: el.lastName.value.trim(),
            phoneNumber: el.phoneNumber.value.trim(),
            emailAddress: el.emailAddress.value.trim(),
            birthdate: el.birthdate.value,
            sex: el.sexDropdown.dataset.selectedValue, 
            role: el.roleDropdown.dataset.selectedValue,
            displayName: el.displayName.value.trim(),
            password: el.password.value,
            homeAddress: el.homeAddress.value.trim()
        };

        try {
            await this.api.post('/staff/register', payload);
            el.modalBackdrop.hidden = true;
            window.location.href = '/staff-list';
        } catch (e) {
            alert("Registration failed. Check server console for exact error.");
            console.error(e);
        } finally {
            this.ui.setLoading(el.modalConfirm, false);
        }
    },

    ui: {
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
        post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    }
};