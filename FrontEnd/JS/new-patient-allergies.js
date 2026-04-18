document.addEventListener('DOMContentLoaded', () => App.init());

const App = {
    init() {
        const pageLabel = document.getElementById('CurrentPage');
        if (pageLabel) pageLabel.textContent = "4/6"; // Force correct numbering

        this.setupNavigation();
        this.setupCancel();
        this.loadState();
        this.ui.checkOrientation();
    },

    getRadioValue(name) {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : null;
    },

    validate() {
        const groups = ['allergyQ1', 'allergyQ2', 'allergyQ3', 'allergyQ4', 'allergyQ5'];
        for (let g of groups) {
            if (!this.getRadioValue(g)) {
                alert("Please answer all allergy selections.");
                return false;
            }
        }
        return true;
    },

    saveState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        data.allergies = {
            penicillin: this.getRadioValue('allergyQ1'),
            anesthetics: this.getRadioValue('allergyQ2'),
            aspirin: this.getRadioValue('allergyQ3'),
            latex: this.getRadioValue('allergyQ4'),
            sulfa: this.getRadioValue('allergyQ5'),
            others: document.getElementById('otherAllergies')?.value || ''
        };
        sessionStorage.setItem('newPatientData', JSON.stringify(data));
    },

    loadState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        if (!data.allergies) return;
        const a = data.allergies;
        const radioMap = { penicillin: 'allergyQ1', anesthetics: 'allergyQ2', aspirin: 'allergyQ3', latex: 'allergyQ4', sulfa: 'allergyQ5' };
        Object.entries(radioMap).forEach(([key, name]) => {
            if (a[key]) {
                const input = document.querySelector(`input[name="${name}"][value="${a[key]}"]`);
                if (input) input.checked = true;
            }
        });
        if (document.getElementById('otherAllergies')) document.getElementById('otherAllergies').value = a.others || '';
    },

    setupNavigation() {
        document.getElementById('NextBTN')?.addEventListener('click', () => {
            if (this.validate()) {
                this.saveState();
                window.location.href = '/new-patient-medical-history';
            }
        });
        document.getElementById('PrevBTN')?.addEventListener('click', () => {
            this.saveState();
            window.location.href = '/new-patient-health-n-habits';
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