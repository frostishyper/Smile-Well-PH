package com.smilewell.backend.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient-medical-info")
public class PatientMedicalInfoApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. Fetches Health & Habits for a specific patient
    @GetMapping("/{patientId}/health-habits")
    public ResponseEntity<?> getPatientHealthHabits(@PathVariable("patientId") int patientId) {
        try {
            String sql =
                "SELECT " +
                "    p.patient_id, " +
                "    p.first_name AS patient_first_name, " +
                "    p.last_name AS patient_last_name, " +
                "    phh.in_good_health, " +
                "    phh.smoker, " +
                "    phh.alcohol, " +
                "    phh.illicit_drugs, " +
                "    phh.pregnant, " +
                "    phh.birth_control, " +
                "    phh.nursing " +
                "FROM patients p " +
                "LEFT JOIN patient_health_habits phh ON p.patient_id = phh.patient_id " +
                "WHERE p.patient_id = ? " +
                "LIMIT 1";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, patientId);

            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Patient not found"));
            }

            return ResponseEntity.ok(rows.get(0));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Database error"));
        }
    }

    // 2. Updates or creates Health & Habits for a specific patient
    @PutMapping("/{patientId}/health-habits")
    public ResponseEntity<?> updatePatientHealthHabits(
            @PathVariable("patientId") int patientId,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM patient_health_habits WHERE patient_id = ?",
                Integer.class,
                patientId
            );

            boolean inGoodHealth = toBoolean(payload.get("in_good_health"));
            boolean smoker = toBoolean(payload.get("smoker"));
            boolean alcohol = toBoolean(payload.get("alcohol"));
            boolean illicitDrugs = toBoolean(payload.get("illicit_drugs"));
            boolean pregnant = toBoolean(payload.get("pregnant"));
            boolean birthControl = toBoolean(payload.get("birth_control"));
            boolean nursing = toBoolean(payload.get("nursing"));

            if (count != null && count > 0) {
                String updateSql =
                    "UPDATE patient_health_habits SET " +
                    "in_good_health = ?, " +
                    "smoker = ?, " +
                    "alcohol = ?, " +
                    "illicit_drugs = ?, " +
                    "pregnant = ?, " +
                    "birth_control = ?, " +
                    "nursing = ?, " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE patient_id = ?";

                jdbcTemplate.update(
                    updateSql,
                    inGoodHealth,
                    smoker,
                    alcohol,
                    illicitDrugs,
                    pregnant,
                    birthControl,
                    nursing,
                    patientId
                );
            } else {
                String insertSql =
                    "INSERT INTO patient_health_habits (" +
                    "patient_id, in_good_health, smoker, alcohol, illicit_drugs, pregnant, birth_control, nursing, created_at, updated_at" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

                jdbcTemplate.update(
                    insertSql,
                    patientId,
                    inGoodHealth,
                    smoker,
                    alcohol,
                    illicitDrugs,
                    pregnant,
                    birthControl,
                    nursing
                );
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Patient health habits updated successfully",
                "patientId", patientId
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method to convert various input types to boolean
    private boolean toBoolean(Object raw) {
        if (raw == null) return false;
        if (raw instanceof Boolean) return (Boolean) raw;
        if (raw instanceof Number) return ((Number) raw).intValue() == 1;

        String value = raw.toString().trim().toLowerCase();
        return value.equals("1") || value.equals("true") || value.equals("yes");
    }

    // 3. Fetches Allergies for a specific patient
    @GetMapping("/{patientId}/allergies")
    public ResponseEntity<?> getPatientAllergies(@PathVariable("patientId") int patientId) {
        try {
            String sql =
                "SELECT " +
                "    p.patient_id, " +
                "    p.first_name AS patient_first_name, " +
                "    p.last_name AS patient_last_name, " +
                "    pa.penicillin_antibiotics, " +
                "    pa.local_anesthetics, " +
                "    pa.aspirin, " +
                "    pa.latex, " +
                "    pa.sulfa_drugs, " +
                "    pa.others_notes " +
                "FROM patients p " +
                "LEFT JOIN patient_allergies pa ON p.patient_id = pa.patient_id " +
                "WHERE p.patient_id = ? " +
                "LIMIT 1";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, patientId);

            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Patient not found"));
            }

            return ResponseEntity.ok(rows.get(0));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Database error"));
        }
    }

    // 4. Updates or creates Allergies for a specific patient
    @PutMapping("/{patientId}/allergies")
    public ResponseEntity<?> updatePatientAllergies(
            @PathVariable("patientId") int patientId,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM patient_allergies WHERE patient_id = ?",
                Integer.class,
                patientId
            );

            boolean penicillinAntibiotics = toBoolean(payload.get("penicillin_antibiotics"));
            boolean localAnesthetics = toBoolean(payload.get("local_anesthetics"));
            boolean aspirin = toBoolean(payload.get("aspirin"));
            boolean latex = toBoolean(payload.get("latex"));
            boolean sulfaDrugs = toBoolean(payload.get("sulfa_drugs"));
            String othersNotes = payload.get("others_notes") != null ? payload.get("others_notes").toString() : "";

            if (count != null && count > 0) {
                String updateSql =
                    "UPDATE patient_allergies SET " +
                    "penicillin_antibiotics = ?, " +
                    "local_anesthetics = ?, " +
                    "aspirin = ?, " +
                    "latex = ?, " +
                    "sulfa_drugs = ?, " +
                    "others_notes = ?, " +
                    "updated_at = CURRENT_TIMESTAMP " +
                    "WHERE patient_id = ?";

                jdbcTemplate.update(
                    updateSql,
                    penicillinAntibiotics,
                    localAnesthetics,
                    aspirin,
                    latex,
                    sulfaDrugs,
                    othersNotes,
                    patientId
                );
            } else {
                String insertSql =
                    "INSERT INTO patient_allergies (" +
                    "patient_id, penicillin_antibiotics, local_anesthetics, aspirin, latex, sulfa_drugs, others_notes, created_at, updated_at" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

                jdbcTemplate.update(
                    insertSql,
                    patientId,
                    penicillinAntibiotics,
                    localAnesthetics,
                    aspirin,
                    latex,
                    sulfaDrugs,
                    othersNotes
                );
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Patient allergies updated successfully",
                "patientId", patientId
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 5. Fetches Conditions for a specific patient
    @GetMapping("/{patientId}/conditions")
    public ResponseEntity<?> getPatientConditions(@PathVariable("patientId") int patientId) {
        try {
            String patientSql =
                "SELECT patient_id, first_name AS patient_first_name, last_name AS patient_last_name " +
                "FROM patients WHERE patient_id = ? LIMIT 1";

            List<Map<String, Object>> patientRows = jdbcTemplate.queryForList(patientSql, patientId);

            if (patientRows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Patient not found"));
            }

            String conditionsSql =
                "SELECT " +
                "    condition_id, " +
                "    patient_id, " +
                "    condition_category, " +
                "    has_condition, " +
                "    condition_notes " +
                "FROM patient_conditions " +
                "WHERE patient_id = ? " +
                "ORDER BY condition_id ASC";

            List<Map<String, Object>> conditions = jdbcTemplate.queryForList(conditionsSql, patientId);

            Map<String, Object> response = patientRows.get(0);
            response.put("conditions", conditions);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Database error"));
        }
    }

    // 6. Updates Conditions for a specific patient
    @PutMapping("/{patientId}/conditions")
    public ResponseEntity<?> updatePatientConditions(
            @PathVariable("patientId") int patientId,
            @RequestBody Map<String, Object> payload) {
        try {
            Object conditionsObj = payload.get("conditions");

            if (!(conditionsObj instanceof List<?> conditionsList)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid conditions payload"));
            }

            jdbcTemplate.update("DELETE FROM patient_conditions WHERE patient_id = ?", patientId);

            String insertSql =
                "INSERT INTO patient_conditions (" +
                "patient_id, condition_category, has_condition, condition_notes, created_at, updated_at" +
                ") VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

            for (Object item : conditionsList) {
                if (!(item instanceof Map<?, ?> rawMap)) continue;

                String category = rawMap.get("condition_category") != null
                    ? rawMap.get("condition_category").toString()
                    : "";

                boolean hasCondition = toBoolean(rawMap.get("has_condition"));

                String notes = rawMap.get("condition_notes") != null
                    ? rawMap.get("condition_notes").toString()
                    : "";

                jdbcTemplate.update(
                    insertSql,
                    patientId,
                    category,
                    hasCondition,
                    notes
                );
            }

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Patient conditions updated successfully",
                "patientId", patientId
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}