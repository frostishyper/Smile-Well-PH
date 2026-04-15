document.addEventListener('DOMContentLoaded', () => App.init());

const App = {
    init() {
        this.setupNavigation();
        this.setupCancel();
        this.ui.checkOrientation();
    },

    async submitRegistration() {
        const btn = document.getElementById('confirmRegister');
        const consentBox = document.querySelector('input[name="consent"]');
        
        if (!consentBox || !consentBox.checked) {
            alert("You must check the agreement box before registering.");
            return;
        }

        this.ui.setLoading(btn, true);
        const finalPayload = JSON.parse(sessionStorage.getItem('newPatientData') || '{}');
        
        try {
            const response = await fetch('/api/v1/patients/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            });

            if (response.ok) {
                sessionStorage.removeItem('newPatientData');
                window.location.href = '/records';
            } else {
                const err = await response.json();
                alert("Error: " + (err.error || "Server failed to process registration."));
            }
        } catch (e) {
            console.error(e);
            alert("Network error. Is the backend running?");
        } finally {
            this.ui.setLoading(btn, false);
        }
    },

    setupNavigation() {
        document.getElementById('confirmRegister')?.addEventListener('click', () => this.submitRegistration());
        document.getElementById('PrevBTN')?.addEventListener('click', () => window.location.href = '/new-patient-medical-history');
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
        setLoading(el, isLoading) {
            if (el) el.disabled = isLoading;
            if (isLoading) el.style.opacity = '0.5'; else el.style.opacity = '1';
        },
        checkOrientation() {
            if (window.innerHeight > window.innerWidth) console.warn('Landscape orientation recommended');
        }
    }
};