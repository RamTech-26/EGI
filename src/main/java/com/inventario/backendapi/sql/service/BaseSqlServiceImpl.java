package com.inventario.backendapi.sql.service;

import com.inventario.backendapi.sql.model.BaseSql;
import com.inventario.backendapi.sql.repository.BaseSqlRepository;
import org.springframework.transaction.annotation.Transactional;
import java.io.Serializable;
import java.util.List;

public abstract class BaseSqlServiceImpl<E extends BaseSql, ID extends Serializable> implements BaseSqlService<E, ID> {

    protected BaseSqlRepository<E, ID> baseRepository;

    public BaseSqlServiceImpl(BaseSqlRepository<E, ID> baseRepository) {
        this.baseRepository = baseRepository;
    }

    @Override
    @Transactional
    public List<E> findAll() throws Exception {
        try {
            return baseRepository.findAll();
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    @Override
    @Transactional
    public E findById(ID id) throws Exception {
        try {
            return baseRepository.findById(id).orElseThrow();
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    @Override
    @Transactional
    public E save(E entity) throws Exception {
        try {
            return baseRepository.save(entity);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    @Override
    @Transactional
    public E update(ID id, E entity) throws Exception {
        try {
            return baseRepository.save(entity);
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }

    @Override
    @Transactional
    public boolean deleteById(ID id) throws Exception {
        try {
            baseRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            throw new Exception(e.getMessage());
        }
    }
}
