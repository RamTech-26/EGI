package com.inventario.backendapi.mongo.service;

import com.inventario.backendapi.dto.HardwareDTO;
import com.inventario.backendapi.mongo.model.Hardware;
import com.inventario.backendapi.mongo.repository.HardwareRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
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

    @Override
    public HardwareDTO create(HardwareDTO dto) {
        Hardware hardware = modelMapper.map(dto, Hardware.class);
        return modelMapper.map(repository.save(hardware), HardwareDTO.class);
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