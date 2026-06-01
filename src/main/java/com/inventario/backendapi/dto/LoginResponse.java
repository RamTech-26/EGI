package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    // TODO: En producción, podría agregarse "roles" o "authorities" cuando se integre con AD.
    /*
    *
    *
    *           Roles/Authorities --> vienen desde AD
    *
    *
    *
    * */
}