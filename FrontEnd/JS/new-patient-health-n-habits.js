document.addEventListener('DOMContentLoaded', () => App.init());

const App = {
    init() {
        this.setupNavigation();
        this.setupCancel();
        this.loadState();
        this.ui.checkOrientation();
    },

    getRadioValue(name) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : null;
    },

    // Check if all radio groups are answered
    validate() {
        const groups = ['healthQ1', 'healthQ2', 'healthQ3', 'healthQ4', 'healthQ5', 'healthQ6', 'healthQ7'];
        for (let g of groups) {
            if (!this.getRadioValue(g)) {
                alert("Please answer all questions before proceeding.");
                return false;
            }
        }
        return true;
    },

    saveState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        data.habits = {
            goodHealth: this.getRadioValue('healthQ1'),
            smoker: this.getRadioValue('healthQ2'),
            alcohol: this.getRadioValue('healthQ3'),
            drugs: this.getRadioValue('healthQ4'),
            pregnant: this.getRadioValue('healthQ5'),
            birthControl: this.getRadioValue('healthQ6'),
            nursing: this.getRadioValue('healthQ7')
        };
        sessionStorage.setItem('newPatientData', JSON.stringify(data));
    },

    loadState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        if (!data.habits) return;
        Object.entries(data.habits).forEach(([key, val]) => {
            const radioMap = {
                goodHealth: 'healthQ1', smoker: 'healthQ2', alcohol: 'healthQ3',
                drugs: 'healthQ4', pregnant: 'healthQ5', birthControl: 'healthQ6', nursing: 'healthQ7'
            };
            const input = document.querySelector(`input[name="${radioMap[key]}"][value="${val}"]`);
            if (input) input.checked = true;
        });
    },

    setupNavigation() {
        document.getElementById('NextBTN')?.addEventListener('click', () => {
            if (this.validate()) {
                this.saveState();
                window.location.href = '/new-patient-allergies';
            }
        });
        document.getElementById('PrevBTN')?.addEventListener('click', () => {
            this.saveState();
            window.location.href = '/new-patient-related-info';
        });
    },

    setupCancel() {
        const modal = document.getElementById('deleteModal');
        document.getElementById('CancelBtnControl')?.addEventListener('click', () => modal?.showModal());
        document.getElementById('cancelAction')?.addEventListener('click', () => modal?.close());
        document.getElementById('confirmDelete')?.addEventListener('click', () => {
            sessionStorage.removeItem('newPatientData');
            window.location.href = '/records';
        });
    },

    ui: {
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) console.warn('Landscape orientation recommended');
        }
    }
};