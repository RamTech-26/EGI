package com.inventario.backendapi.auth;

import com.inventario.backendapi.dto.LoginRequest;
import com.inventario.backendapi.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.inventario.backendapi.dto.AgregarGrupoRequest;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LdapAuthService ldapAuthService;

    @Autowired
    private LdapAdminService ldapAdminService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(401).body("Credenciales inválidas");
        }

        boolean autenticado = ldapAuthService.autenticar(username, password);

        if (!autenticado) {
            return ResponseEntity.status(401).body("Credenciales inválidas");
        }

        List<String> gruposAD = ldapAuthService.obtenerGrupos(username);
        List<String> roles = ldapAuthService.convertirGruposARoles(gruposAD);

        if (roles.isEmpty()) {
            return ResponseEntity.status(403).body("Usuario sin rol asignado");
        }

        String token = jwtUtil.generarToken(username, roles);
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUsername(username);
        response.setRoles(roles);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/agregar-grupo")
    public ResponseEntity<?> cambiarGrupoUsuario(@RequestBody AgregarGrupoRequest request) {
        try {
            ldapAdminService.cambiarGrupoUsuario(request.getUsername(), request.getGrupo());
            return ResponseEntity.ok("Usuario " + request.getUsername() + " agregado al grupo " + request.getGrupo());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/admin/usuarios")
    public ResponseEntity<?> listarUsuarios() {
        try {
            return ResponseEntity.ok(ldapAuthService.obtenerUsuariosConRol());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/admin/cambiar-rol")
    public ResponseEntity<?> cambiarRol(@RequestBody AgregarGrupoRequest request) {
        try {
            ldapAdminService.cambiarGrupoUsuario(request.getUsername(), request.getGrupo());
            return ResponseEntity.ok("Rol actualizado correctamente");
        } catch (Exception e) {
            e.printStackTrace(); // ← agregá esto
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}