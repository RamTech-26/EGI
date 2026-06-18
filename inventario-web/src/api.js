const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const ROLES = {
  LECTOR: "LECTOR",
  EDITOR: "EDITOR",
  ADMINISTRADOR: "ADMINISTRADOR"
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function normalizeRole(role) {
  if (!role) return ROLES.LECTOR;

  const value = String(role).toUpperCase();

  if (value.includes("ADMIN")) return ROLES.ADMINISTRADOR;
  if (value.includes("EDIT") || value.includes("EDITOR")) return ROLES.EDITOR;
  if (value.includes("LECT") || value.includes("READ")) return ROLES.LECTOR;

  return ROLES.LECTOR;
}

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];

    if (!base64Url) return {};

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn("No se pudo leer el payload del JWT.", error);
    return {};
  }
}

function extractFirstRole(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value[0];

    if (typeof first === "string") return first;
    if (first?.authority) return first.authority;
    if (first?.role) return first.role;
    if (first?.name) return first.name;

    return null;
  }

  if (typeof value === "string") return value;

  if (value.authority) return value.authority;
  if (value.role) return value.role;
  if (value.name) return value.name;

  return null;
}

function extractRoleFromLoginResponse(data) {
  const directRole =
    data.role ||
    data.rol ||
    data.grupo ||
    data.group ||
    extractFirstRole(data.roles) ||
    extractFirstRole(data.authorities) ||
    extractFirstRole(data.groups) ||
    extractFirstRole(data.grupos);

  if (directRole) {
    return normalizeRole(directRole);
  }

  const jwtPayload = decodeJwtPayload(data.token);

  const jwtRole =
    jwtPayload.role ||
    jwtPayload.rol ||
    jwtPayload.grupo ||
    jwtPayload.group ||
    extractFirstRole(jwtPayload.roles) ||
    extractFirstRole(jwtPayload.authorities) ||
    extractFirstRole(jwtPayload.groups) ||
    extractFirstRole(jwtPayload.grupos);

  return normalizeRole(jwtRole);
}

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

async function handleResponse(response, errorMessage) {
  if (response.status === 401) {
    throw new ApiError("Sesión inválida o token vencido.", 401);
  }

  if (response.status === 403) {
    throw new ApiError("No tenés permisos para realizar esta acción.", 403);
  }

  if (!response.ok) {
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return true;
  }

  return await response.json();
}

export async function login(username, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await handleResponse(response, "Usuario o contraseña incorrectos");
  const role = extractRoleFromLoginResponse(data);

  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username || username);
  localStorage.setItem("role", role);

  return {
    ...data,
    role
  };
}

export function setMockSession(username) {
  const normalizedUsername = String(username || "").toLowerCase();

  let role = ROLES.LECTOR;

  if (normalizedUsername === "admin" || normalizedUsername === "administrador") {
    role = ROLES.ADMINISTRADOR;
  }

  if (normalizedUsername === "editor" || normalizedUsername === "editor") {
    role = ROLES.EDITOR;
  }

  if (normalizedUsername === "ana" || normalizedUsername === "lector") {
    role = ROLES.LECTOR;
  }

  localStorage.setItem("token", "mock-token");
  localStorage.setItem("username", username || "ana");
  localStorage.setItem("role", role);

  return {
    username: username || "ana",
    role
  };
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
}

export function getCurrentUser() {
  return {
    username: localStorage.getItem("username") || "usuario",
    role: localStorage.getItem("role") || ROLES.LECTOR
  };
}

export function canView() {
  return true;
}

export function canCreate() {
  const { role } = getCurrentUser();

  return role === ROLES.ADMINISTRADOR;
}

export function canEdit() {
  const { role } = getCurrentUser();

  return role === ROLES.ADMINISTRADOR || role === ROLES.EDITOR;
}

export function canDelete() {
  const { role } = getCurrentUser();

  return role === ROLES.ADMINISTRADOR;
}

export async function obtenerEquipos() {
  const response = await fetch(`${API_URL}/api/equipos`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  return await handleResponse(response, "No se pudieron obtener los equipos");
}

export async function obtenerInventarioCompleto(idEquipo) {
  const response = await fetch(`${API_URL}/api/inventario/${idEquipo}`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  return await handleResponse(response, "No se pudo obtener el inventario completo");
}

export async function crearEquipo(equipo) {
  const response = await fetch(`${API_URL}/api/equipos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(equipo)
  });

  return await handleResponse(response, "No se pudo crear el equipo");
}

export async function editarEquipo(id, equipo) {
  const response = await fetch(`${API_URL}/api/equipos/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(equipo)
  });

  return await handleResponse(response, "No se pudo editar el equipo");
}

export async function eliminarEquipo(id) {
  const response = await fetch(`${API_URL}/api/equipos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return await handleResponse(response, "No se pudo eliminar el equipo");
}

export async function obtenerUbicaciones() {
  const response = await fetch(`${API_URL}/api/ubicaciones`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  return await handleResponse(response, "No se pudieron obtener las ubicaciones");
}

export async function obtenerResponsables() {
  const response = await fetch(`${API_URL}/api/responsables`, {
    method: "GET",
    headers: getAuthHeaders()
  });

  return await handleResponse(response, "No se pudieron obtener los responsables");
}
