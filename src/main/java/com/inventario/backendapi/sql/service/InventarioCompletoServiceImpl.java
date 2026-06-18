package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.dto.*;
import com.inventario.backendapi.sql.model.Equipo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventarioCompletoServiceImpl implements InventarioCompletoService {

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

        // Mock MongoDB - reemplazar cuando P4 tenga HardwareService
        List<HardwareDTO> componentesMock = new ArrayList<>();
        HardwareDTO mock = new HardwareDTO();
        mock.setId("mock-1");
        mock.setFabricante("Intel");
        mock.setModelo("i7-13700K");
        mock.setTipo("CPU");
        mock.setCpu("Intel Core i7");
        mock.setRam("16GB");
        mock.setDisco("512GB SSD");
        mock.setSistemaOperativo("Windows 11");
        mock.setMonitor("24 pulgadas");
        mock.setMouse("Óptico");
        mock.setTeclado("Mecánico");
        componentesMock.add(mock);

        InventarioCompletoDTO dto = new InventarioCompletoDTO();
        dto.setEquipo(equipoDTO);
        dto.setUbicacion(ubicacionDTO);
        dto.setResponsable(responsableDTO);
        dto.setComponentes(componentesMock);

        return dto;
    }
}