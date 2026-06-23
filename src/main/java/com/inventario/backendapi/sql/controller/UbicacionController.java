package com.inventario.backendapi.sql.controller;

import com.inventario.backendapi.dto.UbicacionDTO;
import com.inventario.backendapi.sql.model.Ubicacion;
import com.inventario.backendapi.sql.service.UbicacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ubicaciones")
public class UbicacionController {

    @Autowired
    private UbicacionService ubicacionService;

    @GetMapping
    public ResponseEntity<List<UbicacionDTO>> buscarTodos() throws Exception {
        List<UbicacionDTO> dtos = ubicacionService.findAll().stream()
                .map(u -> ubicacionService.convertirADTO(u))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UbicacionDTO> buscarPorId(@PathVariable Integer id) throws Exception {
        Ubicacion u = ubicacionService.findById(id);
        return ResponseEntity.ok(ubicacionService.convertirADTO(u));
    }

    @PostMapping
    public ResponseEntity<UbicacionDTO> guardar(@RequestBody Ubicacion ubicacion) throws Exception {
        Ubicacion guardada = ubicacionService.save(ubicacion);
        return ResponseEntity.ok(ubicacionService.convertirADTO(guardada));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UbicacionDTO> actualizar(@PathVariable Integer id, @RequestBody Ubicacion ubicacion) throws Exception {
        Ubicacion actualizada = ubicacionService.update(id, ubicacion);
        return ResponseEntity.ok(ubicacionService.convertirADTO(actualizada));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) throws Exception {
        ubicacionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}