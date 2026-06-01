package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.UbicacionDTO;
import com.inventario.backendapi.sql.model.Ubicacion;

public interface UbicacionService extends BaseSqlService<Ubicacion, Integer> {
    UbicacionDTO convertirADTO(Ubicacion ubicacion);
}