//NOTA - SE LLENA PARA QUE NO FALLE PERO LUEGO AGUS LO DEBE COMPLETAR


package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class HardwareDTO {
    private String id;
    private Integer idEquipo;
    private String tipo;
    private String marca;
    private String modelo;
    private String estado;
}