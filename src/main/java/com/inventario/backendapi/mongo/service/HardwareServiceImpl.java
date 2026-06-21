package com.inventario.backendapi.mongo.service;

import com.inventario.backendapi.dto.HardwareDTO;
import com.inventario.backendapi.mongo.model.Hardware;
import com.inventario.backendapi.mongo.repository.HardwareRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HardwareServiceImpl implements HardwareService {

    private final HardwareRepository repository;
    private final ModelMapper modelMapper;

    @Override
    public List<HardwareDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(h -> modelMapper.map(h, HardwareDTO.class))
                .toList();
    }

    @Override
    public HardwareDTO getById(String id) {
        Hardware hardware = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hardware no encontrado: " + id));
        return modelMapper.map(hardware, HardwareDTO.class);
    }

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public HardwareDTO create(HardwareDTO dto) {
        System.out.println("Base de datos MongoDB: " + mongoTemplate.getDb().getName());
        System.out.println("Guardando hardware: " + dto.getId());
        Hardware hardware = modelMapper.map(dto, Hardware.class);
        Hardware saved = repository.save(hardware);
        System.out.println("Hardware guardado con id: " + saved.getId());
        return modelMapper.map(saved, HardwareDTO.class);
    }

    @Override
    public HardwareDTO update(String id, HardwareDTO dto) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hardware no encontrado: " + id));
        Hardware hardware = modelMapper.map(dto, Hardware.class);
        hardware.setId(id);
        return modelMapper.map(repository.save(hardware), HardwareDTO.class);
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }
}