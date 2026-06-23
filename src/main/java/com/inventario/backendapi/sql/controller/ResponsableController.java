package com.inventario.backendapi.sql.controller;

import com.inventario.backendapi.dto.ResponsableDTO;
import com.inventario.backendapi.sql.model.Responsable;
import com.inventario.backendapi.sql.service.ResponsableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/responsables")
public class ResponsableController {

    @Autowired
    private ResponsableService responsableService;

    @GetMapping
    public ResponseEntity<List<ResponsableDTO>> buscarTodos() throws Exception {
        List<ResponsableDTO> dtos = responsableService.findAll().stream()
                .map(r -> responsableService.convertirADTO(r))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponsableDTO> buscarPorId(@PathVariable Integer id) throws Exception {
        Responsable r = responsableService.findById(id);
        return ResponseEntity.ok(responsableService.convertirADTO(r));
    }

    @PostMapping
    public ResponseEntity<ResponsableDTO> guardar(@RequestBody Responsable responsable) throws Exception {
        Responsable guardado = responsableService.save(responsable);
        return ResponseEntity.ok(responsableService.convertirADTO(guardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponsableDTO> actualizar(@PathVariable Integer id, @RequestBody Responsable responsable) throws Exception {
        Responsable actualizado = responsableService.update(id, responsable);
        return ResponseEntity.ok(responsableService.convertirADTO(actualizado));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) throws Exception {
        responsableService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}