package com.smilewell.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // Runs Once On Startup
    @Bean
    public CommandLineRunner initDatabase(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        return args -> {
            try {
                // DB Connection Status
                jdbcTemplate.execute("SELECT 1");
                System.out.println("=================================================");
                System.out.println("DATABASE CONNECTION ESTABLISHED SUCCESSFULLY!");
                System.out.println("=================================================");

                // Seeder Logic
                String targetEmail = "frostishyper@smilewell.com";
                
                // Check if the account already exists to prevent duplicate entries on restart
                Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM staff WHERE email = ?", 
                    Integer.class, 
                    targetEmail
                );

                if (count != null && count == 0) {
                    System.out.println("Seeding default Dentist account...");

                    // Hash the password
                    String plainTextPassword = "Icepop";
                    String hashedPassword = passwordEncoder.encode(plainTextPassword);

                    // Insert the dummy record
                    String insertSql = "INSERT INTO staff (role, display_name, password_hash, first_name, last_name, email, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    
                    jdbcTemplate.update(
                        insertSql, 
                        "Dentist",               // role
                        "Frostishyper",          // display_name
                        hashedPassword,          // password_hash
                        "Frost",                 // first_name (dummy)
                        "Hyper",                 // last_name (dummy)
                        targetEmail,             // email
                        true                     // is_active
                    );

                    System.out.println("✅ Default account created! Email: " + targetEmail + " | Password: " + plainTextPassword);
                } else {
                    System.out.println("⚡ Default account already exists. Skipping seed.");
                }

            } catch (Exception e) {
                System.out.println("DATABASE INITIALIZATION FAILED: " + e.getMessage());
            }
        };
    }
}