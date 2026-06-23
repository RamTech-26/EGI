package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.ResponsableDTO;
import com.inventario.backendapi.sql.model.Responsable;

public interface ResponsableService extends BaseSqlService<Responsable, Integer> {
    ResponsableDTO convertirADTO(Responsable responsable);
}