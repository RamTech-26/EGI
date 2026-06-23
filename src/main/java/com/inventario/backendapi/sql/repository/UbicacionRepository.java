package com.inventario.backendapi.sql.repository;

import com.inventario.backendapi.sql.model.Ubicacion;
import org.springframework.stereotype.Repository;

@Repository
public interface UbicacionRepository extends BaseSqlRepository<Ubicacion, Integer> {
}