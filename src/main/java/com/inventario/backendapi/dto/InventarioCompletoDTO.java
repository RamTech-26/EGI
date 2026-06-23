package com.inventario.backendapi.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class InventarioCompletoDTO {
    private EquipoDTO equipo;
    private UbicacionDTO ubicacion;
    private ResponsableDTO responsable;
    private List<HardwareDTO> componentes;
}