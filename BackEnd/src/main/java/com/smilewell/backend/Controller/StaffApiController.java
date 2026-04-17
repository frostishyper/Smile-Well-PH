package com.smilewell.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/staff")
public class StaffApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/list")
    public List<Map<String, Object>> getAllStaff() {
        String sql = "SELECT staff_id AS dentistId, display_name AS displayName, role FROM staff WHERE is_active = TRUE ORDER BY display_name ASC";
        return jdbcTemplate.queryForList(sql);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerStaff(@RequestBody Map<String, Object> payload) {
        try {
            String sql = "INSERT INTO staff (role, display_name, password_hash, first_name, middle_name, last_name, contact_number, email, birthday, home_address, sex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            String passwordHash = new BCryptPasswordEncoder().encode((String) payload.get("password"));

            jdbcTemplate.update(sql,
                payload.get("role"),
                payload.get("displayName"),
                passwordHash,
                payload.get("firstName"),
                payload.get("middleName"),
                payload.get("lastName"),
                payload.get("phoneNumber"),
                payload.get("emailAddress"),
                payload.get("birthdate"),
                payload.get("homeAddress"),
                sanitizeSex((String) payload.get("sex"))
            );

            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStaffDetails(@PathVariable("id") int staffId) {
        try {
            String sql = "SELECT staff_id, role, display_name, first_name, middle_name, last_name, contact_number, email, DATE_FORMAT(birthday, '%Y-%m-%d') as birthday, home_address, sex FROM staff WHERE staff_id = ? AND is_active = TRUE LIMIT 1";
            Map<String, Object> staff = jdbcTemplate.queryForMap(sql, staffId);
            return ResponseEntity.ok(staff);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Staff not found"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(@PathVariable("id") int staffId, @RequestBody Map<String, Object> payload) {
        try {
            String sql = "UPDATE staff SET role=?, display_name=?, first_name=?, middle_name=?, last_name=?, contact_number=?, email=?, birthday=?, home_address=?, sex=? WHERE staff_id=?";
            
            jdbcTemplate.update(sql,
                payload.get("role"),
                payload.get("displayName"),
                payload.get("firstName"),
                payload.get("middleName"),
                payload.get("lastName"),
                payload.get("phoneNumber"),
                payload.get("emailAddress"),
                payload.get("birthdate"),
                payload.get("homeAddress"),
                sanitizeSex((String) payload.get("sex")),
                staffId
            );

            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateStaff(@PathVariable("id") int staffId) {
        try {
            String sql = "UPDATE staff SET is_active = FALSE WHERE staff_id = ?";
            jdbcTemplate.update(sql, staffId);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private String sanitizeSex(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "Other";
        String clean = raw.trim().toUpperCase();
        if (clean.startsWith("M")) return "M";
        if (clean.startsWith("F")) return "F";
        return "Other";
    }
}