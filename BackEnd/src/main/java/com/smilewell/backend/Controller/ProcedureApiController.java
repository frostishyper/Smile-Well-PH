package com.smilewell.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*") // Critical for your JS to connect
public class ProcedureApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * POST: Save a new Visit and its multiple Procedures
     * This uses Transactional to ensure if the procedures fail, the visit isn't saved alone.
     */
    @PostMapping("/visits")
    @Transactional
    public ResponseEntity<?> createVisit(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Extract Visit Data
            String branch = (String) payload.get("branch");
            String date = (String) payload.get("visitDate");
            String notes = (String) payload.get("dentistNotes");
            String timeRange = payload.get("startTime") + " - " + payload.get("endTime");
            int patientId = 1; // You can dynamicize this later from state.patientId

            // 2. Insert Visit and Capture the auto-generated ID
            KeyHolder keyHolder = new GeneratedKeyHolder();
            String visitSql = "INSERT INTO visits (patient_id, branch, visit_date, time_range, notes) VALUES (?, ?, ?, ?, ?)";
            
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(visitSql, Statement.RETURN_GENERATED_KEYS);
                ps.setInt(1, patientId);
                ps.setString(2, branch);
                ps.setString(3, date);
                ps.setString(4, timeRange);
                ps.setString(5, notes);
                return ps;
            }, keyHolder);

            Number visitId = keyHolder.getKey();

            // 3. Insert all procedures (Operations) linked to this visit
            List<Map<String, Object>> procedures = (List<Map<String, Object>>) payload.get("procedures");
            String opSql = "INSERT INTO operations (visit_id, name, bill) VALUES (?, ?, ?)";

            for (Map<String, Object> proc : procedures) {
                jdbcTemplate.update(opSql, visitId, proc.get("name"), proc.get("amount"));
            }

            return ResponseEntity.ok().body(Map.of("message", "Procedure saved successfully", "id", visitId));

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error saving procedure: " + e.getMessage());
        }
    }

    /**
     * GET: Fetch all visits for the Records Page
     */
    @GetMapping("/visits")
    public List<Map<String, Object>> getAllVisits() {
        String sql = "SELECT * FROM visits ORDER BY visit_date DESC";
        List<Map<String, Object>> visits = jdbcTemplate.queryForList(sql);
        
        // Attach procedures to each visit
        for (Map<String, Object> visit : visits) {
            String opSql = "SELECT name, bill FROM operations WHERE visit_id = ?";
            visit.put("operations", jdbcTemplate.queryForList(opSql, visit.get("id")));
        }
        return visits;
    }

    /**
     * GET: Fetch all visits for a specific patient
     * Used by patient-procedures.js to show a patient's history.
     */
    @GetMapping("/patients/{patientId}/visits")
    public ResponseEntity<List<Map<String, Object>>> getVisitsByPatient(@PathVariable int patientId) {
        try {
            // 1. Get visits for this specific patient
            String sql = "SELECT id, branch, visit_date, time_range, notes FROM visits WHERE patient_id = ? ORDER BY visit_date ASC";
            List<Map<String, Object>> visits = jdbcTemplate.queryForList(sql, patientId);
            
            // 2. Attach procedures (operations) to each visit
            for (Map<String, Object> visit : visits) {
                String opSql = "SELECT name, bill FROM operations WHERE visit_id = ?";
                visit.put("operations", jdbcTemplate.queryForList(opSql, visit.get("id")));
            }
            
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * GET: Fetch basic patient info for the sidebar
     */
    @GetMapping("/patients/{patientId}")
    public ResponseEntity<Map<String, Object>> getPatientInfo(@PathVariable int patientId) {
        try {
            String sql = "SELECT id, name, avatar_url FROM patients WHERE id = ?";
            Map<String, Object> patient = jdbcTemplate.queryForMap(sql, patientId);
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            return ResponseEntity.status(404).build(); // Patient not found
        }
    }
}