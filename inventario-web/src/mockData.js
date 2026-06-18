export const equiposMock = [
  {
    id: 1,
    codigo: "PC-01",
    fechaAdquisicion: "2025-03-15",
    ubicacionId: 1,
    responsableId: 1
  },
  {
    id: 2,
    codigo: "PC-02",
    fechaAdquisicion: "2025-04-10",
    ubicacionId: 2,
    responsableId: 2
  },
  {
    id: 3,
    codigo: "NOTE-01",
    fechaAdquisicion: "2024-11-22",
    ubicacionId: 3,
    responsableId: 1
  }
];

export const ubicacionesMock = [
  {
    id: 1,
    edificio: "Central",
    area: "LABORATORIO"
  },
  {
    id: 2,
    edificio: "Central",
    area: "AULA"
  },
  {
    id: 3,
    edificio: "Anexo",
    area: "SECRETARIA"
  }
];

export const responsablesMock = [
  {
    id: 1,
    nombre: "Juan",
    apellido: "Perez",
    email: "juan@correo.com",
    telefono: "123456"
  },
  {
    id: 2,
    nombre: "Ana",
    apellido: "Gomez",
    email: "ana@correo.com",
    telefono: "456789"
  }
];

export const inventariosCompletosMock = [
  {
    equipo: {
      id: 1,
      codigo: "PC-01",
      fechaAdquisicion: "2025-03-15",
      ubicacionId: 1,
      responsableId: 1
    },
    ubicacion: {
      id: 1,
      edificio: "Central",
      area: "LABORATORIO"
    },
    responsable: {
      id: 1,
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@correo.com",
      telefono: "123456"
    },
    componentes: [
      {
        id: "mock-1",
        idEquipo: 1,
        tipo: "CPU",
        marca: "Intel",
        modelo: "i7",
        estado: "Operativo"
      },
      {
        id: "mock-2",
        idEquipo: 1,
        tipo: "RAM",
        marca: "Kingston",
        modelo: "16GB DDR4",
        estado: "Operativo"
      },
      {
        id: "mock-3",
        idEquipo: 1,
        tipo: "Disco",
        marca: "Western Digital",
        modelo: "512GB SSD",
        estado: "Operativo"
      }
    ]
  },
  {
    equipo: {
      id: 2,
      codigo: "PC-02",
      fechaAdquisicion: "2025-04-10",
      ubicacionId: 2,
      responsableId: 2
    },
    ubicacion: {
      id: 2,
      edificio: "Central",
      area: "AULA"
    },
    responsable: {
      id: 2,
      nombre: "Ana",
      apellido: "Gomez",
      email: "ana@correo.com",
      telefono: "456789"
    },
    componentes: [
      {
        id: "mock-4",
        idEquipo: 2,
        tipo: "CPU",
        marca: "Intel",
        modelo: "i5",
        estado: "Operativo"
      },
      {
        id: "mock-5",
        idEquipo: 2,
        tipo: "RAM",
        marca: "Kingston",
        modelo: "8GB DDR4",
        estado: "Operativo"
      },
      {
        id: "mock-6",
        idEquipo: 2,
        tipo: "Disco",
        marca: "Seagate",
        modelo: "1TB HDD",
        estado: "Operativo"
      }
    ]
  },
  {
    equipo: {
      id: 3,
      codigo: "NOTE-01",
      fechaAdquisicion: "2024-11-22",
      ubicacionId: 3,
      responsableId: 1
    },
    ubicacion: {
      id: 3,
      edificio: "Anexo",
      area: "SECRETARIA"
    },
    responsable: {
      id: 1,
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@correo.com",
      telefono: "123456"
    },
    componentes: [
      {
        id: "mock-7",
        idEquipo: 3,
        tipo: "CPU",
        marca: "AMD",
        modelo: "Ryzen 5",
        estado: "Operativo"
      },
      {
        id: "mock-8",
        idEquipo: 3,
        tipo: "RAM",
        marca: "Crucial",
        modelo: "16GB DDR4",
        estado: "Operativo"
      },
      {
        id: "mock-9",
        idEquipo: 3,
        tipo: "Disco",
        marca: "Kingston",
        modelo: "512GB SSD",
        estado: "Operativo"
      }
    ]
  }
];

export function obtenerInventarioMockPorId(idEquipo) {
  return inventariosCompletosMock.find(
    (inventario) => inventario.equipo.id === Number(idEquipo)
  ) || inventariosCompletosMock[0];
}
