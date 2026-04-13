package com.smilewell.backend.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM staff WHERE display_name = ?", username);
            
            return User.builder()
                    .username((String) user.get("display_name"))
                    .password((String) user.get("password_hash"))
                    .roles((String) user.get("role"))
                    .build();
                    
        } catch (EmptyResultDataAccessException e) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
    }
}