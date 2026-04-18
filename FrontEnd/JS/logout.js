// ==========================================
// 1. STANDALONE SESSION & LOGOUT MANAGER
// ==========================================
class SessionManager {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        this.cacheElements();
        
        if (!this.triggerBtn) return;

        this.injectCSS();
        this.injectHTML();
        this.cacheModalElements();
        this.bindEvents();
        
        
        await this.updateUserProfile();
    }

    cacheElements() {
        this.triggerBtn = document.querySelector('#Logout-BTN');
        this.staffNameEl = document.querySelector('#Staff-Name');
        this.staffRoleEl = document.querySelector('#Staff-Role');
    }

    async updateUserProfile() {
        try {
            const response = await fetch('/api/v1/dashboard/summary');
            if (response.ok) {
                const data = await response.json();
                
                // Update elements if they exist in the current DOM
                if (this.staffNameEl) this.staffNameEl.textContent = data.staffName;
                if (this.staffRoleEl) this.staffRoleEl.textContent = data.staffRole;
            } else {
                console.warn("SessionManager: Failed to fetch profile data.");
            }
        } catch (error) {
            console.error("SessionManager: Network error updating profile:", error);
        }
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .Logout-Modal-Overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); display: flex; justify-content: center; align-items: center; z-index: 9999; opacity: 0; visibility: hidden; transition: all 0.2s ease; }
            .Logout-Modal-Overlay.is-open { opacity: 1; visibility: visible; }
            .Logout-Card { display: flex; width: 62.5rem; height: 37.5rem; padding: 3.2rem 0.63rem 0.63rem 0.63rem; flex-direction: column; align-items: center; gap: 1.57rem; border-radius: 0.9375rem; border: 2px solid var(--Control-Gray); background: var(--White); box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.30); }
            .LC-Icon-Container { display: flex; width: 6.25rem; padding: 0.625rem; justify-content: center; align-items: center; gap: 0.625rem; flex-shrink: 0; }
            .LC-Icon-Container svg { width: 3.125rem; height: 3.125rem; color: var(--Black); }
            .LC-Header { color: var(--Black); font-size: 3rem; font-style: normal; font-weight: 700; line-height: normal; }
            .LC-SubText { color: var(--Black); text-align: center; font-size: 1.875rem; font-style: normal; font-weight: 400; line-height: normal; }
            .LC-Btn-Container { display: flex; padding: 2.875rem 1.875rem; justify-content: center; align-items: center; gap: 1.875rem; flex: 1 0 0; align-self: stretch; }
            .LC-Cancel-Btn { display: flex; width: 25rem; padding: 0.625rem; justify-content: center; align-items: center; gap: 0.625rem; flex-shrink: 0; align-self: stretch; background-color: var(--Black); color: var(--White); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-style: normal; font-weight: 400; line-height: normal; letter-spacing: -0.06rem; border: none; border-radius: 0.9375rem; cursor: pointer; }
            .LC-Confirm-Btn { display: flex; padding: 0.625rem; justify-content: center; align-items: center; gap: 0.625rem; flex: 1 0 0; align-self: stretch; background-color: var(--Control-Gray); color: #858788; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2rem; font-style: normal; font-weight: 400; line-height: normal; letter-spacing: -0.06rem; border: none; border-radius: 0.9375rem; cursor: pointer; }
        `;
        document.head.appendChild(style);
    }

    injectHTML() {
        this.modalWrapper = document.createElement('div');
        this.modalWrapper.className = 'Logout-Modal-Overlay';
        this.modalWrapper.id = 'Logout-Modal';
        this.modalWrapper.innerHTML = `
            <div class="Logout-Card">
                <div class="LC-Icon-Container"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none"><path d="M39.5161 5.36706C45.8669 9.83134 50 17.1329 50 25.3968C50 38.9682 38.8306 49.9702 25.0504 49.9999C11.2903 50.0297 0.0201797 38.9881 1.83988e-05 25.4365C-0.0100622 17.1726 4.123 9.85118 10.4637 5.37698C11.6432 4.55357 13.2863 4.90079 13.9919 6.14087L15.5847 8.92856C16.1794 9.97023 15.8972 11.2897 14.9194 12.004C10.7359 15.0595 8.06453 19.9008 8.06453 25.3869C8.05445 34.5436 15.5746 42.0634 25 42.0634C34.2339 42.0634 41.996 34.7023 41.9355 25.2877C41.9052 20.1488 39.4456 15.1885 35.0706 11.994C34.0928 11.2797 33.8206 9.96031 34.4153 8.92856L36.0081 6.14087C36.7137 4.91071 38.3468 4.54365 39.5161 5.36706ZM29.0323 26.1904V2.38095C29.0323 1.06151 27.9536 0 26.6129 0H23.3871C22.0464 0 20.9678 1.06151 20.9678 2.38095V26.1904C20.9678 27.5099 22.0464 28.5714 23.3871 28.5714H26.6129C27.9536 28.5714 29.0323 27.5099 29.0323 26.1904Z" fill="currentColor"/></svg></div>
                <h1 class="LC-Header">Log Out?</h1>
                <h2 class="LC-SubText">You Are About To Be Logged Out<br>Are You Sure?</h2>
                <div class="LC-Btn-Container">
                    <button class="LC-Cancel-Btn" id="Cancel-Logout">Cancel</button>
                    <button class="LC-Confirm-Btn" id="Confirm-Logout">Log Out</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modalWrapper);
    }

    cacheModalElements() {
        this.cancelBtn = this.modalWrapper.querySelector('#Cancel-Logout');
        this.confirmBtn = this.modalWrapper.querySelector('#Confirm-Logout');
    }

    bindEvents() {
        // Modal controls
        this.triggerBtn.addEventListener('click', () => { this.modalWrapper.classList.add('is-open'); });
        this.cancelBtn.addEventListener('click', () => { this.modalWrapper.classList.remove('is-open'); });
        
        // Confirm logout logic
        this.confirmBtn.addEventListener('click', async () => {
            this.confirmBtn.textContent = "Logging out...";
            this.confirmBtn.disabled = true;
            try {
                const response = await fetch('/api/v1/logout', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' } 
                });
                
                if (response.ok) { 
                    window.location.href = '/'; 
                } else { 
                    console.error("Server refused to log out."); 
                    this.resetButton(); 
                }
            } catch (error) {
                console.error("Network error during logout:", error);
                this.resetButton();
            }
        });
    }

    resetButton() {
        this.confirmBtn.textContent = "Log Out";
        this.confirmBtn.disabled = false;
    }
}

// ==========================================
// 2. STANDALONE SIDEBAR NAVIGATION
// ==========================================
class SidebarNavigation {
    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.routes = {
            'DashboardPage-BTN': '/dashboard',
            'RecordsPage-BTN': '/records',       
            'AppointmentsPage-BTN': '/appointments',
            'NewPatientPage-BTN': '/new-patient',
            'StaffPage-BTN': '/staff-list'           
        };

        this.bindNavigationEvents();
    }

    bindNavigationEvents() {
        for (const [buttonId, targetUrl] of Object.entries(this.routes)) {
            const btn = document.getElementById(buttonId);
            if (btn) {
                btn.addEventListener('click', () => {
                    window.location.href = targetUrl;
                });
            }
        }
    }
}

new SessionManager();
new SidebarNavigation();