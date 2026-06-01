package com.inventario.backendapi.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Extraer el header Authorization
        String authHeader = request.getHeader("Authorization");

        // Verificar si el header contiene un token Bearer
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7); // Quitar "Bearer "

            // Validar el token JWT
            if (jwtUtil.validarToken(token)) {
                String username = jwtUtil.obtenerUsername(token);

                // TODO: En producción, acá se cargarán los roles/authorities desde AD o desde el token
                /*
                *
                *
                *
                *               Roles / Authorities --> se cargan desde AD
                *
                *
                *
                *
                *
                * */

                // Por ahora se usa una lista vacía (sin roles específicos) para desarrollo y pruebas.
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());

                // Establecer la autenticación en el contexto de seguridad
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        // Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }
}