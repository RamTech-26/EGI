package com.inventario.backendapi.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // TODO: En producción, mover esta clave a variables de entorno (application.yml o Kubernetes Secret)
    private static final String SECRET = "ClaveSecretaSuperSeguraParaJWT1234567890";
    private static final long EXPIRATION_MS = 86400000; // 1 día

    // Convierte la clave secreta en un objeto Key para los algoritmos de firma
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    // Genera un token JWT firmado con el username y fecha de expiración
    public String generarToken(String username) {
        return Jwts.builder()
                .subject(username)                                          // dueño del token
                .issuedAt(new Date())                                       // fecha de emisión
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS)) // vencimiento
                .signWith(getSigningKey())                                  // firma con clave secreta
                .compact();                                                 // compacta a String
    }

    // Extrae el username del token (si el token es válido)
    public String obtenerUsername(String token) {
        return getClaims(token).getSubject();
    }

    // Valida que el token no esté vencido y tenga firma correcta
    public boolean validarToken(String token) {
        try {
            getClaims(token); // si no lanza excepción, es válido
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Parsea el token y obtiene los claims (datos contenidos)
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())   // verifica firma
                .build()
                .parseSignedClaims(token)      // analiza token firmado
                .getPayload();                 // devuelve los datos
    }
}