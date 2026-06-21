package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.*;
import com.inventario.backendapi.sql.model.Equipo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Service
public class InventarioCompletoServiceImpl implements InventarioCompletoService {

    @Value("${mongo.service.url:http://localhost:8080}")
    private String mongoServiceUrl;

    @Autowired
    private EquipoService equipoService;

    @Autowired
    private UbicacionService ubicacionService;

    @Autowired
    private ResponsableService responsableService;

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

        // Llamada real al servicio MongoDB de P4
        String codigoEquipo = equipo.getCodigo();
        String mongoUrl = mongoServiceUrl + "/api/hardware/" + codigoEquipo;
        RestTemplate restTemplate = new RestTemplate();
        HardwareDTO[] componentesArray = restTemplate.getForObject(mongoUrl, HardwareDTO[].class);
        List<HardwareDTO> componentes = Arrays.asList(componentesArray);

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