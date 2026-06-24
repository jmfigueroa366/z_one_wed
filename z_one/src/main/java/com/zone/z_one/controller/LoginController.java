package com.zone.z_one.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api")
public class LoginController {

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Z-ONE API funcionando correctamente!");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest req) {
        if (req.getUsuario().equals("admin") && req.getPassword().equals("1234")) {
            return ResponseEntity.ok("LOGIN_OK");
        }
        return ResponseEntity.status(401).body("Credenciales incorrectas");
    }

    public static class LoginRequest {
        private String usuario;
        private String password;
        public String getUsuario() { return usuario; }
        public void setUsuario(String usuario) { this.usuario = usuario; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
