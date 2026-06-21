package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.*;
import com.inventario.backendapi.mongo.service.HardwareService;
import com.inventario.backendapi.sql.model.Equipo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventarioCompletoServiceImpl implements InventarioCompletoService {

    @Autowired
    private EquipoService equipoService;

    @Autowired
    private UbicacionService ubicacionService;

    @Autowired
    private ResponsableService responsableService;

    @Autowired
    private HardwareService hardwareService;

    @Override
    public InventarioCompletoDTO obtenerInventarioCompleto(Integer idEquipo) throws Exception {
        Equipo equipo = equipoService.findById(idEquipo);
        EquipoDTO equipoDTO = equipoService.convertirADTO(equipo);

        UbicacionDTO ubicacionDTO = null;
        if (equipo.getUbicacion() != null) {
            ubicacionDTO = ubicacionService.convertirADTO(equipo.getUbicacion());
        }

        ResponsableDTO responsableDTO = null;
        if (equipo.getResponsable() != null) {
            responsableDTO = responsableService.convertirADTO(equipo.getResponsable());
        }

        List<HardwareDTO> componentes;
        try {
            componentes = List.of(hardwareService.getById(equipo.getCodigo()));
        } catch (Exception e) {
            componentes = List.of();
        }

        InventarioCompletoDTO dto = new InventarioCompletoDTO();
        dto.setEquipo(equipoDTO);
        dto.setUbicacion(ubicacionDTO);
        dto.setResponsable(responsableDTO);
        dto.setComponentes(componentes);

        return dto;
    }

    @Override
    public List<InventarioCompletoDTO> obtenerTodos() throws Exception {
        List<Equipo> equipos = equipoService.findAll();
        List<InventarioCompletoDTO> resultado = new java.util.ArrayList<>();
        for (Equipo equipo : equipos) {
            resultado.add(obtenerInventarioCompleto(equipo.getId()));
        }
        return resultado;
    }
}