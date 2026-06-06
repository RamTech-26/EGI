package com.inventario.backendapi.mongo.repository;

import com.inventario.backendapi.mongo.model.Hardware;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HardwareRepository extends MongoRepository<Hardware, String> {
}