import "./style.css";
import { equiposMock } from "./mockData.js";

const app = document.querySelector("#app");

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-card">
        <h1>Inventario EGI</h1>
        <p>Ecosistema de Inventario Seguro</p>

        <form id="login-form">
          <label>Usuario</label>
          <input type="text" placeholder="admin@inventario.local" required />

          <label>Contraseña</label>
          <input type="password" placeholder="********" required />

          <button type="submit">Ingresar</button>
        </form>
      </section>
    </main>
  `;

  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    renderDashboard();
  });
}

function renderDashboard() {
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
            <p>Frontend P5 - datos mock hasta conectar con backend-api</p>
          </div>
          <span>Puerto 3000</span>
        </header>

        <section id="main-section"></section>
      </section>
    </main>
  `;

  document.querySelector("#btn-inventario").addEventListener("click", renderInventario);
  document.querySelector("#btn-alta").addEventListener("click", renderAltaEquipo);
  document.querySelector("#btn-salir").addEventListener("click", renderLogin);

  renderInventario();
}

function renderInventario() {
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Inventario por laboratorio</h2>
          <p>Consulta visual de equipos por aula/laboratorio.</p>
        </div>

        <div class="filters">
          <select id="filtro-lab">
            <option value="Todos">Todos</option>
            <option value="Laboratorio 1">Laboratorio 1</option>
            <option value="Laboratorio 2">Laboratorio 2</option>
          </select>
          <button id="btn-buscar">Buscar</button>
        </div>
      </div>

      <div id="tabla-container"></div>
    </section>
  `;

  document.querySelector("#btn-buscar").addEventListener("click", () => {
    const laboratorio = document.querySelector("#filtro-lab").value;

    const equipos = laboratorio === "Todos"
      ? equiposMock
      : equiposMock.filter((equipo) => equipo.aula === laboratorio);

    renderTabla(equipos);
  });

  renderTabla(equiposMock);
}

function renderTabla(equipos) {
  const container = document.querySelector("#tabla-container");

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Laboratorio</th>
          <th>Banco</th>
          <th>Responsable</th>
          <th>CPU</th>
          <th>RAM</th>
          <th>Disco</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${equipos.map((equipo) => `
          <tr>
            <td>${equipo.id_equipo}</td>
            <td>${equipo.aula}</td>
            <td>${equipo.banco}</td>
            <td>${equipo.responsable}</td>
            <td>${equipo.componentes.cpu}</td>
            <td>${equipo.componentes.ram}</td>
            <td>${equipo.componentes.disco}</td>
            <td><span class="estado ${equipo.estado.toLowerCase()}">${equipo.estado}</span></td>
            <td>
              <button class="btn-ver" data-id="${equipo.id_equipo}">Ver</button>
              <button class="btn-baja" data-id="${equipo.id_equipo}">Baja</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  document.querySelectorAll(".btn-ver").forEach((button) => {
    button.addEventListener("click", () => verDetalle(button.dataset.id));
  });

  document.querySelectorAll(".btn-baja").forEach((button) => {
    button.addEventListener("click", () => {
      alert(`Baja lógica simulada del equipo ${button.dataset.id}`);
    });
  });
}

function verDetalle(idEquipo) {
  const equipo = equiposMock.find((item) => item.id_equipo === idEquipo);
  const section = document.querySelector("#main-section");

  section.innerHTML = `
    <section class="panel">
      <button id="volver">← Volver</button>

      <h2>Detalle del equipo ${equipo.id_equipo}</h2>

      <div class="detail-grid">
        <article>
          <h3>Ubicación - SQL Server</h3>
          <p><strong>Laboratorio:</strong> ${equipo.aula}</p>
          <p><strong>Banco:</strong> ${equipo.banco}</p>
          <p><strong>Responsable:</strong> ${equipo.responsable}</p>
          <p><strong>Estado:</strong> ${equipo.estado}</p>
        </article>

        <article>
          <h3>Componentes - MongoDB</h3>
          <p><strong>Fabricante:</strong> ${equipo.componentes.fabricante}</p>
          <p><strong>Modelo:</strong> ${equipo.componentes.modelo}</p>
          <p><strong>CPU:</strong> ${equipo.componentes.cpu}</p>
          <p><strong>RAM:</strong> ${equipo.componentes.ram}</p>
          <p><strong>Disco:</strong> ${equipo.componentes.disco}</p>
          <p><strong>Sistema operativo:</strong> ${equipo.componentes.sistemaOperativo}</p>
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
      <p>Formulario visual preparado para conectar luego con POST /equipos.</p>

      <form id="form-alta" class="form-grid">
        <input placeholder="Código de equipo" required />
        <input placeholder="Laboratorio" required />
        <input placeholder="Banco" required />
        <input placeholder="Responsable" required />
        <input placeholder="CPU" required />
        <input placeholder="RAM" required />
        <input placeholder="Disco" required />
        <input placeholder="Sistema operativo" required />
        <button type="submit">Guardar equipo</button>
      </form>
    </section>
  `;

  document.querySelector("#form-alta").addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Alta simulada. Luego se conectará con el backend.");
  });
}

renderLogin();
