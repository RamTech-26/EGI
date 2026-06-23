package com.inventario.backendapi.sql.repository;

import com.inventario.backendapi.sql.model.Equipo;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipoRepository extends BaseSqlRepository<Equipo, Integer> {
}