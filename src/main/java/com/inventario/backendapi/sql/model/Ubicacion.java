package com.inventario.backendapi.sql.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@NoArgsConstructor
@Getter
@Setter
@Table(name = "ubicaciones")
public class Ubicacion extends BaseSql {

    private String edificio;
    @Enumerated(EnumType.STRING)
    private Area area;
}