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
@RequestMapping("/api/v1/patients")
public class PatientApiController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. Fetches the summary list for the Records page
    @GetMapping("/list")
    public List<Map<String, Object>> getAllPatients() {
        String sql = "SELECT p.patient_id, p.first_name, p.last_name, " +
                     "DATE_FORMAT(MAX(v.created_at), '%m/%d/%Y') as last_visit " +
                     "FROM patients p " +
                     "LEFT JOIN visits v ON p.patient_id = v.patient_id " +
                     "GROUP BY p.patient_id, p.first_name, p.last_name " +
                     "ORDER BY p.last_name ASC";
        return jdbcTemplate.queryForList(sql);
    }

    // 2. Fetches specific details for a SINGLE patient profile
    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientProfile(@PathVariable("id") int patientId) {
        try {
            String sql = "SELECT p.patient_id, p.first_name, p.last_name, p.contact_number, p.home_address, " +
                         "p.sex, DATE_FORMAT(p.birthday, '%m/%d/%Y') as birthday, " +
                         "TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) AS age, p.blood_type, " +
                         "pr.insurance_provider, " +
                         "DATE_FORMAT(MIN(v.created_at), '%m/%d/%Y') as first_visit, " +
                         "DATE_FORMAT(MAX(v.created_at), '%m/%d/%Y') as last_visit, " +
                         "b.branch_name as last_branch " +
                         "FROM patients p " +
                         "LEFT JOIN patient_relations pr ON p.patient_id = pr.patient_id " +
                         "LEFT JOIN visits v ON p.patient_id = v.patient_id " +
                         "LEFT JOIN branches b ON v.branch_id = b.branch_id " +
                         "WHERE p.patient_id = ? " +
                         "GROUP BY p.patient_id, pr.insurance_provider, b.branch_name LIMIT 1";

            Map<String, Object> patient = jdbcTemplate.queryForMap(sql, patientId);
            return ResponseEntity.ok(patient);

        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return ResponseEntity.status(404).body(Map.of("error", "Patient not found"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Database error"));
        }
    }

    // 3. Handles the full 6-page registration payload
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> registerNewPatient(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> personal = (Map<String, Object>) payload.get("personal");
            Map<String, Object> related = (Map<String, Object>) payload.get("relatedInfo");
            Map<String, Object> habits = (Map<String, Object>) payload.get("habits");
            Map<String, Object> allergies = (Map<String, Object>) payload.get("allergies");
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) payload.get("conditions");

            if (personal == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Personal details missing"));
            }

            String pSex = sanitizeSex((String) personal.get("sex"));
            String rSex = (related != null) ? sanitizeSex((String) related.get("sex")) : null;

            // Insert Core Patient
            KeyHolder keyHolder = new GeneratedKeyHolder();
            String patientSql = "INSERT INTO patients (first_name, middle_name, last_name, contact_number, email, birthday, sex, blood_type, valid_id_number, home_address, occupation, religion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(patientSql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, (String) personal.get("firstName"));
                ps.setString(2, (String) personal.get("middleName"));
                ps.setString(3, (String) personal.get("lastName"));
                ps.setString(4, (String) personal.get("contact"));
                ps.setString(5, (String) personal.get("email"));
                ps.setString(6, (String) personal.get("birthday"));
                ps.setString(7, pSex); 
                ps.setString(8, (String) personal.get("bloodType"));
                ps.setString(9, (String) personal.get("validId"));
                ps.setString(10, (String) personal.get("address"));
                ps.setString(11, (String) personal.get("occupation"));
                ps.setString(12, (String) personal.get("religion"));
                return ps;
            }, keyHolder);

            Number key = keyHolder.getKey();
            if (key == null) throw new RuntimeException("Generated ID not found");
            int patientId = key.intValue();

            // Insert Related Info
            if (related != null && related.get("firstName") != null && !((String)related.get("firstName")).isEmpty()) {
                String relSql = "INSERT INTO patient_relations (patient_id, relationship_type, first_name, middle_name, last_name, contact_number, email, birthday, sex, home_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(relSql, 
                    patientId, 
                    related.get("relation") != null ? related.get("relation") : "Other",
                    related.get("firstName"), 
                    related.get("middleName"), 
                    related.get("lastName"), 
                    related.get("contact"), 
                    related.get("email"), 
                    related.get("birthday"), 
                    rSex, 
                    related.get("address")
                );
            }

            // Insert Health Habits
            if (habits != null) {
                String habitsSql = "INSERT INTO patient_health_habits (patient_id, in_good_health, smoker, alcohol, illicit_drugs, pregnant, birth_control, nursing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(habitsSql, patientId, 
                    "yes".equalsIgnoreCase((String) habits.get("goodHealth")),
                    "yes".equalsIgnoreCase((String) habits.get("smoker")),
                    "yes".equalsIgnoreCase((String) habits.get("alcohol")),
                    "yes".equalsIgnoreCase((String) habits.get("drugs")),
                    "yes".equalsIgnoreCase((String) habits.get("pregnant")),
                    "yes".equalsIgnoreCase((String) habits.get("birthControl")),
                    "yes".equalsIgnoreCase((String) habits.get("nursing"))
                );
            }

            // Insert Allergies
            if (allergies != null) {
                String allergySql = "INSERT INTO patient_allergies (patient_id, penicillin_antibiotics, local_anesthetics, aspirin, latex, sulfa_drugs, others_notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(allergySql, patientId,
                    "yes".equalsIgnoreCase((String) allergies.get("penicillin")),
                    "yes".equalsIgnoreCase((String) allergies.get("anesthetics")),
                    "yes".equalsIgnoreCase((String) allergies.get("aspirin")),
                    "yes".equalsIgnoreCase((String) allergies.get("latex")),
                    "yes".equalsIgnoreCase((String) allergies.get("sulfa")),
                    allergies.get("others")
                );
            }

            // Insert Conditions
            if (conditions != null) {
                String condSql = "INSERT INTO patient_conditions (patient_id, condition_category, has_condition, condition_notes) VALUES (?, ?, ?, ?)";
                String[] categories = {
                    "Cardiovascular & Blood Conditions", "Respiratory & Lung Health", 
                    "Neurological & Mental Health", "Metabolic & Endocrine Systems", 
                    "Gastrointestinal & Hepatic (Liver) Health", "Infectious Diseases & Immune System", 
                    "Musculoskeletal & Surgical", "Oncology & Specialized Treatments", "Miscellaneous"
                };

                for (Map<String, Object> cond : conditions) {
                    Object indexObj = cond.get("index");
                    int idx = (indexObj instanceof Number) ? ((Number) indexObj).intValue() - 1 : 0;

                    if (idx >= 0 && idx < categories.length) {
                        jdbcTemplate.update(condSql, 
                            patientId, 
                            categories[idx], 
                            cond.get("hasCondition") != null ? (Boolean) cond.get("hasCondition") : false, 
                            cond.get("notes")
                        );
                    }
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "patientId", patientId));

        } catch (Exception e) {
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