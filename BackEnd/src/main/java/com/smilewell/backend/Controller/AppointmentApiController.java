package com.smilewell.backend.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentApiController {

    private final JdbcTemplate jdbcTemplate;

    public AppointmentApiController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * GET /api/v1/appointments/{id}
     * Used by edit-appointment.js to load one appointment record.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAppointmentById(@PathVariable int id) {
        String sql = """
            SELECT
                a.appointment_id AS id,
                a.patient_name AS patientName,
                a.contact_number AS contactNumber,
                a.reason AS `procedure`,
                a.appointment_date AS appointmentDate,
                TIME_FORMAT(a.start_time, '%h:%i %p') AS startTime,
                TIME_FORMAT(a.end_time, '%h:%i %p') AS endTime,
                a.branch_id AS branchId,
                a.status AS status,
                '#097BAC' AS color
            FROM appointments a
            WHERE a.appointment_id = ?
            AND a.status IN (0, 1)
            """;

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, id);

        if (results.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Appointment not found"));
        }

        return ResponseEntity.ok(results.get(0));
    }

    /**
     * GET /api/v1/appointments?date=YYYY-MM-DD&branch=BranchName
     * Used by appointments.js list page.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAppointmentsByDateAndBranch(
            @RequestParam String date,
            @RequestParam String branch
    ) {
        String sql = """
            SELECT
                a.appointment_id AS id,
                a.reason AS `procedure`,
                a.patient_name AS patient,
                TIME_FORMAT(a.start_time, '%H:%i') AS `start`,
                TIME_FORMAT(a.end_time, '%H:%i') AS `end`,
                a.status AS status
            FROM appointments a
            INNER JOIN branches b
                ON a.branch_id = b.branch_id
            WHERE a.appointment_date = ?
            AND b.branch_name = ?
            AND a.status IN (0, 1)
            ORDER BY a.start_time ASC
            """;
        List<Map<String, Object>> appointments =
                jdbcTemplate.queryForList(sql, date, branch);

        return ResponseEntity.ok(appointments);
    }


    /**
     * PUT /api/v1/appointments/{id}
     * Used by edit-appointment.js and new-appointment.js to update an existing appointment.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAppointment(
            @PathVariable int id,
            @RequestBody Map<String, Object> payload
    ) {
        String patientName = String.valueOf(payload.getOrDefault("patientName", "")).trim();
        String contactNumber = String.valueOf(payload.getOrDefault("contactNumber", "")).trim();
        String procedure = String.valueOf(payload.getOrDefault("procedure", "")).trim();
        String appointmentDate = String.valueOf(payload.getOrDefault("appointmentDate", "")).trim();
        String startTimeRaw = String.valueOf(payload.getOrDefault("startTime", "")).trim();
        String endTimeRaw = String.valueOf(payload.getOrDefault("endTime", "")).trim();

        // Include branchId once your edit page JS sends it.
        String branchIdRaw = String.valueOf(payload.getOrDefault("branchId", "")).trim();

        if (patientName.isEmpty() ||
            contactNumber.isEmpty() ||
            procedure.isEmpty() ||
            appointmentDate.isEmpty() ||
            startTimeRaw.isEmpty() ||
            endTimeRaw.isEmpty() ||
            branchIdRaw.isEmpty()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Missing required appointment fields."));
        }

        try {
            java.time.format.DateTimeFormatter timeFormatter =
                    java.time.format.DateTimeFormatter.ofPattern("h:mm a", java.util.Locale.ENGLISH);

            java.sql.Time startTime = java.sql.Time.valueOf(
                    java.time.LocalTime.parse(startTimeRaw, timeFormatter)
            );

            java.sql.Time endTime = java.sql.Time.valueOf(
                    java.time.LocalTime.parse(endTimeRaw, timeFormatter)
            );

            int branchId = Integer.parseInt(branchIdRaw);

            String sql = """
                UPDATE appointments
                SET patient_name = ?,
                    contact_number = ?,
                    reason = ?,
                    appointment_date = ?,
                    start_time = ?,
                    end_time = ?,
                    branch_id = ?,
                    status = 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE appointment_id = ?
                AND status IN (0, 1)
                """;

            int updatedRows = jdbcTemplate.update(
                    sql,
                    patientName,
                    contactNumber,
                    procedure,
                    appointmentDate,
                    startTime,
                    endTime,
                    branchId,
                    id
            );

            if (updatedRows == 0) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Appointment not found."));
            }

            return ResponseEntity.ok(Map.of("message", "Appointment updated successfully."));
        } catch (Exception error) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update appointment.", "error", error.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable int id) {
        String sql = """
            DELETE FROM appointments
            WHERE appointment_id = ?
            """;

        int deletedRows = jdbcTemplate.update(sql, id);

        if (deletedRows == 0) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/v1/appointments/{id}/cancel
     * Soft-cancels an appointment by marking status = 0.
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelAppointment(@PathVariable int id) {
        String sql = """
            UPDATE appointments
            SET status = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE appointment_id = ?
            AND status = 1
            """;

        int updatedRows = jdbcTemplate.update(sql, id);

        if (updatedRows == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Appointment not found or already cancelled."));
        }

        return ResponseEntity.ok(Map.of("message", "Appointment cancelled successfully."));
    }

    /**
 * POST /api/v1/appointments
 * Creates a new appointment row.
 */
@PostMapping
public ResponseEntity<Map<String, Object>> createAppointment(
        @RequestBody Map<String, Object> payload
) {
    String patientName = String.valueOf(payload.getOrDefault("patientName", "")).trim();
    String contactNumber = String.valueOf(payload.getOrDefault("contactNumber", "")).trim();
    String procedure = String.valueOf(payload.getOrDefault("procedure", "")).trim();
    String appointmentDate = String.valueOf(payload.getOrDefault("appointmentDate", "")).trim();
    String startTimeRaw = String.valueOf(payload.getOrDefault("startTime", "")).trim();
    String endTimeRaw = String.valueOf(payload.getOrDefault("endTime", "")).trim();
    String branchIdRaw = String.valueOf(payload.getOrDefault("branchId", "")).trim();

    if (patientName.isEmpty() ||
        contactNumber.isEmpty() ||
        procedure.isEmpty() ||
        appointmentDate.isEmpty() ||
        startTimeRaw.isEmpty() ||
        endTimeRaw.isEmpty() ||
        branchIdRaw.isEmpty()) {

        return ResponseEntity.badRequest()
                .body(Map.of("message", "Missing required appointment fields."));
    }

    try {
        java.time.format.DateTimeFormatter timeFormatter =
                java.time.format.DateTimeFormatter.ofPattern("h:mm a", java.util.Locale.ENGLISH);

        java.sql.Time startTime = java.sql.Time.valueOf(
                java.time.LocalTime.parse(startTimeRaw, timeFormatter)
        );

        java.sql.Time endTime = java.sql.Time.valueOf(
                java.time.LocalTime.parse(endTimeRaw, timeFormatter)
        );

        int branchId = Integer.parseInt(branchIdRaw);

        String sql = """
            INSERT INTO appointments (
                patient_name,
                contact_number,
                appointment_date,
                start_time,
                end_time,
                reason,
                created_at,
                updated_at,
                status,
                branch_id
            )
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?)
            """;

        int insertedRows = jdbcTemplate.update(
                sql,
                patientName,
                contactNumber,
                appointmentDate,
                startTime,
                endTime,
                procedure,
                branchId
        );

        if (insertedRows == 0) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to create appointment."));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Appointment created successfully."));
    } catch (Exception error) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to create appointment.", "error", error.getMessage()));
    }
}
} 

