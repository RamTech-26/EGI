import "./style.css";
import {
  login,
  logout,
  obtenerEquipos,
  obtenerInventarioCompleto,
  crearEquipo,
  eliminarEquipo,
  obtenerUbicaciones,
  obtenerResponsables,
  crearUbicacion,
  crearResponsable,
  crearHardware
} from "./api.js";

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
      message.textContent = "Usuario o contraseña incorrectos";
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
        <button id="btn-alta-equipo">Alta de equipo</button>
        <button id="btn-alta-ubicacion">Alta de ubicación</button>
        <button id="btn-alta-responsable">Alta de responsable</button>
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
  document.querySelector("#btn-alta-equipo").addEventListener("click", renderAltaEquipo);
  document.querySelector("#btn-alta-ubicacion").addEventListener("click", renderAltaUbicacion);
  document.querySelector("#btn-alta-responsable").addEventListener("click", renderAltaResponsable);
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
          <p>Listado obtenido desde /api/equipos.</p>
        </div>
        <button id="btn-recargar" class="primary-button">Recargar</button>
      </div>
      <div id="tabla-container"><p>Cargando equipos...</p></div>
    </section>
  `;

  document.querySelector("#btn-recargar").addEventListener("click", renderInventario);

  try {
    const equipos = await obtenerEquipos();
    renderTablaEquipos(equipos);
  } catch (error) {
    document.querySelector("#tabla-container").innerHTML = `<p>Error al cargar equipos.</p>`;
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

  document.querySelector("#volver").addEventListener("click", renderInventario);

  try {
    const inventario = await obtenerInventarioCompleto(idEquipo);
    renderDetalle(inventario);
  } catch (error) {
    section.innerHTML = `
      <section class="panel">
        <button id="volver">← Volver</button>
        <p>Error al cargar el inventario del equipo ${idEquipo}.</p>
      </section>
    `;
    document.querySelector("#volver").addEventListener("click", renderInventario);
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
          ${componentes && componentes.length ? componentes.map((c) => `
            <div class="componente">
              <p><strong>Fabricante:</strong> ${c.fabricante}</p>
              <p><strong>Modelo:</strong> ${c.modelo}</p>
              <p><strong>Tipo:</strong> ${c.tipo}</p>
              <p><strong>CPU:</strong> ${c.cpu}</p>
              <p><strong>RAM:</strong> ${c.ram}</p>
              <p><strong>Disco:</strong> ${c.disco}</p>
              <p><strong>SO:</strong> ${c.sistemaOperativo}</p>
              <p><strong>Monitor:</strong> ${c.monitor}</p>
              <p><strong>Mouse:</strong> ${c.mouse}</p>
              <p><strong>Teclado:</strong> ${c.teclado}</p>
            </div>
          `).join("") : "<p>Sin componentes registrados.</p>"}
        </article>
      </div>
    </section>
  `;

  document.querySelector("#volver").addEventListener("click", renderInventario);
}

async function renderAltaEquipo() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <h2>Alta de equipo</h2>
      <form id="form-alta" class="form-grid">
        <h3>Datos del equipo (SQL Server)</h3>
        <input id="codigo" placeholder="Código: PC-01" required />
        <input id="fechaAdquisicion" type="date" required />
        <select id="ubicacionId" required>
          <option value="">Cargando ubicaciones...</option>
        </select>
        <select id="responsableId" required>
          <option value="">Cargando responsables...</option>
        </select>

        <h3>Datos de hardware (MongoDB)</h3>
        <input id="hw-fabricante" placeholder="Fabricante (ej: Dell)" required />
        <input id="hw-modelo" placeholder="Modelo (ej: OptiPlex 3000)" required />
        <input id="hw-tipo" placeholder="Tipo (ej: desktop, notebook)" required />
        <input id="hw-cpu" placeholder="CPU (ej: i5-12400)" required />
        <input id="hw-ram" placeholder="RAM (ej: 16GB)" required />
        <input id="hw-disco" placeholder="Disco (ej: 512GB SSD)" required />
        <input id="hw-so" placeholder="Sistema Operativo (ej: Windows 11)" required />
        <input id="hw-monitor" placeholder="Monitor (ej: Dell 24&quot;)" />
        <input id="hw-mouse" placeholder="Mouse (ej: Dell)" />
        <input id="hw-teclado" placeholder="Teclado (ej: Dell)" />

        <button type="submit">Guardar equipo completo</button>
      </form>
    </section>
  `;

  try {
    const [ubicaciones, responsables] = await Promise.all([
      obtenerUbicaciones(),
      obtenerResponsables()
    ]);

    document.querySelector("#ubicacionId").innerHTML =
        `<option value="">Seleccionar ubicación</option>` +
        ubicaciones.map((u) => `<option value="${u.id}">${u.edificio} - ${u.area}</option>`).join("");

    document.querySelector("#responsableId").innerHTML =
        `<option value="">Seleccionar responsable</option>` +
        responsables.map((r) => `<option value="${r.id}">${r.nombre} ${r.apellido}</option>`).join("");

  } catch (error) {
    document.querySelector("#ubicacionId").innerHTML = `<option value="">Error al cargar</option>`;
    document.querySelector("#responsableId").innerHTML = `<option value="">Error al cargar</option>`;
  }

  document.querySelector("#form-alta").addEventListener("submit", async (event) => {
    event.preventDefault();

    const codigo = document.querySelector("#codigo").value.trim();

    const equipo = {
      codigo,
      fechaAdquisicion: document.querySelector("#fechaAdquisicion").value,
      ubicacion: { id: Number(document.querySelector("#ubicacionId").value) },
      responsable: { id: Number(document.querySelector("#responsableId").value) }
    };

    const hardware = {
      id: codigo,
      fabricante: document.querySelector("#hw-fabricante").value.trim(),
      modelo: document.querySelector("#hw-modelo").value.trim(),
      tipo: document.querySelector("#hw-tipo").value.trim(),
      cpu: document.querySelector("#hw-cpu").value.trim(),
      ram: document.querySelector("#hw-ram").value.trim(),
      disco: document.querySelector("#hw-disco").value.trim(),
      sistemaOperativo: document.querySelector("#hw-so").value.trim(),
      monitor: document.querySelector("#hw-monitor").value.trim(),
      mouse: document.querySelector("#hw-mouse").value.trim(),
      teclado: document.querySelector("#hw-teclado").value.trim()
    };

    try {
      await crearEquipo(equipo);
      await crearHardware(hardware);
      alert("Equipo y hardware creados correctamente");
      renderInventario();
    } catch (error) {
      alert("Error al crear el equipo. Verificá que el código no exista ya.");
    }
  });
}

function renderAltaUbicacion() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <h2>Alta de ubicación</h2>
      <form id="form-ubicacion" class="form-grid">
        <input id="edificio" placeholder="Edificio (ej: Central)" required />
        <select id="area" required>
          <option value="">Seleccionar área</option>
          <option value="AULA">AULA</option>
          <option value="LABORATORIO">LABORATORIO</option>
          <option value="SECRETARIA">SECRETARIA</option>
        </select>
        <button type="submit">Guardar ubicación</button>
      </form>
    </section>
  `;

  document.querySelector("#form-ubicacion").addEventListener("submit", async (event) => {
    event.preventDefault();
    const ubicacion = {
      edificio: document.querySelector("#edificio").value.trim(),
      area: document.querySelector("#area").value
    };
    try {
      await crearUbicacion(ubicacion);
      alert("Ubicación creada correctamente");
      renderInventario();
    } catch (error) {
      alert("Error al crear la ubicación.");
    }
  });
}

function renderAltaResponsable() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <h2>Alta de responsable</h2>
      <form id="form-responsable" class="form-grid">
        <input id="nombre" placeholder="Nombre" required />
        <input id="apellido" placeholder="Apellido" required />
        <input id="email" type="email" placeholder="Email (ej: juan@itu.local)" required />
        <input id="telefono" placeholder="Teléfono" required />
        <button type="submit">Guardar responsable</button>
      </form>
    </section>
  `;

  document.querySelector("#form-responsable").addEventListener("submit", async (event) => {
    event.preventDefault();
    const responsable = {
      nombre: document.querySelector("#nombre").value.trim(),
      apellido: document.querySelector("#apellido").value.trim(),
      email: document.querySelector("#email").value.trim(),
      telefono: document.querySelector("#telefono").value.trim()
    };
    try {
      await crearResponsable(responsable);
      alert("Responsable creado correctamente");
      renderInventario();
    } catch (error) {
      alert("Error al crear el responsable.");
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
    alert("Error al eliminar el equipo.");
  }
}

renderLogin();