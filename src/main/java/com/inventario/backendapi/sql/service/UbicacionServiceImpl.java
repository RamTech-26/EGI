package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.sql.model.Ubicacion;
import com.inventario.backendapi.sql.repository.UbicacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UbicacionServiceImpl extends BaseSqlServiceImpl<Ubicacion, Integer> implements UbicacionService {

    @Autowired
    public UbicacionServiceImpl(UbicacionRepository ubicacionRepository) {
        super(ubicacionRepository);
    }
}