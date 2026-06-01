package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.EquipoDTO;
import com.inventario.backendapi.sql.model.Equipo;
import com.inventario.backendapi.sql.repository.EquipoRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EquipoServiceImpl extends BaseSqlServiceImpl<Equipo, Integer> implements EquipoService {

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    public EquipoServiceImpl(EquipoRepository equipoRepository) {
        super(equipoRepository);
    }

    @Override
    public EquipoDTO convertirADTO(Equipo equipo) {
        EquipoDTO dto = modelMapper.map(equipo, EquipoDTO.class);
        dto.setUbicacionId(equipo.getUbicacion() != null ? equipo.getUbicacion().getId() : null);
        dto.setResponsableId(equipo.getResponsable() != null ? equipo.getResponsable().getId() : null);
        return dto;
    }
}