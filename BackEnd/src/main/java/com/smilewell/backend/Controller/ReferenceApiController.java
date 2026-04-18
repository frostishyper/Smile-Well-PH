package com.smilewell.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reference")
public class ReferenceApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/branches")
    public List<Map<String, Object>> getBranches() {
        return jdbcTemplate.queryForList("SELECT branch_id, branch_name FROM branches ORDER BY branch_name");
    }

    @GetMapping("/dentists")
    public List<Map<String, Object>> getDentists() {
        return jdbcTemplate.queryForList("SELECT staff_id, display_name FROM staff WHERE role = 'Dentist' AND is_active = TRUE ORDER BY display_name");
    }

    @GetMapping("/time-slots")
    public List<Map<String, Object>> getTimeSlots() {
        // Formats the TIME column directly to a readable string (e.g. "01:00 PM")
        return jdbcTemplate.queryForList("SELECT DATE_FORMAT(slot_time, '%l:%i %p') as slot_time FROM time_slots ORDER BY slot_time");
    }
}