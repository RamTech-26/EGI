package com.inventario.backendapi.sql.controller;

import com.inventario.backendapi.dto.InventarioCompletoDTO;
import com.inventario.backendapi.sql.service.InventarioCompletoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
public class InventarioCompletoController {

    @Autowired
    private InventarioCompletoService inventarioCompletoService;

    @GetMapping("/{idEquipo}")
    public ResponseEntity<InventarioCompletoDTO> obtenerInventarioCompleto(@PathVariable Integer idEquipo) throws Exception {
        return ResponseEntity.ok(inventarioCompletoService.obtenerInventarioCompleto(idEquipo));
    }
    @GetMapping
    public ResponseEntity<List<InventarioCompletoDTO>> obtenerTodos() throws Exception {
        return ResponseEntity.ok(inventarioCompletoService.obtenerTodos());
    }
}