document.addEventListener('DOMContentLoaded', () => App.init());

const App = {
    state: {
        staffRows: []
    },

    init() {
        this.fetchStaffData();
        this.bindActions();
    },

    async fetchStaffData() {
        try {
            const response = await fetch('/api/v1/staff/list');
            const data = await response.json();
            this.state.staffRows = data;
        } catch (e) {
            console.error("Database Error:", e);
            this.state.staffRows = [{dentistId: 1, displayName: "Database Connection Error", role: "N/A"}];
        }
        this.render();
    },

    render() {
        const tbody = document.getElementById('Staff-List-Table-Body');
        if (!tbody) return;

        tbody.innerHTML = this.state.staffRows.map(staff => `
            <tr>
                <td>${staff.dentistId}</td>
                <td>${staff.displayName}</td>
                <td>${staff.role}</td>
                <td style="text-align: center;">
                    <button class="edit-action-btn" data-id="${staff.dentistId}">Edit</button>
                </td>
            </tr>
        `).join('');
    },

    bindActions() {
        document.getElementById('New-Staff-BTN')?.addEventListener('click', () => {
            window.location.href = '/register-staff';
        });

        document.getElementById('Staff-List-Table-Body')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-action-btn')) {
                window.location.href = `/edit-staff?id=${e.target.dataset.id}`;
            }
        });
    }
};