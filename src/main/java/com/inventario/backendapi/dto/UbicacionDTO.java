package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UbicacionDTO {
    private Integer id;
    private String edificio;
    private String area;
    private Integer numeroArea;
}