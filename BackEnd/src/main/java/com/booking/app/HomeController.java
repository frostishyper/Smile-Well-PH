package com.booking.app;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("appName", "Booking App");
        model.addAttribute("status", "Server is running");
        return "index";
    }

    @GetMapping("/ping")
    public String ping() {
        return "ping";
    }
}