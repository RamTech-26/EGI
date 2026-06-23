package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginRequest {
    // TODO: En producción, este DTO se mantendrá igual; los campos son estándar.
    private String username;
    private String password;
}