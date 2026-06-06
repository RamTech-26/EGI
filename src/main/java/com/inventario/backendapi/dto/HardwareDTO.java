package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
@NoArgsConstructor
public class HardwareDTO {

    @Id
    private String id;
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
