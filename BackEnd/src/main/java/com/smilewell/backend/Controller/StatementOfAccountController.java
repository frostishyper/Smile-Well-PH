package com.smilewell.backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/statements")
public class StatementOfAccountController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. Get the latest statement for a patient (Calculates SUM from procedures)
    @GetMapping("/{patientId}")
    public ResponseEntity<?> getStatement(@PathVariable int patientId) {
        try {
            String sql = """
                SELECT
                    s.statement_id,
                    s.patient_id,
                    COALESCE(SUM(p.procedure_cost), 0) AS current_balance,
                    DATE_FORMAT(s.created_at, '%m/%d/%Y') AS created_at,
                    DATE_FORMAT(COALESCE(MAX(p.updated_at), s.updated_at, s.created_at), '%m/%d/%Y %H:%i') AS updated_at,
                    CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name
                FROM account_statements s
                JOIN patients pat ON s.patient_id = pat.patient_id
                LEFT JOIN procedures p ON s.statement_id = p.statement_id
                WHERE s.patient_id = ?
                GROUP BY s.statement_id, s.patient_id, s.created_at, s.updated_at, pat.first_name, pat.last_name
                ORDER BY s.statement_id DESC
                LIMIT 1
            """;

            Map<String, Object> result = jdbcTemplate.queryForMap(sql, patientId);
            return ResponseEntity.ok(result);

        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "No statement found for this patient"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 2. Returns individual procedures linked to the statement
    @GetMapping("/{patientId}/items")
    public ResponseEntity<?> getStatementItems(@PathVariable int patientId) {
        try {
            String sql = """
                SELECT
                    p.procedure_id AS item_id,
                    p.statement_id AS statement_id,
                    p.procedure_name AS description,
                    p.procedure_cost AS amount,
                    DATE_FORMAT(p.created_at, '%m/%d/%Y') AS created_at
                FROM procedures p
                JOIN account_statements s ON p.statement_id = s.statement_id
                WHERE s.patient_id = ?
                ORDER BY p.created_at DESC
            """;

            List<Map<String, Object>> items = jdbcTemplate.queryForList(sql, patientId);
            return ResponseEntity.ok(items);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // 3. Create a new statement (Remains the same structure)
    @PostMapping
    @Transactional
    public ResponseEntity<?> createStatement(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("patientId")) {
                return ResponseEntity.badRequest().body(Map.of("error", "patientId is required"));
            }

            int patientId = ((Number) payload.get("patientId")).intValue();

            String existingSql = "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1";
            List<Integer> existing = jdbcTemplate.queryForList(existingSql, Integer.class, patientId);
            
            if (!existing.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "exists", "statementId", existing.get(0), "patientId", patientId));
            }

            String insertSql = "INSERT INTO account_statements (patient_id, current_balance, created_at, updated_at) VALUES (?, 0, NOW(), NOW())";

            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
                ps.setInt(1, patientId);
                return ps;
            }, keyHolder);

            return ResponseEntity.ok(Map.of("status", "success", "statementId", keyHolder.getKey().intValue(), "patientId", patientId));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 4. Update balance (Now inserts a 'Payment' row into procedures to affect the sum)
    @PutMapping("/{patientId}")
@Transactional
public ResponseEntity<?> updateBalance(@PathVariable int patientId, @RequestBody Map<String, Object> payload) {
    try {
        double paymentAmount = ((Number) payload.get("currentBalance")).doubleValue();
        String note = payload.getOrDefault("description", "Patient Payment").toString();

        // 1. Get current statement ID
        String getSid = "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1";
        Integer sid = jdbcTemplate.queryForObject(getSid, Integer.class, patientId);

        // 2. Record the payment in the payments table
        String insertPayment = """
            INSERT INTO payments (patient_id, statement_id, payment_amount, payment_note, created_at)
            VALUES (?, ?, ?, ?, NOW())
        """;
        jdbcTemplate.update(insertPayment, patientId, sid, paymentAmount, note);

        // 3. Logic: Allocate payment to procedures
        // We fetch procedures ordered by oldest first (FIFO - First In, First Out)
        String fetchProcedures = "SELECT procedure_id, procedure_cost FROM procedures WHERE patient_id = ? AND procedure_cost > 0 ORDER BY created_at ASC";
        List<Map<String, Object>> unpaidProcedures = jdbcTemplate.queryForList(fetchProcedures, patientId);

        double remainingPayment = paymentAmount;

        for (Map<String, Object> proc : unpaidProcedures) {
            if (remainingPayment <= 0) break;

            int procId = (int) proc.get("procedure_id");
            double procCost = ((Number) proc.get("procedure_cost")).doubleValue();

            if (remainingPayment >= procCost) {
                // Payment covers the whole procedure
                remainingPayment -= procCost;
                // Option A: Delete it so it's "Gone"
                jdbcTemplate.update("DELETE FROM procedures WHERE procedure_id = ?", procId);
                // Option B: If you prefer keeping it at 0, use: 
                // jdbcTemplate.update("UPDATE procedures SET procedure_cost = 0 WHERE procedure_id = ?", procId);
            } else {
                // Payment covers part of the procedure
                jdbcTemplate.update("UPDATE procedures SET procedure_cost = procedure_cost - ? WHERE procedure_id = ?", 
                                    remainingPayment, procId);
                remainingPayment = 0;
            }
        }

        return ResponseEntity.ok(Map.of("status", "success", "remainingCredit", remainingPayment));

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}

    // 5. Delete statement
    @DeleteMapping("/{patientId}")
    @Transactional
    public ResponseEntity<?> deleteStatement(@PathVariable int patientId) {
        try {
            String sql = "DELETE FROM account_statements WHERE patient_id = ?";
            int rows = jdbcTemplate.update(sql, patientId);
            return rows == 0 
                ? ResponseEntity.status(404).body(Map.of("error", "No statement found")) 
                : ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}