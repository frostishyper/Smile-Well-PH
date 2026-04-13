package com.smilewell.backend.Controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {

    @GetMapping("/")
    public String serveIndex(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            return "redirect:/dashboard"; 
        }
        return "forward:/Pages/index.html";
    }

    @GetMapping("/dashboard")
    public String serveDashboard() { return "forward:/Pages/dashboard.html"; }

    @GetMapping("/allergies")
    public String serveAllergies() { return "forward:/Pages/allergies.html"; }

    @GetMapping("/appointments")
    public String serveAppointments() { return "forward:/Pages/appointments.html"; }

    @GetMapping("/conditions")
    public String serveConditions() { return "forward:/Pages/conditions.html"; }

    @GetMapping("/edit-appointment")
    public String serveEditAppointment() { return "forward:/Pages/edit-appointment.html"; }

    @GetMapping("/edit-staff")
    public String serveEditStaff() { return "forward:/Pages/edit-staff.html"; }

    @GetMapping("/full-profile-main-menu")
    public String serveFullProfileMainMenu() { return "forward:/Pages/full-profile-main-menu.html"; }

    @GetMapping("/healthandhabits")
    public String serveHealthAndHabits() { return "forward:/Pages/healthandhabits.html"; }

    @GetMapping("/medical-profile")
    public String serveMedicalProfile() { return "forward:/Pages/medical_profile.html"; }

    @GetMapping("/new-appointment")
    public String serveNewAppointment() { return "forward:/Pages/new-appointment.html"; }

    @GetMapping("/new-patient-allergies")
    public String serveNewPatientAllergies() { return "forward:/Pages/new-patient-allergies.html"; }

    @GetMapping("/new-patient-consent")
    public String serveNewPatientConsent() { return "forward:/Pages/new-patient-consent.html"; }

    @GetMapping("/new-patient-health-n-habits")
    public String serveNewPatientHealthHabits() { return "forward:/Pages/new-patient-health-n-habits.html"; }

    @GetMapping("/new-patient-medical-history")
    public String serveNewPatientMedicalHistory() { return "forward:/Pages/new-patient-medical-history.html"; }

    @GetMapping("/new-patient-related-info")
    public String serveNewPatientRelatedInfo() { return "forward:/Pages/new-patient-related-info.html"; }

    @GetMapping("/new-patient")
    public String serveNewPatient() { return "forward:/Pages/new-patient.html"; }

    @GetMapping("/new-procedure")
    public String serveNewProcedure() { return "forward:/Pages/new-procedure.html"; }

    @GetMapping("/records")
    public String serveRecords() { return "forward:/Pages/patient-list.html"; }

    @GetMapping("/patient-procedures")
    public String servePatientProcedures() { return "forward:/Pages/patient-procedures.html"; }

    @GetMapping("/patient-profile")
    public String servePatientProfile() { return "forward:/Pages/patient-profile.html"; }

    @GetMapping("/personaldetails")
    public String servePersonalDetails() { return "forward:/Pages/personaldetails.html"; }

    @GetMapping("/register-staff")
    public String serveRegisterStaff() { return "forward:/Pages/register-staff.html"; }

    @GetMapping("/relatedinfo")
    public String serveRelatedInfo() { return "forward:/Pages/relatedinfo.html"; }

    @GetMapping("/soa")
    public String serveSoa() { return "forward:/Pages/soa.html"; }

    @GetMapping("/staff-list")
    public String serveStaffList() { return "forward:/Pages/staff-list.html"; }

    @GetMapping("/staff")
    public String serveStaff() { return "forward:/Pages/staff.html"; }

    @GetMapping("/transactionhistory")
    public String serveTransactionHistory() { return "forward:/Pages/transactionhistory.html"; }
}