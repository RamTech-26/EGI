package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResponsableDTO {
    private Integer id;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
}