package com.inventario.backendapi.sql.repository;

import com.inventario.backendapi.sql.model.Responsable;
import org.springframework.stereotype.Repository;

@Repository
public interface ResponsableRepository extends BaseSqlRepository<Responsable, Integer> {
}