import "./style.css";

import {
  ROLES,
  ApiError,
  login,
  logout,
  setMockSession,
  getCurrentUser,
  canCreate,
  canEdit,
  canDelete,
  obtenerEquipos,
  obtenerInventarioCompleto,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  obtenerUbicaciones,
  obtenerResponsables
} from "./api.js";

import {
  equiposMock,
  ubicacionesMock,
  responsablesMock,
  obtenerInventarioMockPorId
} from "./mockData.js";

const app = document.querySelector("#app");

let modoConexion = "API";

function getRoleLabel(role) {
  const labels = {
    LECTOR: "Lector",
    EDITOR: "Editor",
    ADMINISTRADOR: "Administrador"
  };

  return labels[role] || "Sin rol";
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="login-logo-box">
          <img src="/logo-uncuyo-itu.png" alt="UNCuyo SITU Virtual" class="login-logo" />
        </div>

        <div class="login-title-box">
          <h1>Sistema de Inventario SITU</h1>
          <p>Gestión de equipos informáticos, ubicaciones, responsables y componentes de hardware.</p>
        </div>

        <form id="login-form" class="login-form">
          <label for="username">Usuario</label>
          <input type="text" id="username" placeholder="Usuario de Active Directory" required />

          <label for="password">Contraseña</label>
          <input type="password" id="password" placeholder="Contraseña" required />

          <button type="submit">Acceder</button>
        </form>

        <p id="login-message" class="message"></p>

        <div class="login-help">
          <p><strong>Modo prueba:</strong> admin = administrador, editor = edición, ana = lectura.</p>
        </div>

        <div class="login-footer">
          <span>Inventario SITU</span>
          <span>JWT + Active Directory</span>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const password = document.querySelector("#password").value.trim();
    const message = document.querySelector("#login-message");

    try {
      await login(username, password);
      modoConexion = "API";
      renderDashboard();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        message.className = "message error-message";
        message.textContent = error.message;
        return;
      }

      console.warn("Backend no disponible. Se utiliza modo demostración.", error);

      setMockSession(username || "ana");
      modoConexion = "DEMO";
      renderDashboard();
    }
  });
}

function renderDashboard() {
  const currentUser = getCurrentUser();

  app.innerHTML = `
    <main class="layout">
      <aside class="sidebar">
        <h2>SITU</h2>
        <p>Sistema de Inventario</p>

        <button id="btn-inventario">Equipos informáticos</button>
        ${canCreate() ? `<button id="btn-alta">Registrar equipo</button>` : ""}
        <button id="btn-salir">Cerrar sesión</button>
      </aside>

      <section class="content">
        <header class="topbar">
          <div>
            <h1>Inventario de equipos informáticos</h1>
            <p>
              Usuario: ${currentUser.username} |
              Rol: ${getRoleLabel(currentUser.role)}
            </p>
          </div>
          <span>${modoConexion === "API" ? "Conectado a API" : "Modo demostración"}</span>
        </header>

        <section id="main-section"></section>
      </section>
    </main>
  `;

  document.querySelector("#btn-inventario").addEventListener("click", renderInventario);

  const btnAlta = document.querySelector("#btn-alta");
  if (btnAlta) {
    btnAlta.addEventListener("click", renderAltaEquipo);
  }

  document.querySelector("#btn-salir").addEventListener("click", () => {
    logout();
    renderLogin();
  });

  renderInventario();
}

async function renderInventario() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Equipos registrados</h2>
          <p>Listado de equipos dados de alta en el sistema de inventario.</p>
        </div>

        <button id="btn-recargar" class="primary-button">Actualizar listado</button>
      </div>

      <div class="permissions-summary">
        ${renderResumenPermisos()}
      </div>

      <div id="tabla-container">
        <p>Cargando equipos...</p>
      </div>
    </section>
  `;

  document.querySelector("#btn-recargar").addEventListener("click", renderInventario);

  try {
    const equipos = await obtenerEquipos();
    modoConexion = "API";
    renderTablaEquipos(equipos);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      alert("La sesión venció o el token no es válido. Volvé a iniciar sesión.");
      logout();
      renderLogin();
      return;
    }

    if (error instanceof ApiError && error.status === 403) {
      alert("No tenés permisos para consultar el inventario.");
      return;
    }

    console.warn("No se pudo conectar con /api/equipos. Se muestran datos de demostración.", error);
    modoConexion = "DEMO";
    renderTablaEquipos(equiposMock);
  }
}

function renderResumenPermisos() {
  const permisos = [];

  permisos.push("Ver inventario");
  permisos.push("Ver detalle");

  if (canCreate()) {
    permisos.push("Crear equipo");
  }

  if (canEdit()) {
    permisos.push("Editar equipo");
  }

  if (canDelete()) {
    permisos.push("Eliminar equipo");
  }

  return `
    <strong>Permisos activos:</strong>
    ${permisos.map((permiso) => `<span>${permiso}</span>`).join("")}
  `;
}

function renderTablaEquipos(equipos) {
  const container = document.querySelector("#tabla-container");

  if (!equipos.length) {
    container.innerHTML = `<p>No hay equipos registrados.</p>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Código del equipo</th>
          <th>Fecha de adquisición</th>
          <th>ID ubicación</th>
          <th>ID responsable</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${equipos.map((equipo) => `
          <tr>
            <td>${equipo.id}</td>
            <td><strong>${equipo.codigo}</strong></td>
            <td>${equipo.fechaAdquisicion}</td>
            <td>${equipo.ubicacionId}</td>
            <td>${equipo.responsableId}</td>
            <td>
              <button class="btn-ver" data-id="${equipo.id}">Ver detalle</button>
              ${canEdit() ? `<button class="btn-editar" data-id="${equipo.id}">Editar</button>` : ""}
              ${canDelete() ? `<button class="btn-eliminar" data-id="${equipo.id}">Eliminar</button>` : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.querySelectorAll(".btn-ver").forEach((button) => {
    button.addEventListener("click", () => renderDetalleInventario(button.dataset.id));
  });

  document.querySelectorAll(".btn-editar").forEach((button) => {
    button.addEventListener("click", () => renderEditarEquipo(button.dataset.id));
  });

  document.querySelectorAll(".btn-eliminar").forEach((button) => {
    button.addEventListener("click", () => eliminarEquipoDesdeVista(button.dataset.id));
  });
}

async function renderDetalleInventario(idEquipo) {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver al listado</button>
      <p>Cargando inventario completo del equipo...</p>
    </section>
  `;

  try {
    const inventario = await obtenerInventarioCompleto(idEquipo);
    modoConexion = "API";
    renderDetalle(inventario);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      alert("La sesión venció o el token no es válido. Volvé a iniciar sesión.");
      logout();
      renderLogin();
      return;
    }

    if (error instanceof ApiError && error.status === 403) {
      alert("No tenés permisos para ver este detalle.");
      renderInventario();
      return;
    }

    console.warn("No se pudo obtener /api/inventario/{idEquipo}. Se muestran datos de demostración.", error);
    modoConexion = "DEMO";
    renderDetalle(obtenerInventarioMockPorId(idEquipo));
  }
}

function renderDetalle(inventario) {
  const section = document.querySelector("#main-section");

  const { equipo, ubicacion, responsable, componentes } = inventario;

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver al listado</button>

      <h2>Inventario completo - ${equipo.codigo}</h2>
      <p>Información integrada del equipo, ubicación, responsable asignado y componentes de hardware.</p>

      <div class="detail-grid">
        <article>
          <h3>Equipo informático</h3>
          <p><strong>ID:</strong> ${equipo.id}</p>
          <p><strong>Código:</strong> ${equipo.codigo}</p>
          <p><strong>Fecha de adquisición:</strong> ${equipo.fechaAdquisicion}</p>
        </article>

        <article>
          <h3>Ubicación</h3>
          <p><strong>ID:</strong> ${ubicacion.id}</p>
          <p><strong>Edificio:</strong> ${ubicacion.edificio}</p>
          <p><strong>Área:</strong> ${ubicacion.area}</p>
        </article>

        <article>
          <h3>Responsable</h3>
          <p><strong>Nombre:</strong> ${responsable.nombre} ${responsable.apellido}</p>
          <p><strong>Email:</strong> ${responsable.email}</p>
          <p><strong>Teléfono:</strong> ${responsable.telefono}</p>
        </article>

        <article>
          <h3>Componentes de hardware</h3>
          ${componentes.map((componente) => `
            <p>
              <strong>${componente.tipo}:</strong>
              ${componente.marca} ${componente.modelo}
              <span class="estado activo">${componente.estado}</span>
            </p>
          `).join("")}
        </article>
      </div>
    </section>
  `;

  document.querySelector("#volver").addEventListener("click", renderInventario);
}

async function cargarSelects(selectUbicacion, selectResponsable) {
  try {
    const ubicaciones = await obtenerUbicaciones();
    const responsables = await obtenerResponsables();

    llenarSelects(selectUbicacion, selectResponsable, ubicaciones, responsables);
  } catch (error) {
    console.warn("No se pudieron cargar ubicaciones/responsables. Se utilizan datos de demostración.", error);
    llenarSelects(selectUbicacion, selectResponsable, ubicacionesMock, responsablesMock);
  }
}

function llenarSelects(selectUbicacion, selectResponsable, ubicaciones, responsables) {
  selectUbicacion.innerHTML = `
    <option value="">Seleccionar ubicación</option>
    ${ubicaciones.map((ubicacion) => `
      <option value="${ubicacion.id}">
        ${ubicacion.edificio} - ${ubicacion.area}
      </option>
    `).join("")}
  `;

  selectResponsable.innerHTML = `
    <option value="">Seleccionar responsable</option>
    ${responsables.map((responsable) => `
      <option value="${responsable.id}">
        ${responsable.nombre} ${responsable.apellido}
      </option>
    `).join("")}
  `;
}

async function renderAltaEquipo() {
  if (!canCreate()) {
    alert("No tenés permisos para crear equipos.");
    renderInventario();
    return;
  }

  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <h2>Registrar equipo informático</h2>
      <p>Alta de equipo vinculando una ubicación y un responsable existente.</p>

      <form id="form-alta" class="form-grid">
        <input id="codigo" placeholder="Código del equipo: PC-01" required />
        <input id="fechaAdquisicion" type="date" required />

        <select id="ubicacionId" required>
          <option value="">Cargando ubicaciones...</option>
        </select>

        <select id="responsableId" required>
          <option value="">Cargando responsables...</option>
        </select>

        <button type="submit">Guardar equipo</button>
      </form>
    </section>
  `;

  const selectUbicacion = document.querySelector("#ubicacionId");
  const selectResponsable = document.querySelector("#responsableId");

  await cargarSelects(selectUbicacion, selectResponsable);

  document.querySelector("#form-alta").addEventListener("submit", async (event) => {
    event.preventDefault();

    const equipo = {
      codigo: document.querySelector("#codigo").value.trim(),
      fechaAdquisicion: document.querySelector("#fechaAdquisicion").value,
      ubicacion: {
        id: Number(selectUbicacion.value)
      },
      responsable: {
        id: Number(selectResponsable.value)
      }
    };

    try {
      await crearEquipo(equipo);
      alert("Equipo registrado correctamente");
      renderInventario();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        alert("No tenés permisos para crear equipos.");
        return;
      }

      console.warn("No se pudo crear el equipo. Registro simulado.", error);
      alert("Registro simulado: backend no disponible o endpoint pendiente.");
      renderInventario();
    }
  });
}

async function renderEditarEquipo(idEquipo) {
  if (!canEdit()) {
    alert("No tenés permisos para editar equipos.");
    renderInventario();
    return;
  }

  let inventario;

  try {
    inventario = await obtenerInventarioCompleto(idEquipo);
  } catch (error) {
    console.warn("No se pudo obtener el equipo desde API para editar. Se utiliza mock.", error);
    inventario = obtenerInventarioMockPorId(idEquipo);
  }

  const equipo = inventario.equipo;

  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver al listado</button>

      <h2>Editar equipo informático</h2>
      <p>Modificación de datos básicos del equipo, ubicación y responsable.</p>

      <form id="form-editar" class="form-grid">
        <input id="codigo" value="${equipo.codigo}" placeholder="Código del equipo" required />
        <input id="fechaAdquisicion" type="date" value="${equipo.fechaAdquisicion}" required />

        <select id="ubicacionId" required>
          <option value="">Cargando ubicaciones...</option>
        </select>

        <select id="responsableId" required>
          <option value="">Cargando responsables...</option>
        </select>

        <button type="submit">Guardar cambios</button>
      </form>
    </section>
  `;

  document.querySelector("#volver").addEventListener("click", renderInventario);

  const selectUbicacion = document.querySelector("#ubicacionId");
  const selectResponsable = document.querySelector("#responsableId");

  await cargarSelects(selectUbicacion, selectResponsable);

  selectUbicacion.value = equipo.ubicacionId;
  selectResponsable.value = equipo.responsableId;

  document.querySelector("#form-editar").addEventListener("submit", async (event) => {
    event.preventDefault();

    const equipoEditado = {
      codigo: document.querySelector("#codigo").value.trim(),
      fechaAdquisicion: document.querySelector("#fechaAdquisicion").value,
      ubicacion: {
        id: Number(selectUbicacion.value)
      },
      responsable: {
        id: Number(selectResponsable.value)
      }
    };

    try {
      await editarEquipo(idEquipo, equipoEditado);
      alert("Equipo editado correctamente");
      renderInventario();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        alert("No tenés permisos para editar equipos.");
        return;
      }

      console.warn("No se pudo editar el equipo. Edición simulada.", error);
      alert("Edición simulada: backend no disponible o endpoint pendiente.");
      renderInventario();
    }
  });
}

async function eliminarEquipoDesdeVista(id) {
  if (!canDelete()) {
    alert("No tenés permisos para eliminar equipos.");
    return;
  }

  const confirmado = confirm(`¿Seguro que querés eliminar el equipo con ID ${id}?`);

  if (!confirmado) return;

  try {
    await eliminarEquipo(id);
    alert("Equipo eliminado correctamente");
    renderInventario();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      alert("No tenés permisos para eliminar equipos.");
      return;
    }

    console.warn("No se pudo eliminar el equipo. Eliminación simulada.", error);
    alert("Eliminación simulada: backend no disponible o endpoint pendiente.");
  }
}

renderLogin();
