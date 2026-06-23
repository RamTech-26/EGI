package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.EquipoDTO;
import com.inventario.backendapi.sql.model.Equipo;

public interface EquipoService extends BaseSqlService<Equipo, Integer> {
    EquipoDTO convertirADTO(Equipo equipo);
}