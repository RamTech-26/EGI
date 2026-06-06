package com.inventario.backendapi.mongo.controller;

import com.inventario.backendapi.dto.HardwareDTO;
import com.inventario.backendapi.mongo.service.HardwareService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware")
@RequiredArgsConstructor
public class HardwareController {

    private final HardwareService service;

    @GetMapping
    public ResponseEntity<List<HardwareDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HardwareDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<HardwareDTO> create(@RequestBody HardwareDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HardwareDTO> update(@PathVariable String id, @RequestBody HardwareDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}