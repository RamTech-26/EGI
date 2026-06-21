const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) throw new Error("Usuario o contraseña incorrectos");
  const data = await response.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("roles", JSON.stringify(data.roles || []));
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("roles");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function obtenerEquipos() {
  const response = await fetch(`${API_URL}/api/equipos`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudieron obtener los equipos");
  return await response.json();
}

export async function obtenerInventarioCompleto(idEquipo) {
  const response = await fetch(`${API_URL}/api/inventario/${idEquipo}`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudo obtener el inventario completo");
  return await response.json();
}

export async function crearEquipo(equipo) {
  const response = await fetch(`${API_URL}/api/equipos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(equipo)
  });
  if (!response.ok) throw new Error("No se pudo crear el equipo");
  return await response.json();
}

export async function eliminarEquipo(id) {
  const response = await fetch(`${API_URL}/api/equipos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudo eliminar el equipo");
  return true;
}

export async function obtenerUbicaciones() {
  const response = await fetch(`${API_URL}/api/ubicaciones`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudieron obtener las ubicaciones");
  return await response.json();
}

export async function obtenerResponsables() {
  const response = await fetch(`${API_URL}/api/responsables`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudieron obtener los responsables");
  return await response.json();
}

export async function crearUbicacion(ubicacion) {
  const response = await fetch(`${API_URL}/api/ubicaciones`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ubicacion)
  });
  if (!response.ok) throw new Error("No se pudo crear la ubicación");
  return await response.json();
}

export async function crearResponsable(responsable) {
  const response = await fetch(`${API_URL}/api/responsables`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(responsable)
  });
  if (!response.ok) throw new Error("No se pudo crear el responsable");
  return await response.json();
}

export async function crearHardware(hardware) {
  const response = await fetch(`${API_URL}/api/hardware`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(hardware)
  });
  if (!response.ok) throw new Error("No se pudo crear el hardware");
  return await response.json();
}

export async function obtenerUsuariosAD() {
  const response = await fetch(`${API_URL}/api/auth/admin/usuarios`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("No se pudieron obtener los usuarios");
  return await response.json();
}

export async function cambiarRolUsuario(username, grupo) {
  const response = await fetch(`${API_URL}/api/auth/admin/cambiar-rol`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, grupo })
  });
  if (!response.ok) throw new Error("No se pudo cambiar el rol");
  return await response.json();
}