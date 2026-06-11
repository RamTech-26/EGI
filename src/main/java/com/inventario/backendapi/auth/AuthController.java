package com.inventario.backendapi.auth;

import com.inventario.backendapi.dto.LoginRequest;
import com.inventario.backendapi.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private LdapAuthService ldapAuthService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Validar credenciales contra AD vía LDAP
        if (!ldapAuthService.autenticar(request.getUsername(), request.getPassword())) {
            return ResponseEntity.status(401).body("Credenciales inválidas");
        }

        // Obtener grupos del usuario desde AD
        List<String> gruposAD = ldapAuthService.obtenerGrupos(request.getUsername());

        // Convertir grupos AD a roles de aplicación
        List<String> roles = ldapAuthService.convertirGruposARoles(gruposAD);

        // Generar token JWT con username y roles
        String token = jwtUtil.generarToken(request.getUsername(), roles);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUsername(request.getUsername());

        return ResponseEntity.ok(response);
    }
}