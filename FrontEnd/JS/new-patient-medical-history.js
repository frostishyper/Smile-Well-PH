document.addEventListener('DOMContentLoaded', () => App.init());

const App = {
    init() {
        const pageLabel = document.getElementById('CurrentPage');
        if (pageLabel) pageLabel.textContent = "5/6";

        this.setupNavigation();
        this.setupCancel();
        this.loadState();
        this.ui.checkOrientation();
    },

    // Ensures that if a condition is checked 'Yes', a note is written
    validate() {
        for (let i = 1; i <= 9; i++) {
            const isChecked = document.querySelector(`input[name="medicalQ${i}"]`)?.checked;
            const noteId = i === 6 ? 'medNotesQ6' : `medQ${i}Notes`;
            const noteVal = document.getElementById(noteId)?.value.trim();

            if (isChecked && (!noteVal || noteVal.length < 2)) {
                alert(`Please provide a note for the selected condition in row ${i}.`);
                return false;
            }
        }
        return true;
    },

    saveState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        data.conditions = [];
        for (let i = 1; i <= 9; i++) {
            const hasCondition = document.querySelector(`input[name="medicalQ${i}"]`)?.checked || false;
            const noteId = i === 6 ? 'medNotesQ6' : `medQ${i}Notes`;
            const notes = document.getElementById(noteId)?.value || '';
            data.conditions.push({ index: i, hasCondition, notes });
        }
        sessionStorage.setItem('newPatientData', JSON.stringify(data));
    },

    loadState() {
        const data = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        if (!data.conditions) return;
        data.conditions.forEach(cond => {
            const checkbox = document.querySelector(`input[name="medicalQ${cond.index}"]`);
            if (checkbox) checkbox.checked = cond.hasCondition;
            const noteId = cond.index === 6 ? 'medNotesQ6' : `medQ${cond.index}Notes`;
            const input = document.getElementById(noteId);
            if (input) input.value = cond.notes;
        });
    },

    setupNavigation() {
        document.getElementById('NextBTN')?.addEventListener('click', () => {
            if (this.validate()) {
                this.saveState();
                window.location.href = '/new-patient-consent';
            }
        });
        document.getElementById('PrevBTN')?.addEventListener('click', () => {
            this.saveState();
            window.location.href = '/new-patient-allergies';
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