package com.smilewell.backend;

// Import Statements (Add Them Bellow, Create a new Version comment for each update)

// Ver 0.1
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

// Add newer import statements here

// Main Core Code
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // Runs Once On Startup
    @Bean
    public CommandLineRunner testDatabaseConnection(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // DB Connection Status
                jdbcTemplate.execute("SELECT 1");
                System.out.println("=================================================");
                System.out.println("DATABASE CONNECTION ESTABLISHED SUCCESSFULLY!");
                System.out.println("=================================================");
            } catch (Exception e) {
                System.out.println("DATABASE CONNECTION FAILED: " + e.getMessage());
            }
        };
    }
}