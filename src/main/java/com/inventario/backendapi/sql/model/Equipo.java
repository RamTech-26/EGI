package com.inventario.backendapi.sql.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "equipos")
public class Equipo extends BaseSql {

    private String codigo;
    private LocalDate fechaAdquisicion;

    @ManyToOne
    @JoinColumn(name = "ubicacion_id")
    private Ubicacion ubicacion;

    @ManyToOne
    @JoinColumn(name = "responsable_id")
    private Responsable responsable;
}