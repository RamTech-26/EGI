package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.sql.model.Equipo;
import com.inventario.backendapi.sql.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EquipoServiceImpl extends BaseSqlServiceImpl<Equipo, Integer> implements EquipoService {

    @Autowired
    public EquipoServiceImpl(EquipoRepository equipoRepository) {
        super(equipoRepository);
    }
}