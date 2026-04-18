package com.smilewell.backend.Config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) 
            .authorizeHttpRequests(auth -> auth
                // 1. Allow static resources and the root login page
                .requestMatchers("/", "/Pages/index.html", "/CSS/**", "/JS/**", "/Media/**").permitAll()
                // 2. Everything else is completely locked down
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                // If an unauthenticated user tries to hit a protected route, send them here:
                .loginPage("/") 
                // The API endpoint your JavaScript will POST to:
                .loginProcessingUrl("/api/v1/login") 
                // On Success: Don't redirect, just tell the JS it worked so JS can handle the redirect
                .successHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\": \"Login successful!\"}");
                })
                // On Fail: Tell the JS it failed so you can show an error message
                .failureHandler((request, response, exception) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\": \"Invalid credentials!\"}");
                })
            )
            .logout(logout -> logout
                .logoutUrl("/api/v1/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                })
                .deleteCookies("JSESSIONID")
            );
        
        return http.build();
    }
}