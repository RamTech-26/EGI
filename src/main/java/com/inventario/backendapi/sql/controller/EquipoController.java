package com.inventario.backendapi.sql.controller;

import com.inventario.backendapi.dto.EquipoDTO;
import com.inventario.backendapi.sql.model.Equipo;
import com.inventario.backendapi.sql.service.EquipoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    @Autowired
    private EquipoService equipoService;

    @GetMapping
    public ResponseEntity<List<EquipoDTO>> buscarTodos() throws Exception {
        List<EquipoDTO> dtos = equipoService.findAll().stream()
                .map(e -> equipoService.convertirADTO(e))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoDTO> buscarPorId(@PathVariable Integer id) throws Exception {
        Equipo e = equipoService.findById(id);
        return ResponseEntity.ok(equipoService.convertirADTO(e));
    }

    @PostMapping
    public ResponseEntity<EquipoDTO> guardar(@RequestBody Equipo equipo) throws Exception {
        Equipo guardado = equipoService.save(equipo);
        return ResponseEntity.ok(equipoService.convertirADTO(guardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoDTO> actualizar(@PathVariable Integer id, @RequestBody Equipo equipo) throws Exception {
        Equipo actualizado = equipoService.update(id, equipo);
        return ResponseEntity.ok(equipoService.convertirADTO(actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) throws Exception {
        equipoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}