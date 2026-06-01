package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.InventarioCompletoDTO;

public interface InventarioCompletoService {
    InventarioCompletoDTO obtenerInventarioCompleto(Integer idEquipo) throws Exception;
}