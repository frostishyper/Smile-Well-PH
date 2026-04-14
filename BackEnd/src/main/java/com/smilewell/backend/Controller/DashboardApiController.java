package com.smilewell.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Fetches the Quick Metrics and the List of Branches
    @GetMapping("/summary")
    public Map<String, Object> getSummary(Authentication authentication) {
        Map<String, Object> stats = new HashMap<>();

        // Get Current Logged-In User
        String currentUsername = authentication.getName();
        Map<String, Object> currentUser = jdbcTemplate.queryForMap(
            "SELECT display_name, role FROM staff WHERE display_name = ?", currentUsername
        );
        stats.put("staffName", currentUser.get("display_name"));
        stats.put("staffRole", currentUser.get("role"));

        // Get Table Counts
        stats.put("totalPatients", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM patients", Integer.class));
        stats.put("totalAppointments", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM appointments", Integer.class));
        stats.put("totalDentists", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM staff WHERE role = 'Dentist'", Integer.class));
        stats.put("upcomingVisits", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM appointments WHERE status = TRUE", Integer.class));

        // Get All Branches for the Dropdown
        stats.put("branches", jdbcTemplate.queryForList("SELECT branch_id, branch_name FROM branches"));

        return stats;
    }

    // Fetches the Top 3 Upcoming Appointments (Filtered by Branch)
    @GetMapping("/appointments")
    public List<Map<String, Object>> getUpcomingAppointments(@RequestParam(defaultValue = "all") String branchId) {
        String sql = "SELECT reason, patient_name, start_time, end_time FROM appointments WHERE status = TRUE";
        Object[] params = new Object[]{};

        // Add filter if a specific branch is selected
        if (!branchId.equals("all")) {
            sql += " AND branch_id = ?";
            params = new Object[]{ Integer.parseInt(branchId) };
        }

        sql += " ORDER BY appointment_date ASC, start_time ASC LIMIT 3";
        return jdbcTemplate.queryForList(sql, params);
    }
}