import "./style.css";
import {
  login,
  logout,
  obtenerEquipos,
  obtenerInventarioCompleto,
  crearEquipo,
  eliminarEquipo
} from "./api.js";

import {
  equiposMock,
  inventarioCompletoMock
} from "./mockData.js";

const app = document.querySelector("#app");

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <div class="login-logo-box">
          <img src="/logo-uncuyo-itu.png" alt="UNCuyo ITU Virtual" class="login-logo" />
        </div>

        <div class="login-title-box">
          <h1>Inventario EGI</h1>
          <p>Sistema de inventario seguro para aulas y laboratorios</p>
        </div>

        <form id="login-form" class="login-form">
          <label for="username">Usuario</label>
          <input type="text" id="username" placeholder="admin" required />

          <label for="password">Contraseña</label>
          <input type="password" id="password" placeholder="admin" required />

          <button type="submit">Acceder</button>
        </form>

        <p id="login-message" class="message"></p>

        <div class="login-footer">
          <span>Frontend P5</span>
          <span>JWT + Backend API</span>
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
      const data = await login(username, password);
      message.textContent = `Sesión iniciada como ${data.username}`;
      renderDashboard();
    } catch (error) {
      console.warn("Backend no disponible o login fallido. Usando token mock temporal.", error);

      localStorage.setItem("token", "mock-token");
      localStorage.setItem("username", username);

      renderDashboard();
    }
  });
}
function renderDashboard() {
  const username = localStorage.getItem("username") || "usuario";

  app.innerHTML = `
    <main class="layout">
      <aside class="sidebar">
        <h2>EGI</h2>
        <p>Inventario Seguro</p>

        <button id="btn-inventario">Inventario</button>
        <button id="btn-alta">Alta de equipo</button>
        <button id="btn-salir">Cerrar sesión</button>
      </aside>

      <section class="content">
        <header class="topbar">
          <div>
            <h1>Gestión de inventario de aulas</h1>
            <p>Usuario autenticado: ${username}</p>
          </div>
          <span>JWT activo</span>
        </header>

        <section id="main-section"></section>
      </section>
    </main>
  `;

  document.querySelector("#btn-inventario").addEventListener("click", renderInventario);
  document.querySelector("#btn-alta").addEventListener("click", renderAltaEquipo);
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
          <p>Listado obtenido desde /api/equipos. Si el backend no responde, se muestran datos mock.</p>
        </div>

        <button id="btn-recargar" class="primary-button">Recargar</button>
      </div>

      <div id="tabla-container">
        <p>Cargando equipos...</p>
      </div>
    </section>
  `;

  document.querySelector("#btn-recargar").addEventListener("click", renderInventario);

  try {
    const equipos = await obtenerEquipos();
    renderTablaEquipos(equipos);
  } catch (error) {
    console.warn("No se pudo conectar con /api/equipos. Usando mock.", error);
    renderTablaEquipos(equiposMock);
  }
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
          <th>Código</th>
          <th>Fecha adquisición</th>
          <th>Ubicación ID</th>
          <th>Responsable ID</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${equipos.map((equipo) => `
          <tr>
            <td>${equipo.id}</td>
            <td>${equipo.codigo}</td>
            <td>${equipo.fechaAdquisicion}</td>
            <td>${equipo.ubicacionId}</td>
            <td>${equipo.responsableId}</td>
            <td>
              <button class="btn-ver" data-id="${equipo.id}">Ver inventario</button>
              <button class="btn-eliminar" data-id="${equipo.id}">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.querySelectorAll(".btn-ver").forEach((button) => {
    button.addEventListener("click", () => renderDetalleInventario(button.dataset.id));
  });

  document.querySelectorAll(".btn-eliminar").forEach((button) => {
    button.addEventListener("click", () => eliminarEquipoDesdeVista(button.dataset.id));
  });
}

async function renderDetalleInventario(idEquipo) {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver</button>
      <p>Cargando inventario completo...</p>
    </section>
  `;

  try {
    const inventario = await obtenerInventarioCompleto(idEquipo);
    renderDetalle(inventario);
  } catch (error) {
    console.warn("No se pudo obtener /api/inventario/{idEquipo}. Usando mock.", error);
    renderDetalle({
      ...inventarioCompletoMock,
      equipo: {
        ...inventarioCompletoMock.equipo,
        id: Number(idEquipo)
      }
    });
  }
}

function renderDetalle(inventario) {
  const section = document.querySelector("#main-section");

  const { equipo, ubicacion, responsable, componentes } = inventario;

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver</button>

      <h2>Inventario completo del equipo ${equipo.codigo}</h2>

      <div class="detail-grid">
        <article>
          <h3>Equipo - SQL Server</h3>
          <p><strong>ID:</strong> ${equipo.id}</p>
          <p><strong>Código:</strong> ${equipo.codigo}</p>
          <p><strong>Fecha adquisición:</strong> ${equipo.fechaAdquisicion}</p>
        </article>

        <article>
          <h3>Ubicación - SQL Server</h3>
          <p><strong>ID:</strong> ${ubicacion.id}</p>
          <p><strong>Edificio:</strong> ${ubicacion.edificio}</p>
          <p><strong>Área:</strong> ${ubicacion.area}</p>
        </article>

        <article>
          <h3>Responsable - SQL Server</h3>
          <p><strong>Nombre:</strong> ${responsable.nombre} ${responsable.apellido}</p>
          <p><strong>Email:</strong> ${responsable.email}</p>
          <p><strong>Teléfono:</strong> ${responsable.telefono}</p>
        </article>

        <article>
          <h3>Componentes - MongoDB</h3>
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

function renderAltaEquipo() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <h2>Alta de equipo</h2>
      <p>Este formulario envía POST /api/equipos con ubicación y responsable por ID.</p>

      <form id="form-alta" class="form-grid">
        <input id="codigo" placeholder="Código: PC-01" required />
        <input id="fechaAdquisicion" type="date" required />
        <input id="ubicacionId" type="number" placeholder="ID ubicación" required />
        <input id="responsableId" type="number" placeholder="ID responsable" required />

        <button type="submit">Guardar equipo</button>
      </form>
    </section>
  `;

  document.querySelector("#form-alta").addEventListener("submit", async (event) => {
    event.preventDefault();

    const equipo = {
      codigo: document.querySelector("#codigo").value.trim(),
      fechaAdquisicion: document.querySelector("#fechaAdquisicion").value,
      ubicacion: {
        id: Number(document.querySelector("#ubicacionId").value)
      },
      responsable: {
        id: Number(document.querySelector("#responsableId").value)
      }
    };

    try {
      await crearEquipo(equipo);
      alert("Equipo creado correctamente");
      renderInventario();
    } catch (error) {
      console.warn("No se pudo crear el equipo. Simulación local.", error);
      alert("Alta simulada: backend no disponible o endpoint pendiente.");
      renderInventario();
    }
  });
}

async function eliminarEquipoDesdeVista(id) {
  const confirmado = confirm(`¿Seguro que querés eliminar el equipo con ID ${id}?`);

  if (!confirmado) return;

  try {
    await eliminarEquipo(id);
    alert("Equipo eliminado correctamente");
    renderInventario();
  } catch (error) {
    console.warn("No se pudo eliminar el equipo. Simulación local.", error);
    alert("Eliminación simulada: backend no disponible o endpoint pendiente.");
  }
}

renderLogin();

