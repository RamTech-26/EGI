package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.sql.model.Responsable;
import com.inventario.backendapi.sql.repository.ResponsableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ResponsableServiceImpl extends BaseSqlServiceImpl<Responsable, Integer> implements ResponsableService {

    @Autowired
    public ResponsableServiceImpl(ResponsableRepository responsableRepository) {
        super(responsableRepository);
    }
}