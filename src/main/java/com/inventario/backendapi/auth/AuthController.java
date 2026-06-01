package com.inventario.backendapi.auth;

import com.inventario.backendapi.dto.LoginRequest;
import com.inventario.backendapi.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // TODO: En producción, reemplazar este mock por la validación real contra AD (LdapAuthService).
        /*
        *
        *
        *
        *
        *
        *
        * */
        // Por ahora, para desarrollo y pruebas, se acepta cualquier usuario/contraseña.
        if (request.getUsername() != null && !request.getUsername().isBlank() &&
                request.getPassword() != null && !request.getPassword().isBlank()) {

            String token = jwtUtil.generarToken(request.getUsername());

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUsername(request.getUsername());

            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body("Credenciales inválidas");
    }
}