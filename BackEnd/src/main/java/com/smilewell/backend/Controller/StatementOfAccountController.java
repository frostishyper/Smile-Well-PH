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

    // 1. GET /statements/{patientId}
    // Returns the latest statement with the sum of all UNPAID procedures — used by the SOA page.
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
                LEFT JOIN procedures p ON s.statement_id = p.statement_id AND p.is_paid = false
                WHERE s.patient_id = ?
                GROUP BY s.statement_id, s.patient_id, s.created_at, s.updated_at, pat.first_name, pat.last_name
                ORDER BY s.statement_id DESC
                LIMIT 1
            """;
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, patientId);
            return ResponseEntity.ok(result);
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(404).body(Map.of("error", "No statement found for this patient"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 2. GET /statements/{patientId}/items
    // Returns only UNPAID procedures — used by the SOA page to list current charges.
    @GetMapping("/{patientId}/items")
    public ResponseEntity<?> getStatementItems(@PathVariable int patientId) {
        try {
            String sql = """
                SELECT
                    p.procedure_id  AS item_id,
                    p.procedure_name AS description,
                    p.procedure_cost AS amount,
                    DATE_FORMAT(p.created_at, '%m/%d/%Y') AS created_at
                FROM procedures p
                JOIN account_statements s ON p.statement_id = s.statement_id
                WHERE s.patient_id = ? AND p.is_paid = false
                ORDER BY p.created_at DESC
            """;
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql, patientId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 3. GET /statements/{patientId}/history
    // Returns ALL procedures (paid and unpaid) — used exclusively by the Transaction History page.
   @GetMapping("/{patientId}/history")
public ResponseEntity<?> getFullHistory(@PathVariable int patientId) {
    try {
        String sql = """
            SELECT
                p.procedure_id          AS item_id,
                p.procedure_name        AS description,
                p.procedure_cost        AS amount,
                DATE_FORMAT(p.created_at, '%m/%d/%Y') AS created_at,
                p.is_paid,
                'procedure'             AS type
            FROM procedures p
            JOIN account_statements s ON p.statement_id = s.statement_id
            WHERE s.patient_id = ?

            UNION ALL

            SELECT
                pay.payment_id          AS item_id,
                COALESCE(NULLIF(pay.payment_note, ''), 'Patient Payment') AS description,
                pay.payment_amount      AS amount,
                DATE_FORMAT(pay.created_at, '%m/%d/%Y') AS created_at,
                true                    AS is_paid,
                'payment'               AS type
            FROM payments pay
            WHERE pay.patient_id = ?

            ORDER BY created_at DESC
        """;
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql, patientId, patientId));
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}

    // 4. POST /statements
    // Creates a new statement for a patient if one doesn't already exist.
    @PostMapping
    @Transactional
    public ResponseEntity<?> createStatement(@RequestBody Map<String, Object> payload) {
        try {
            int patientId = ((Number) payload.get("patientId")).intValue();

            List<Integer> existing = jdbcTemplate.queryForList(
                "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1",
                Integer.class, patientId
            );
            if (!existing.isEmpty()) {
                return ResponseEntity.ok(Map.of("status", "exists", "statementId", existing.get(0)));
            }

            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO account_statements (patient_id, current_balance, created_at, updated_at) VALUES (?, 0, NOW(), NOW())",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setInt(1, patientId);
                return ps;
            }, keyHolder);

            return ResponseEntity.ok(Map.of("status", "success", "statementId", keyHolder.getKey().intValue()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 5. PUT /statements/{patientId}
    // Processes a payment: records it, then marks oldest unpaid procedures as paid (FIFO).
    @PutMapping("/{patientId}")
    @Transactional
    public ResponseEntity<?> updateBalance(@PathVariable int patientId, @RequestBody Map<String, Object> payload) {
        try {
            double paymentAmount = ((Number) payload.get("currentBalance")).doubleValue();
            String note          = payload.getOrDefault("description", "Patient Payment").toString();

            Integer sid = jdbcTemplate.queryForObject(
                "SELECT statement_id FROM account_statements WHERE patient_id = ? LIMIT 1",
                Integer.class, patientId
            );

            jdbcTemplate.update(
                "INSERT INTO payments (patient_id, statement_id, payment_amount, payment_note, created_at) VALUES (?, ?, ?, ?, NOW())",
                patientId, sid, paymentAmount, note
            );

            List<Map<String, Object>> unpaidProcedures = jdbcTemplate.queryForList(
                "SELECT procedure_id, procedure_cost FROM procedures WHERE patient_id = ? AND is_paid = false ORDER BY created_at ASC",
                patientId
            );

            double remainingPayment = paymentAmount;
            for (Map<String, Object> proc : unpaidProcedures) {
                if (remainingPayment <= 0) break;

                int    procId   = (int) proc.get("procedure_id");
                double procCost = ((Number) proc.get("procedure_cost")).doubleValue();

                if (remainingPayment >= procCost) {
                    remainingPayment -= procCost;
                jdbcTemplate.update(
                    "UPDATE procedures SET is_paid = true, updated_at = NOW() WHERE procedure_id = ?",
                    procId
                );
                } else {
                    jdbcTemplate.update(
                        "UPDATE procedures SET procedure_cost = procedure_cost - ?, updated_at = NOW() WHERE procedure_id = ?",
                        remainingPayment, procId
                    );
                    remainingPayment = 0;
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "remainingCredit", remainingPayment));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // 6. DELETE /statements/{patientId}
    // Removes a statement record entirely.
    @DeleteMapping("/{patientId}")
    @Transactional
    public ResponseEntity<?> deleteStatement(@PathVariable int patientId) {
        try {
            int rows = jdbcTemplate.update("DELETE FROM account_statements WHERE patient_id = ?", patientId);
            return rows == 0
                ? ResponseEntity.status(404).body(Map.of("error", "Not found"))
                : ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}