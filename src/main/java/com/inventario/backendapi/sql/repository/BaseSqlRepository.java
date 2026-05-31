package com.inventario.backendapi.sql.repository;

import com.inventario.backendapi.sql.model.BaseSql;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;
import java.io.Serializable;

@NoRepositoryBean
public interface BaseSqlRepository<E extends BaseSql, ID extends Serializable> extends JpaRepository<E, ID> {
}