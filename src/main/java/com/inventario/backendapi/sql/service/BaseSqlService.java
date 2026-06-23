package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.sql.model.BaseSql;
import java.io.Serializable;
import java.util.List;

public interface BaseSqlService<E extends BaseSql, ID extends Serializable> {
    List<E> findAll() throws Exception;
    E findById(ID id) throws Exception;
    E save(E entity) throws Exception;
    E update(ID id, E entity) throws Exception;
    boolean deleteById(ID id) throws Exception;
}
