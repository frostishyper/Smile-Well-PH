package com.smilewell.backend.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// For Clean URL and Mappings
 
@Controller
public class FrontendController {

    // This catches traffic going to the absolute root the site EX:(http://localhost:3000/)
    // (http://localhost:3000/)
    @GetMapping("/")
    public String serveIndex() {
        return "forward:/Pages/index.html";
    }
    
   // Add Mappings To New Pages
}