package com.inventario.backendapi.mongo.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hardware")
@Getter
@Setter
@NoArgsConstructor
public class Hardware {

    @Id
    private String id; // PC-01, NB-01
    private String fabricante;
    private String modelo;
    private String tipo;
    private String cpu;
    private String ram;
    private String disco;
    private String sistemaOperativo;
    private String monitor;
    private String mouse;
    private String teclado;
}
