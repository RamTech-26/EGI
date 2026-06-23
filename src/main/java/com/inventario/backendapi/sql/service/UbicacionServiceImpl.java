package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.UbicacionDTO;
import com.inventario.backendapi.sql.model.Ubicacion;
import com.inventario.backendapi.sql.repository.UbicacionRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UbicacionServiceImpl extends BaseSqlServiceImpl<Ubicacion, Integer> implements UbicacionService {

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    public UbicacionServiceImpl(UbicacionRepository ubicacionRepository) {
        super(ubicacionRepository);
    }

    @Override
    public UbicacionDTO convertirADTO(Ubicacion ubicacion) {
        UbicacionDTO dto = modelMapper.map(ubicacion, UbicacionDTO.class);
        dto.setArea(ubicacion.getArea().name());
        return dto;
    }
}