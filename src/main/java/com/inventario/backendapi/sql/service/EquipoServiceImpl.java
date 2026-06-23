package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.EquipoDTO;
import com.inventario.backendapi.sql.model.Equipo;
import com.inventario.backendapi.sql.model.Responsable;
import com.inventario.backendapi.sql.model.Ubicacion;
import com.inventario.backendapi.sql.repository.EquipoRepository;
import com.inventario.backendapi.sql.repository.ResponsableRepository;
import com.inventario.backendapi.sql.repository.UbicacionRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EquipoServiceImpl extends BaseSqlServiceImpl<Equipo, Integer> implements EquipoService {

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private UbicacionRepository ubicacionRepository;

    @Autowired
    private ResponsableRepository responsableRepository;

    @Autowired
    public EquipoServiceImpl(EquipoRepository equipoRepository) {
        super(equipoRepository);
    }

    @Override
    public EquipoDTO convertirADTO(Equipo equipo) {
        EquipoDTO dto = modelMapper.map(equipo, EquipoDTO.class);
        dto.setUbicacionId(equipo.getUbicacion() != null ? equipo.getUbicacion().getId() : null);
        dto.setResponsableId(equipo.getResponsable() != null ? equipo.getResponsable().getId() : null);

        if (equipo.getUbicacion() != null) {
            dto.setEdificio(equipo.getUbicacion().getEdificio().name());
            dto.setArea(equipo.getUbicacion().getArea().name());
            dto.setNumero(equipo.getUbicacion().getNumeroArea());
        }
        if (equipo.getResponsable() != null) {
            dto.setNombre(equipo.getResponsable().getNombre());
            dto.setApellido(equipo.getResponsable().getApellido());
            dto.setTipo(equipo.getResponsable().getTipo() != null ? equipo.getResponsable().getTipo().name() : null);
        }
        dto.setFechaMantenimiento(equipo.getFechaMantenimiento());
        dto.setFechaDevolucion(equipo.getFechaDevolucion());
        return dto;
    }

    @Override
    public Equipo save(Equipo equipo) throws Exception {
        if (equipo.getUbicacion() != null && equipo.getUbicacion().getId() != null) {
            Ubicacion u = ubicacionRepository.findById(equipo.getUbicacion().getId())
                    .orElseThrow(() -> new Exception("Ubicacion no encontrada"));
            equipo.setUbicacion(u);
        }
        if (equipo.getResponsable() != null && equipo.getResponsable().getId() != null) {
            Responsable r = responsableRepository.findById(equipo.getResponsable().getId())
                    .orElseThrow(() -> new Exception("Responsable no encontrado"));
            equipo.setResponsable(r);
        }
        return super.save(equipo);
    }
}