package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class EquipoDTO {
    private Integer id;
    private String codigo;
    private LocalDate fechaAdquisicion;
    private Integer ubicacionId;
    private Integer responsableId;
}