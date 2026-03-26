package com.smilewell.backend.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disables CSRF protection for now 
            .csrf(csrf -> csrf.disable()) 
            // Disables Spring Security Stubborn Forced Login
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() 
            );
        
        return http.build();
    }
}