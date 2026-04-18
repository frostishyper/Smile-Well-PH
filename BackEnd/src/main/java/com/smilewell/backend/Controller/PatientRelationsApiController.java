package com.smilewell.backend.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient-relations")
public class PatientRelationsApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. Fetches Related Info for a specific patient
    @GetMapping("/{patientId}")
    public ResponseEntity<?> getPatientRelatedInfo(@PathVariable("patientId") int patientId) {
        try {
            String sql =
                "SELECT " +
                "    pr.relation_id, " +
                "    pr.patient_id, " +
                "    pr.relationship_type, " +
                "    pr.first_name, " +
                "    pr.middle_name, " +
                "    pr.last_name, " +
                "    pr.contact_number, " +
                "    pr.email, " +
                "    DATE_FORMAT(pr.birthday, '%Y-%m-%d') AS birthday, " +
                "    pr.home_address, " +
                "    pr.sex, " +
                "    pr.reference_source, " +
                "    pr.insurance_provider, " +
                "    p.first_name AS patient_first_name, " +
                "    p.last_name AS patient_last_name " +
                "FROM patients p " +
                "LEFT JOIN patient_relations pr ON p.patient_id = pr.patient_id " +
                "WHERE p.patient_id = ? " +
                "LIMIT 1";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, patientId);

            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Patient not found"));
            }

            Map<String, Object> relation = rows.get(0);
            return ResponseEntity.ok(relation);

        } catch (DataAccessException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Database error"));
        }
    }

    // 2. Updates or creates Related Info for a specific patient
    @PutMapping("/{patientId}")
    public ResponseEntity<?> updatePatientRelatedInfo(
            @PathVariable("patientId") int patientId,
            @RequestBody Map<String, Object> payload) {
        try {
            String sex = sanitizeSex((String) payload.get("sex"));

            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM patient_relations WHERE patient_id = ?",
                Integer.class,
                patientId
            );

            if (count != null && count > 0) {
                String updateSql =
                    "UPDATE patient_relations SET " +
                    "relationship_type = ?, " +
                    "first_name = ?, " +
                    "middle_name = ?, " +
                    "last_name = ?, " +
                    "contact_number = ?, " +
                    "email = ?, " +
                    "birthday = ?, " +
                    "home_address = ?, " +
                    "sex = ?, " +
                    "reference_source = ?, " +
                    "insurance_provider = ?, " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE patient_id = ?";

                jdbcTemplate.update(
                    updateSql,
                    (String) payload.get("relationship_type"),
                    (String) payload.get("first_name"),
                    (String) payload.get("middle_name"),
                    (String) payload.get("last_name"),
                    (String) payload.get("contact_number"),
                    (String) payload.get("email"),
                    (String) payload.get("birthday"),
                    (String) payload.get("home_address"),
                    sex,
                    (String) payload.get("reference_source"),
                    (String) payload.get("insurance_provider"),
                    patientId
                );
            } else {
                String insertSql =
                    "INSERT INTO patient_relations (" +
                    "patient_id, relationship_type, first_name, middle_name, last_name, " +
                    "contact_number, email, birthday, home_address, sex, " +
                    "reference_source, insurance_provider, created_at, updated_at" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

                jdbcTemplate.update(
                    insertSql,
                    patientId,
                    (String) payload.get("relationship_type"),
                    (String) payload.get("first_name"),
                    (String) payload.get("middle_name"),
                    (String) payload.get("last_name"),
                    (String) payload.get("contact_number"),
                    (String) payload.get("email"),
                    (String) payload.get("birthday"),
                    (String) payload.get("home_address"),
                    sex,
                    (String) payload.get("reference_source"),
                    (String) payload.get("insurance_provider")
                );
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Patient related info saved successfully",
                "patientId", patientId
            ));

        } catch (DataAccessException e) {
            e.printStackTrace();
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