package com.inventario.backendapi.mongo.service;

import com.inventario.backendapi.dto.HardwareDTO;

import java.util.List;

public interface HardwareService {
    List<HardwareDTO> getAll();
    HardwareDTO getById(String id);
    HardwareDTO create(HardwareDTO dto);
    HardwareDTO update(String id, HardwareDTO dto);
    void delete(String id);

}