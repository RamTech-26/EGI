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
    private LocalDate fechaMantenimiento;
    private LocalDate fechaDevolucion;
    private Integer ubicacionId;
    private Integer responsableId;

    private String edificio;
    private String area;
    private Integer numero;
    private String nombre;
    private String apellido;
    private String tipo;
}