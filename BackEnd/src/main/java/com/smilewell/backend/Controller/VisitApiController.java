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
@RequestMapping("/api/v1/dental-visits")
public class VisitApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientVisits(@PathVariable("patientId") int patientId) {
        try {
            String visitSql = "SELECT v.visit_id, v.visit_notes, DATE_FORMAT(v.created_at, '%m/%d/%Y') as visit_date, " +
                              "s.display_name as dentist_name, b.branch_name " +
                              "FROM visits v " +
                              "JOIN staff s ON v.staff_id = s.staff_id " +
                              "JOIN branches b ON v.branch_id = b.branch_id " +
                              "WHERE v.patient_id = ? ORDER BY v.created_at DESC";
            
            List<Map<String, Object>> visits = jdbcTemplate.queryForList(visitSql, patientId);
            String procSql = "SELECT procedure_id, procedure_name, procedure_cost FROM procedures WHERE visit_id = ?";
            
            for (Map<String, Object> visit : visits) {
                int visitId = ((Number) visit.get("visit_id")).intValue();
                visit.put("procedures", jdbcTemplate.queryForList(procSql, visitId));
            }
            return ResponseEntity.ok(visits);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{visitId}")
    public ResponseEntity<?> getSingleVisit(@PathVariable("visitId") int visitId) {
        try {
            String visitSql = "SELECT v.visit_id, v.patient_id, v.branch_id, v.staff_id, v.visit_notes, " +
                              "DATE_FORMAT(v.created_at, '%Y-%m-%d') as visit_date, " +
                              "p.first_name, p.last_name " +
                              "FROM visits v " +
                              "JOIN patients p ON v.patient_id = p.patient_id " +
                              "WHERE v.visit_id = ?";
            
            Map<String, Object> visit = jdbcTemplate.queryForMap(visitSql, visitId);
            String procSql = "SELECT procedure_id, procedure_name, procedure_cost FROM procedures WHERE visit_id = ?";
            visit.put("procedures", jdbcTemplate.queryForList(procSql, visitId));

            return ResponseEntity.ok(visit);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("")
    @Transactional
    public ResponseEntity<?> createVisit(@RequestBody Map<String, Object> payload) {
        try {
            Number patientId = (Number) payload.get("patientId");
            Number branchId = (Number) payload.get("branchId");
            Number staffId = (Number) payload.get("staffId");
            String visitNotes = (String) payload.get("visitNotes");

            String insertVisitSql = "INSERT INTO visits (patient_id, branch_id, staff_id, visit_notes) VALUES (?, ?, ?, ?)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(insertVisitSql, Statement.RETURN_GENERATED_KEYS);
                ps.setInt(1, patientId.intValue());
                ps.setInt(2, branchId.intValue());
                ps.setInt(3, staffId.intValue());
                ps.setString(4, visitNotes);
                return ps;
            }, keyHolder);

            int visitId = keyHolder.getKey().intValue();

            List<Map<String, Object>> procedures = (List<Map<String, Object>>) payload.get("procedures");
            if (procedures != null && !procedures.isEmpty()) {
                
                Integer statementId;
                try {
                    statementId = jdbcTemplate.queryForObject(
                        "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1", 
                        Integer.class, patientId.intValue()
                    );
                } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                    jdbcTemplate.update("INSERT INTO account_statements (patient_id, current_balance) VALUES (?, 0.00)", patientId.intValue());
                    statementId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                }
                
                String insertProcSql = "INSERT INTO procedures (visit_id, patient_id, statement_id, procedure_name, procedure_cost) VALUES (?, ?, ?, ?, ?)";
                for (Map<String, Object> p : procedures) {
                    jdbcTemplate.update(insertProcSql, visitId, patientId.intValue(), statementId, p.get("name"), p.get("amount"));
                }
            }
            return ResponseEntity.ok(Map.of("status", "success", "visitId", visitId));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{visitId}")
    @Transactional
    public ResponseEntity<?> updateVisit(@PathVariable("visitId") int visitId, @RequestBody Map<String, Object> payload) {
        try {
            Number branchId = (Number) payload.get("branchId");
            Number staffId = (Number) payload.get("staffId");
            Number patientId = (Number) payload.get("patientId");
            String visitNotes = (String) payload.get("visitNotes");

            String updateVisitSql = "UPDATE visits SET branch_id = ?, staff_id = ?, visit_notes = ? WHERE visit_id = ?";
            jdbcTemplate.update(updateVisitSql, branchId, staffId, visitNotes, visitId);

            jdbcTemplate.update("DELETE FROM procedures WHERE visit_id = ?", visitId);

            List<Map<String, Object>> procedures = (List<Map<String, Object>>) payload.get("procedures");
            if (procedures != null && !procedures.isEmpty()) {
                
                Integer statementId;
                try {
                    statementId = jdbcTemplate.queryForObject(
                        "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1", 
                        Integer.class, patientId.intValue()
                    );
                } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                    jdbcTemplate.update("INSERT INTO account_statements (patient_id, current_balance) VALUES (?, 0.00)", patientId.intValue());
                    statementId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
                }
                
                String insertProcSql = "INSERT INTO procedures (visit_id, patient_id, statement_id, procedure_name, procedure_cost) VALUES (?, ?, ?, ?, ?)";
                for (Map<String, Object> p : procedures) {
                    jdbcTemplate.update(insertProcSql, visitId, patientId.intValue(), statementId, p.get("name"), p.get("amount"));
                }
            }
            return ResponseEntity.ok(Map.of("status", "success"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}