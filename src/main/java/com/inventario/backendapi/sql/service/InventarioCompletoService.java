package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.InventarioCompletoDTO;

import java.util.List;

public interface InventarioCompletoService {
    InventarioCompletoDTO obtenerInventarioCompleto(Integer idEquipo) throws Exception;
    List<InventarioCompletoDTO> obtenerTodos() throws Exception;
}