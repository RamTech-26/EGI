package com.inventario.backendapi.sql.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "responsables")
public class Responsable extends BaseSql {

    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
}