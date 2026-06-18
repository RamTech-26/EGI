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
    ubicacionId: 1,
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
    edificio: "Anexo",
    area: "AULA"
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

export const inventarioCompletoMock = {
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
};
